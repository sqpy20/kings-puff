import { requireAdminApi } from "@/lib/auth/admin";
import { getAdminDbStats } from "@/lib/db";
import { hasAnyPermission } from "@/lib/rbac";

/** Verifies an authenticated admin session and returns Lakebase Postgres telemetry when permitted. */
export async function GET() {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  const canViewTelemetry = hasAnyPermission(
    gate.user.permissions,
    ["overview.view", "config.view"],
    gate.user.isSuperAdmin,
  );

  const database = canViewTelemetry ? await getAdminDbStats() : null;
  return Response.json({ user: gate.user, database }, { status: 200 });
}
