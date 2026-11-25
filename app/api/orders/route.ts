import { isMailConfigured, sendOrderEmails } from "@/lib/mail";
import {
  OrderDataError,
  createOrder,
  getPaymentSettings,
} from "@/lib/orders";

/** Public endpoint that validates checkout payloads, persists an order, and sends emails. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Invalid order request payload." },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(body as Record<string, unknown>);

    if (isMailConfigured()) {
      try {
        const settings = await getPaymentSettings();
        await sendOrderEmails(order, settings);
      } catch (mailErr) {
        console.error("Failed to dispatch order emails:", mailErr);
      }
    }

    return Response.json(
      {
        order,
        accessToken: order.accessToken,
        orderNumber: order.orderNumber,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderDataError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to create order:", err);
    return Response.json(
      { error: "Unable to place your order right now. Please try again." },
      { status: 500 },
    );
  }
}
