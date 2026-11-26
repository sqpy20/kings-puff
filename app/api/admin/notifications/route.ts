import { requireAdminApi } from "@/lib/auth/admin";
import {
  OrderDataError,
  listSuperAdminNotifications,
  markSuperAdminNotificationsRead,
} from "@/lib/orders";

/** Lists order notifications and unread count exclusively for active Super Admins. */
export async function GET() {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  if (!gate.user.isSuperAdmin) {
    return Response.json(
      { error: "Forbidden: Super Admin access required." },
      { status: 403 },
    );
  }

  const data = await listSuperAdminNotifications(gate.user.id);
  return Response.json(data, { status: 200 });
}

/** Marks one or all order notifications as read for the signed-in Super Admin. */
export async function PATCH(request: Request) {
  const gate = await requireAdminApi();
  if ("response" in gate) return gate.response;

  if (!gate.user.isSuperAdmin) {
    return Response.json(
      { error: "Forbidden: Super Admin access required." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { id?: unknown; markAll?: unknown })
      : {};

  try {
    if (payload.markAll === true) {
      await markSuperAdminNotificationsRead(gate.user.id);
    } else if (payload.id !== undefined) {
      const id = Number(payload.id);
      await markSuperAdminNotificationsRead(gate.user.id, id);
    } else {
      return Response.json(
        { error: 'Specify "id" or "markAll: true".' },
        { status: 400 },
      );
    }

    const data = await listSuperAdminNotifications(gate.user.id);
    return Response.json(data, { status: 200 });
  } catch (err) {
    if (err instanceof OrderDataError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to update notifications:", err);
    return Response.json(
      { error: "Unable to update notifications." },
      { status: 500 },
    );
  }
}
