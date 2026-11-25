import { requireAdminPermission } from "@/lib/auth/admin";
import { PERMISSIONS } from "@/lib/rbac";
import {
  createRole,
  listRoles,
  parseRbacJsonBody,
  rbacErrorResponse,
} from "@/lib/rbac-data";

export async function GET() {
  const gate = await requireAdminPermission("roles.read");
  if ("response" in gate) return gate.response;

  try {
    const roles = await listRoles();
    return Response.json(
      { roles, permissionCatalog: PERMISSIONS },
      { status: 200 },
    );
  } catch (err) {
    return rbacErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminPermission("roles.write");
  if ("response" in gate) return gate.response;

  try {
    const body = await parseRbacJsonBody(request);
    const role = await createRole(body);
    return Response.json({ role }, { status: 201 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
