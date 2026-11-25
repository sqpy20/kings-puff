import { requireAdminPermission } from "@/lib/auth/admin";
import {
  deleteAdminUser,
  parseRbacJsonBody,
  rbacErrorResponse,
  updateAdminUser,
} from "@/lib/rbac-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminPermission("users.write");
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const body = await parseRbacJsonBody(request);
    const user = await updateAdminUser(id, body, gate.user.id);
    return Response.json({ user }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminPermission("users.write");
  if ("response" in gate) return gate.response;

  try {
    const { id } = await params;
    const result = await deleteAdminUser(id, gate.user.id);
    return Response.json(result, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
