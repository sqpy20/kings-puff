"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/catalog";
import {
  type AdminOrderStats,
  ORDER_STATUS_OPTIONS,
  type OrderAddress,
  type OrderRecord,
  type OrderStatus,
  PAYMENT_OPTIONS,
  type PaymentMethod,
  formatOrderDate,
  getPaymentLabel,
} from "@/lib/payment";

const STATUS_STYLE: Record<OrderStatus, { label: string; cls: string }> = {
  pending_payment: { label: "Awaiting payment", cls: "bg-lime text-ink" },
  payment_submitted: { label: "Payment submitted", cls: "bg-teal text-ink" },
  paid: { label: "Paid", cls: "bg-teal text-ink" },
  cancelled: { label: "Cancelled", cls: "bg-pink text-ink" },
};

function formatAddressSummary(addr: OrderAddress): string {
  return [
    `${addr.firstName} ${addr.lastName}`.trim(),
    addr.address,
    addr.apartment,
    `${addr.city}, ${addr.state}`,
    addr.zip,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function OrdersTab({
  orders,
  stats,
  canWrite,
  onMutated,
  onFlash,
}: {
  orders: OrderRecord[];
  stats: AdminOrderStats | null;
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedId, setSelectedId] = useState<number | null>(
    orders[0]?.id ?? null,
  );
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(
    null,
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (methodFilter !== "all" && o.paymentMethod !== methodFilter) {
        return false;
      }
      if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const fullName =
        `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`.toLowerCase();
      return (
        String(o.orderNumber).includes(q) ||
        o.email.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        o.shippingAddress.zip.toLowerCase().includes(q)
      );
    });
  }, [orders, methodFilter, statusFilter, search]);

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedId) ??
    filteredOrders[0] ??
    null;

  async function changeOrderStatus(order: OrderRecord, status: OrderStatus) {
    if (!canWrite || updatingStatus || order.status === status) return;
    setUpdatingStatus(status);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || "Failed to update order status.");
        return;
      }
      await onMutated();
      const label =
        ORDER_STATUS_OPTIONS.find((s) => s.id === status)?.label ?? status;
      onFlash(
        "success",
        `Order #${order.orderNumber} updated to "${label}".`,
      );
    } catch {
      onFlash("error", "Network error updating order status.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  const awaitingCount =
    (stats?.pendingCount ?? 0) + (stats?.submittedCount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Customer{" "}
            <em className="font-serif text-[1.08em] leading-0 font-normal">
              orders
            </em>
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Track incoming storefront orders, chosen payment methods, crypto
            quotes, and customer shipping details.
          </p>
        </div>
        {!canWrite && (
          <span className="rounded-full border-2 border-ink bg-sand px-3.5 py-1 text-xs font-extrabold uppercase">
            Read-only access
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <section
        aria-label="Order metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <article className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-xs font-extrabold tracking-widest uppercase text-ink/60">
            Total Orders
          </p>
          <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em]">
            {stats?.totalOrders ?? orders.length}
          </p>
          <p className="mt-1 text-xs text-ink/70">
            {stats?.cancelledCount ?? 0} cancelled
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-lime/70 p-5 shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-xs font-extrabold tracking-widest uppercase text-ink/75">
            Awaiting / Submitted
          </p>
          <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em]">
            {awaitingCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink/80">
            {formatPrice((stats?.pendingRevenuePence ?? 0) / 100)} pending
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-teal/70 p-5 shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-xs font-extrabold tracking-widest uppercase text-ink/75">
            Paid Orders
          </p>
          <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em]">
            {stats?.paidCount ?? 0}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink/80">
            {formatPrice((stats?.paidRevenuePence ?? 0) / 100)} collected
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-xs font-extrabold tracking-widest uppercase text-ink/60">
            Payment Methods
          </p>
          <div className="mt-2.5 space-y-1 text-xs font-bold">
            <p className="flex justify-between">
              <span>Cryptocurrency</span>
              <span>{stats?.byMethod.crypto ?? 0}</span>
            </p>
            <p className="flex justify-between">
              <span>Pay with gift cards</span>
              <span>{stats?.byMethod["gift-card"] ?? 0}</span>
            </p>
            <p className="flex justify-between">
              <span>Direct bank transfer</span>
              <span>{stats?.byMethod.bank ?? 0}</span>
            </p>
          </div>
        </article>
      </section>

      {/* Filters */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-ink)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, email, or postcode…"
            aria-label="Search orders"
            className="h-11 w-full rounded-xl border-2 border-ink bg-cream px-4 text-sm font-medium placeholder:text-ink/45 lg:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMethodFilter("all")}
              className={`h-9 cursor-pointer rounded-full border-2 border-ink px-3.5 text-xs font-extrabold ${
                methodFilter === "all" ? "bg-ink text-cream" : "bg-white"
              }`}
            >
              All methods
            </button>
            {PAYMENT_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodFilter(m.id)}
                className={`h-9 cursor-pointer rounded-full border-2 border-ink px-3.5 text-xs font-extrabold ${
                  methodFilter === m.id ? "bg-ink text-cream" : "bg-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`h-8 cursor-pointer rounded-full border border-ink px-3 text-xs font-bold ${
              statusFilter === "all" ? "bg-sand font-extrabold" : "bg-white"
            }`}
          >
            All statuses
          </button>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={`h-8 cursor-pointer rounded-full border border-ink px-3 text-xs font-bold ${
                statusFilter === s.id ? "bg-sand font-extrabold" : "bg-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Orders list + detail */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-[24px] border-2 border-ink bg-white p-10 text-center">
          <p className="text-base font-extrabold">No matching orders found</p>
          <p className="mt-1 text-sm text-ink/70">
            {orders.length === 0
              ? "Orders placed at checkout will appear here automatically."
              : "Try clearing your search or changing the active filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[24px] border-2 border-ink bg-white shadow-[5px_5px_0_var(--color-ink)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-ink bg-sand text-xs font-extrabold tracking-[0.06em] uppercase">
                    <th className="px-4 py-3.5">Order</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/15">
                  {filteredOrders.map((order) => {
                    const badge =
                      STATUS_STYLE[order.status] ??
                      STATUS_STYLE.pending_payment;
                    const isSelected = selectedOrder?.id === order.id;
                    const itemCount = order.items.reduce(
                      (sum, i) => sum + i.qty,
                      0,
                    );
                    return (
                      <tr
                        key={order.id}
                        className={
                          isSelected ? "bg-cream" : "hover:bg-cream/50"
                        }
                      >
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-mono font-extrabold">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-ink/65">
                            {formatOrderDate(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-bold">
                            {order.shippingAddress.firstName}{" "}
                            {order.shippingAddress.lastName}
                          </p>
                          <p className="text-xs text-ink/70">{order.email}</p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-semibold">
                            {getPaymentLabel(order.paymentMethod)}
                          </p>
                          {order.paymentMethod === "crypto" &&
                            order.cryptoCurrency && (
                              <p className="font-mono text-xs text-ink/70">
                                {order.cryptoAmount} {order.cryptoCurrency}
                              </p>
                            )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-extrabold">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-xs text-ink/65">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <span
                            className={`inline-flex rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            className={`inline-flex h-8 cursor-pointer items-center rounded-full border border-ink px-3 text-xs font-extrabold ${
                              isSelected
                                ? "bg-ink text-cream"
                                : "bg-white hover:bg-lime"
                            }`}
                          >
                            {isSelected ? "Viewing" : "Details"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {selectedOrder && (
            <aside className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/15 pb-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
                    Order #{selectedOrder.orderNumber}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">
                    {selectedOrder.shippingAddress.firstName}{" "}
                    {selectedOrder.shippingAddress.lastName}
                  </h3>
                  <p className="text-xs text-ink/70">
                    {formatOrderDate(selectedOrder.createdAt)} ·{" "}
                    {selectedOrder.email}
                  </p>
                </div>
                <Link
                  href={`/checkout/order-received/${selectedOrder.accessToken}`}
                  target="_blank"
                  className="inline-flex h-9 items-center rounded-full border-2 border-ink bg-sand px-3.5 text-xs font-extrabold hover:bg-lime"
                >
                  Customer payment page ↗
                </Link>
              </div>

              {/* Status controls */}
              <div className="mt-4">
                <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
                  Order status
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ORDER_STATUS_OPTIONS.map((opt) => {
                    const active = selectedOrder.status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!canWrite || active || updatingStatus !== null}
                        onClick={() => void changeOrderStatus(selectedOrder, opt.id)}
                        className={`h-9 cursor-pointer rounded-xl border-2 border-ink px-3 text-xs font-extrabold transition disabled:cursor-default ${
                          active
                            ? "bg-ink text-cream"
                            : "bg-cream hover:bg-lime disabled:opacity-50"
                        }`}
                      >
                        {updatingStatus === opt.id ? "Updating…" : opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment method snapshot */}
              <div className="mt-5 rounded-2xl border border-ink/20 bg-cream p-4 text-xs leading-5">
                <p className="font-extrabold tracking-[0.08em] uppercase text-ink/65">
                  Payment method
                </p>
                <p className="mt-1 text-sm font-extrabold">
                  {getPaymentLabel(selectedOrder.paymentMethod)}
                </p>
                {selectedOrder.paymentMethod === "crypto" &&
                  selectedOrder.cryptoCurrency && (
                    <div className="mt-2 space-y-1 font-mono">
                      <p>
                        Amount: {selectedOrder.cryptoAmount}{" "}
                        {selectedOrder.cryptoCurrency}
                      </p>
                      <p className="break-all">
                        Wallet: {selectedOrder.cryptoAddress}
                      </p>
                    </div>
                  )}
              </div>

              {/* Line items */}
              <div className="mt-5">
                <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
                  Items ({selectedOrder.items.length})
                </p>
                <ul className="mt-2 divide-y divide-ink/10 rounded-2xl border border-ink/20 bg-white px-4">
                  {selectedOrder.items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex justify-between gap-3 py-2.5 text-sm"
                    >
                      <span>
                        <strong className="font-bold">{item.name}</strong> ×{" "}
                        {item.qty}
                      </span>
                      <span className="font-bold">
                        {formatPrice(item.lineTotalPence / 100)}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-3 py-2 text-xs text-ink/75">
                    <span>Shipping ({selectedOrder.shippingLabel})</span>
                    <span>
                      {selectedOrder.shipping === 0
                        ? "Free"
                        : formatPrice(selectedOrder.shipping)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3 py-2.5 text-sm font-extrabold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </li>
                </ul>
              </div>

              {/* Addresses & notes */}
              <div className="mt-5 space-y-3 text-xs leading-5">
                <div className="rounded-xl bg-sand/70 p-3.5">
                  <p className="font-extrabold uppercase text-ink/65">
                    Shipping address
                  </p>
                  <p className="mt-1 font-medium">
                    {formatAddressSummary(selectedOrder.shippingAddress)}
                  </p>
                  {selectedOrder.phone && (
                    <p className="mt-1 text-ink/75">
                      Phone: {selectedOrder.phone}
                    </p>
                  )}
                </div>

                {!selectedOrder.sameBilling && (
                  <div className="rounded-xl bg-sand/70 p-3.5">
                    <p className="font-extrabold uppercase text-ink/65">
                      Billing address
                    </p>
                    <p className="mt-1 font-medium">
                      {formatAddressSummary(selectedOrder.billingAddress)}
                    </p>
                  </div>
                )}

                {selectedOrder.orderNote && (
                  <div className="rounded-xl border border-ink/20 bg-cream p-3.5">
                    <p className="font-extrabold uppercase text-ink/65">
                      Order note
                    </p>
                    <p className="mt-1">{selectedOrder.orderNote}</p>
                  </div>
                )}

                {selectedOrder.attribution && (
                  <div className="rounded-xl border border-ink/15 bg-white p-3.5 text-[11px] text-ink/75">
                    <span className="font-extrabold uppercase">
                      Attribution:{" "}
                    </span>
                    {[
                      selectedOrder.attribution.refSource &&
                        `ref=${selectedOrder.attribution.refSource}`,
                      selectedOrder.attribution.utmSource &&
                        `utm_source=${selectedOrder.attribution.utmSource}`,
                      selectedOrder.attribution.utmCampaign &&
                        `utm_campaign=${selectedOrder.attribution.utmCampaign}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Direct"}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
