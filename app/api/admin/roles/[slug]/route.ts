import { requireAdminPermission } from "@/lib/auth/admin";
import {
  deleteRole,
  parseRbacJsonBody,
  rbacErrorResponse,
  updateRole,
} from "@/lib/rbac-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdminPermission("roles.write");
  if ("response" in gate) return gate.response;

  try {
    const { slug } = await params;
    const body = await parseRbacJsonBody(request);
    const role = await updateRole(slug, body);
    return Response.json({ role }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdminPermission("roles.write");
  if ("response" in gate) return gate.response;

  try {
    const { slug } = await params;
    const result = await deleteRole(slug);
    return Response.json(result, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
