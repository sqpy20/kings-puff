import {
  requireAdminAnyPermission,
  requireAdminPermission,
} from "@/lib/auth/admin";
import {
  createAdminUser,
  listAdminUsers,
  parseRbacJsonBody,
  rbacErrorResponse,
} from "@/lib/rbac-data";

export async function GET() {
  const gate = await requireAdminAnyPermission(["users.read", "roles.read"]);
  if ("response" in gate) return gate.response;

  try {
    const users = await listAdminUsers();
    return Response.json({ users }, { status: 200 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const gate = await requireAdminPermission("users.write");
  if ("response" in gate) return gate.response;

  try {
    const body = await parseRbacJsonBody(request);
    const origin =
      request.headers.get("origin") || new URL(request.url).origin;
    const user = await createAdminUser(body, gate.user.id, origin);
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    return rbacErrorResponse(err);
  }
}
