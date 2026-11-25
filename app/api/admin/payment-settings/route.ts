import { requireAdminAnyPermission } from "@/lib/auth/admin";
import {
  OrderDataError,
  getPaymentSettings,
  updatePaymentSettings,
} from "@/lib/orders";
import type { PaymentSettings } from "@/lib/payment";

/** Returns configured Order Received / Payment page content and wallet addresses. */
export async function GET() {
  const gate = await requireAdminAnyPermission([
    "orders.read",
    "orders.write",
    "config.view",
  ]);
  if ("response" in gate) return gate.response;

  const paymentSettings = await getPaymentSettings();
  return Response.json({ paymentSettings }, { status: 200 });
}

/** Updates Order Received / Payment page content and wallet addresses in Neon Postgres. */
export async function PATCH(request: Request) {
  const gate = await requireAdminAnyPermission(["orders.write", "config.view"]);
  if ("response" in gate) return gate.response;

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
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  try {
    const paymentSettings = await updatePaymentSettings(
      body as Partial<PaymentSettings>,
    );
    return Response.json({ paymentSettings }, { status: 200 });
  } catch (err) {
    if (err instanceof OrderDataError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to update payment settings:", err);
    return Response.json(
      { error: "Unable to update payment settings." },
      { status: 500 },
    );
  }
}
