"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Pagination, { paginateItems } from "@/components/pagination";
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

function OrderDetailPanel({
  order,
  canWrite,
  updatingStatus,
  onChangeStatus,
}: {
  order: OrderRecord;
  canWrite: boolean;
  updatingStatus: OrderStatus | null;
  onChangeStatus: (order: OrderRecord, status: OrderStatus) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/15 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
            Order #{order.orderNumber}
          </p>
          <h3 className="mt-1 text-lg font-extrabold sm:text-xl">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </h3>
          <p className="break-all text-xs text-ink/70">
            {formatOrderDate(order.createdAt)} · {order.email}
          </p>
        </div>
        <Link
          href={`/checkout/order-received/${order.accessToken}`}
          target="_blank"
          className="inline-flex h-9 shrink-0 items-center rounded-full border-2 border-ink bg-sand px-3.5 text-xs font-extrabold hover:bg-lime"
        >
          Customer payment page ↗
        </Link>
      </div>

      {/* Status controls */}
      <div>
        <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
          Order status
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ORDER_STATUS_OPTIONS.map((opt) => {
            const active = order.status === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!canWrite || active || updatingStatus !== null}
                onClick={() => void onChangeStatus(order, opt.id)}
                className={`h-9 cursor-pointer rounded-xl border-2 border-ink px-2.5 text-xs font-extrabold transition disabled:cursor-default ${
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
      <div className="rounded-2xl border border-ink/20 bg-cream p-4 text-xs leading-5">
        <p className="font-extrabold tracking-[0.08em] uppercase text-ink/65">
          Payment method
        </p>
        <p className="mt-1 text-sm font-extrabold">
          {getPaymentLabel(order.paymentMethod)}
        </p>
        {order.paymentMethod === "crypto" && order.cryptoCurrency && (
          <div className="mt-2 space-y-1 font-mono">
            <p>
              Amount: {order.cryptoAmount} {order.cryptoCurrency}
            </p>
            <p className="break-all">Wallet: {order.cryptoAddress}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div>
        <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/60">
          Items ({order.items.length})
        </p>
        <ul className="mt-2 divide-y divide-ink/10 rounded-2xl border border-ink/20 bg-white px-4">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex justify-between gap-3 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <strong className="font-bold">{item.name}</strong> × {item.qty}
              </span>
              <span className="shrink-0 font-bold">
                {formatPrice(item.lineTotalPence / 100)}
              </span>
            </li>
          ))}
          <li className="flex justify-between gap-3 py-2 text-xs text-ink/75">
            <span>Shipping ({order.shippingLabel})</span>
            <span className="shrink-0">
              {order.shipping === 0
                ? "Free"
                : formatPrice(order.shipping)}
            </span>
          </li>
          <li className="flex justify-between gap-3 py-2.5 text-sm font-extrabold">
            <span>Total</span>
            <span className="shrink-0">{formatPrice(order.total)}</span>
          </li>
        </ul>
      </div>

      {/* Addresses & notes */}
      <div className="space-y-3 text-xs leading-5">
        <div className="rounded-xl bg-sand/70 p-3.5">
          <p className="font-extrabold uppercase text-ink/65">
            Shipping address
          </p>
          <p className="mt-1 font-medium">
            {formatAddressSummary(order.shippingAddress)}
          </p>
          {order.phone && (
            <p className="mt-1 text-ink/75">Phone: {order.phone}</p>
          )}
        </div>

        {!order.sameBilling && (
          <div className="rounded-xl bg-sand/70 p-3.5">
            <p className="font-extrabold uppercase text-ink/65">
              Billing address
            </p>
            <p className="mt-1 font-medium">
              {formatAddressSummary(order.billingAddress)}
            </p>
          </div>
        )}

        {order.orderNote && (
          <div className="rounded-xl border border-ink/20 bg-cream p-3.5">
            <p className="font-extrabold uppercase text-ink/65">Order note</p>
            <p className="mt-1">{order.orderNote}</p>
          </div>
        )}

        {order.attribution && (
          <div className="rounded-xl border border-ink/15 bg-white p-3.5 text-[11px] text-ink/75">
            <span className="font-extrabold uppercase">Attribution: </span>
            {[
              order.attribution.refSource &&
                `ref=${order.attribution.refSource}`,
              order.attribution.utmSource &&
                `utm_source=${order.attribution.utmSource}`,
              order.attribution.utmCampaign &&
                `utm_campaign=${order.attribution.utmCampaign}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Direct"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersTab({
  orders,
  stats,
  canWrite,
  focusedOrderId = null,
  onMutated,
  onFlash,
}: {
  orders: OrderRecord[];
  stats: AdminOrderStats | null;
  canWrite: boolean;
  focusedOrderId?: number | null;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(() => {
    if (!focusedOrderId) return 1;
    const idx = orders.findIndex((o) => o.id === focusedOrderId);
    return idx >= 0 ? Math.floor(idx / 10) + 1 : 1;
  });
  const [selectedId, setSelectedId] = useState<number | null>(
    focusedOrderId ?? orders[0]?.id ?? null,
  );
  const [expandedMobileId, setExpandedMobileId] = useState<number | null>(
    focusedOrderId ?? null,
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

  const { items: paginatedOrders, safePage } = paginateItems(
    filteredOrders,
    page,
    pageSize,
  );

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedId) ??
    paginatedOrders[0] ??
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
          <h2 className="text-[24px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
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
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <article className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-5 sm:shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/60 sm:text-xs">
            Total Orders
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] sm:mt-2.5 sm:text-3xl">
            {stats?.totalOrders ?? orders.length}
          </p>
          <p className="mt-1 text-xs text-ink/70">
            {stats?.cancelledCount ?? 0} cancelled
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-lime/70 p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-5 sm:shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/75 sm:text-xs">
            Awaiting / Submitted
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] sm:mt-2.5 sm:text-3xl">
            {awaitingCount}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink/80">
            {formatPrice((stats?.pendingRevenuePence ?? 0) / 100)} pending
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-teal/70 p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-5 sm:shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/75 sm:text-xs">
            Paid Orders
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] sm:mt-2.5 sm:text-3xl">
            {stats?.paidCount ?? 0}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink/80">
            {formatPrice((stats?.paidRevenuePence ?? 0) / 100)} collected
          </p>
        </article>

        <article className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-5 sm:shadow-[5px_5px_0_var(--color-ink)]">
          <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/60 sm:text-xs">
            Payment Methods
          </p>
          <div className="mt-2 space-y-1 text-xs font-bold sm:mt-2.5">
            <p className="flex justify-between gap-2">
              <span className="truncate">Crypto</span>
              <span>{stats?.byMethod.crypto ?? 0}</span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="truncate">Gift cards</span>
              <span>{stats?.byMethod["gift-card"] ?? 0}</span>
            </p>
            <p className="flex justify-between gap-2">
              <span className="truncate">Bank transfer</span>
              <span>{stats?.byMethod.bank ?? 0}</span>
            </p>
          </div>
        </article>
      </section>

      {/* Filters */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-4 shadow-[5px_5px_0_var(--color-ink)] sm:p-5">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, name, email, or postcode…"
            aria-label="Search orders"
            className="h-11 w-full rounded-xl border-2 border-ink bg-cream px-4 text-sm font-medium placeholder:text-ink/45 lg:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMethodFilter("all");
                setPage(1);
              }}
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
                onClick={() => {
                  setMethodFilter(m.id);
                  setPage(1);
                }}
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
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
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
              onClick={() => {
                setStatusFilter(s.id);
                setPage(1);
              }}
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
        <div className="rounded-[24px] border-2 border-ink bg-white p-8 text-center sm:p-10">
          <p className="text-base font-extrabold">No matching orders found</p>
          <p className="mt-1 text-sm text-ink/70">
            {orders.length === 0
              ? "Orders placed at checkout will appear here automatically."
              : "Try clearing your search or changing the active filters."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile stacked order cards */}
          <div className="space-y-3 md:hidden">
            {paginatedOrders.map((order) => {
              const badge =
                STATUS_STYLE[order.status] ?? STATUS_STYLE.pending_payment;
              const isExpanded = expandedMobileId === order.id;
              const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);

              return (
                <article
                  key={order.id}
                  className="rounded-[22px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-base font-extrabold">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-ink/65">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-ink/10 pt-3 text-sm">
                    <p className="font-bold">
                      {order.shippingAddress.firstName}{" "}
                      {order.shippingAddress.lastName}
                    </p>
                    <p className="break-all text-xs text-ink/70">
                      {order.email}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs">
                    <div>
                      <p className="font-bold">
                        {getPaymentLabel(order.paymentMethod)}
                      </p>
                      {order.paymentMethod === "crypto" &&
                        order.cryptoCurrency && (
                          <p className="font-mono text-[11px] text-ink/70">
                            {order.cryptoAmount} {order.cryptoCurrency}
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-[11px] text-ink/65">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedMobileId(isExpanded ? null : order.id)
                    }
                    className={`mt-3 flex h-10 w-full cursor-pointer items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold ${
                      isExpanded ? "bg-ink text-cream" : "bg-sand text-ink"
                    }`}
                  >
                    {isExpanded ? "Hide order details" : "View order details & status"}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 border-t-2 border-ink/15 pt-4">
                      <OrderDetailPanel
                        order={order}
                        canWrite={canWrite}
                        updatingStatus={updatingStatus}
                        onChangeStatus={changeOrderStatus}
                      />
                    </div>
                  )}
                </article>
              );
            })}

            <div className="rounded-[20px] border-2 border-ink bg-white p-3.5 shadow-[4px_4px_0_var(--color-ink)]">
              <Pagination
                variant="admin"
                page={safePage}
                pageSize={pageSize}
                totalItems={filteredOrders.length}
                itemLabel="orders"
                pageSizeOptions={[10, 20, 50]}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Desktop table + sticky detail panel */}
          <div className="hidden gap-6 md:grid xl:grid-cols-[1.2fr_0.8fr]">
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
                    {paginatedOrders.map((order) => {
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
              <div className="border-t-2 border-ink/15 bg-cream/40 px-4 py-3.5">
                <Pagination
                  variant="admin"
                  page={safePage}
                  pageSize={pageSize}
                  totalItems={filteredOrders.length}
                  itemLabel="orders"
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            </section>

            {selectedOrder && (
              <aside className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                <OrderDetailPanel
                  order={selectedOrder}
                  canWrite={canWrite}
                  updatingStatus={updatingStatus}
                  onChangeStatus={changeOrderStatus}
                />
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
