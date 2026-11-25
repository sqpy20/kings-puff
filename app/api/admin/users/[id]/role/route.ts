import { requireAdminAnyPermission } from "@/lib/auth/admin";
import {
  assignUserRole,
  parseRbacJsonBody,
  rbacErrorResponse,
} from "@/lib/rbac-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminAnyPermission(["users.write", "roles.write"]);
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const body = await parseRbacJsonBody(request);
    const roleSlug =
      typeof body.roleSlug === "string" ? body.roleSlug.trim() : "";

    if (!roleSlug) {
      return Response.json(
        { error: "roleSlug is required." },
        { status: 400 },
      );
    }

    const user = await assignUserRole(id, roleSlug, gate.user.id);
    return Response.json({ user }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
