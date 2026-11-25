import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminUsers, rbacErrorResponse } from "@/lib/rbac-data";

export async function GET() {
  const gate = await requireAdminPermission("roles.read");
  if ("response" in gate) return gate.response;

  try {
    const users = await listAdminUsers();
    return Response.json({ users }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
