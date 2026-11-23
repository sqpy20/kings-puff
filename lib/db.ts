import "server-only";
import { Pool } from "pg";
import { LOW_STOCK_THRESHOLD } from "./catalog";

export type AdminDbStats = {
  connected: boolean;
  branch: string;
  databaseName: string;
  serverTime: string;
  totalUsers: number;
  adminUsers: number;
  activeSessions: number;
  catalogCount: number;
  productCount: number;
  activeProductCount: number;
  lowStockCount: number;
  error?: string;
};

const globalForPg = globalThis as typeof globalThis & {
  __momoPgPool?: Pool;
};

/** Returns a shared pooled Postgres client configured for Lakebase runtime traffic. */
export function getPool(): Pool {
  if (!globalForPg.__momoPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }
    globalForPg.__momoPgPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return globalForPg.__momoPgPool;
}

export const pool = getPool();

/** Queries Lakebase Postgres, Neon Auth, and storefront catalog/inventory metrics. */
export async function getAdminDbStats(): Promise<AdminDbStats> {
  const branch = process.env.NEON_BRANCH ?? "production";

  try {
    const db = getPool();
    const [infoRes, countsRes, storeRes] = await Promise.all([
      db.query<{ server_time: Date | string; database_name: string }>(
        "SELECT NOW() AS server_time, current_database() AS database_name",
      ),
      db.query<{
        total_users: number;
        admin_users: number;
        active_sessions: number;
      }>(`
        SELECT
          (SELECT COUNT(*)::int FROM neon_auth."user") AS total_users,
          (
            SELECT COUNT(*)::int
            FROM neon_auth."user"
            WHERE EXISTS (
              SELECT 1
              FROM unnest(string_to_array(lower(COALESCE(role, '')), ',')) AS r
              WHERE trim(r) = 'admin'
            )
          ) AS admin_users,
          (
            SELECT COUNT(*)::int
            FROM neon_auth.session
            WHERE "expiresAt" > NOW()
          ) AS active_sessions
      `),
      db.query<{
        catalog_count: number;
        product_count: number;
        active_product_count: number;
        low_stock_count: number;
      }>(
        `SELECT
           (SELECT COUNT(*)::int FROM public.catalogs) AS catalog_count,
           (SELECT COUNT(*)::int FROM public.products) AS product_count,
           (SELECT COUNT(*)::int FROM public.products WHERE active = true) AS active_product_count,
           (SELECT COUNT(*)::int FROM public.products WHERE stock_qty <= $1) AS low_stock_count`,
        [LOW_STOCK_THRESHOLD],
      ),
    ]);

    const info = infoRes.rows[0];
    const counts = countsRes.rows[0];
    const store = storeRes.rows[0];
    const rawTime = info?.server_time;
    const serverTime =
      rawTime instanceof Date
        ? rawTime.toISOString()
        : rawTime
          ? String(rawTime)
          : "";

    return {
      connected: true,
      branch,
      databaseName: info?.database_name ?? "neondb",
      serverTime,
      totalUsers: counts?.total_users ?? 0,
      adminUsers: counts?.admin_users ?? 0,
      activeSessions: counts?.active_sessions ?? 0,
      catalogCount: store?.catalog_count ?? 0,
      productCount: store?.product_count ?? 0,
      activeProductCount: store?.active_product_count ?? 0,
      lowStockCount: store?.low_stock_count ?? 0,
    };
  } catch {
    return {
      connected: false,
      branch,
      databaseName: "unavailable",
      serverTime: "",
      totalUsers: 0,
      adminUsers: 0,
      activeSessions: 0,
      catalogCount: 0,
      productCount: 0,
      activeProductCount: 0,
      lowStockCount: 0,
      error: "Unable to query Lakebase Postgres.",
    };
  }
}
