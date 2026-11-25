import { requireAdminAnyPermission } from "@/lib/auth/admin";
import { getAdminOrderStats, listAdminOrders } from "@/lib/orders";

/** Lists placed orders and aggregated order stats for the admin dashboard. */
export async function GET(request: Request) {
  const gate = await requireAdminAnyPermission(["orders.read", "orders.write"]);
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const paymentMethod = searchParams.get("paymentMethod") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const [orders, stats] = await Promise.all([
    listAdminOrders({ status, paymentMethod, search }),
    getAdminOrderStats(),
  ]);

  return Response.json({ orders, stats }, { status: 200 });
}
