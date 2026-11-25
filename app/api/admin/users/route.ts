import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminUsers } from "@/lib/rbac-data";

export async function GET() {
  const gate = await requireAdminPermission("roles.read");
  if ("response" in gate) return gate.response;

  const users = await listAdminUsers();
  return Response.json({ users }, { status: 200 });
}
