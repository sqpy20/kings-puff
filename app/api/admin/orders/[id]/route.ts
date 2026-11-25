import { requireAdminPermission } from "@/lib/auth/admin";
import { OrderDataError, adminUpdateOrderStatus } from "@/lib/orders";
import { ORDER_STATUS_OPTIONS, type OrderStatus } from "@/lib/payment";

const VALID_STATUSES = new Set<string>(ORDER_STATUS_OPTIONS.map((o) => o.id));

type Params = { params: Promise<{ id: string }> };

/** Updates an order's payment/fulfillment status from the admin dashboard. */
export async function PATCH(request: Request, { params }: Params) {
  const gate = await requireAdminPermission("orders.write");
  if ("response" in gate) return gate.response;

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return Response.json({ error: "Invalid order ID." }, { status: 400 });
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

  const rawStatus =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { status?: unknown }).status
      : undefined;

  if (typeof rawStatus !== "string" || !VALID_STATUSES.has(rawStatus)) {
    return Response.json(
      { error: "Please provide a valid order status." },
      { status: 400 },
    );
  }

  try {
    const order = await adminUpdateOrderStatus(orderId, rawStatus as OrderStatus);
    return Response.json({ order }, { status: 200 });
  } catch (err) {
    if (err instanceof OrderDataError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to update admin order status:", err);
    return Response.json(
      { error: "Unable to update order status." },
      { status: 500 },
    );
  }
}
