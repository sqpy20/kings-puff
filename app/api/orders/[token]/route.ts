import { isMailConfigured, sendOrderPaymentSubmittedEmail } from "@/lib/mail";
import {
  OrderDataError,
  getOrderByToken,
  updateOrderStatusByToken,
} from "@/lib/orders";

type Params = { params: Promise<{ token: string }> };

/** Public order status endpoint keyed by random 32-char access token. */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }
  return Response.json({ order }, { status: 200 });
}

/** Updates a pending order status (confirm payment sent or cancel) by access token. */
export async function PATCH(request: Request, { params }: Params) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const action =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { action?: unknown }).action
      : undefined;

  if (action !== "cancel" && action !== "confirm_sent") {
    return Response.json(
      { error: 'Action must be "cancel" or "confirm_sent".' },
      { status: 400 },
    );
  }

  try {
    const order = await updateOrderStatusByToken(token, action);

    if (action === "confirm_sent" && isMailConfigured()) {
      try {
        await sendOrderPaymentSubmittedEmail(order);
      } catch (mailErr) {
        console.error("Failed to notify handler of submitted payment:", mailErr);
      }
    }

    return Response.json({ order }, { status: 200 });
  } catch (err) {
    if (err instanceof OrderDataError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to update order status:", err);
    return Response.json(
      { error: "Unable to update order right now." },
      { status: 500 },
    );
  }
}
