import { requireAdminPermission } from "@/lib/auth/admin";
import {
  RbacError,
  assignUserRole,
  parseRbacJsonBody,
  rbacErrorResponse,
} from "@/lib/rbac-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminPermission("roles.write");
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const body = await parseRbacJsonBody(request);
    const roleSlug =
      typeof body.roleSlug === "string" ? body.roleSlug.trim() : "";
    if (!roleSlug) {
      throw new RbacError(400, "roleSlug is required.");
    }
    const user = await assignUserRole(id, roleSlug, gate.user.id);
    return Response.json({ user }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
