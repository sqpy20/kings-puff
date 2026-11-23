import { requireAdminApi } from "@/lib/auth/admin";
import { getAdminDbStats } from "@/lib/db";

/** Verifies an authenticated admin session and returns Lakebase Postgres telemetry. */
export async function GET() {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  const database = await getAdminDbStats();
  return Response.json({ user: gate.user, database }, { status: 200 });
}
