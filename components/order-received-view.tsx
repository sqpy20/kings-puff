"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/catalog";
import {
  CRYPTO_CURRENCIES,
  type CryptoCurrencyCode,
  type OrderAddress,
  type OrderRecord,
  type OrderStatus,
  type PaymentSettings,
  buildCryptoPaymentUri,
  formatOrderDate,
  getPaymentLabel,
} from "@/lib/payment";
import { ArrowIcon } from "./illustrations";

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CryptoBadgeIcon({ code }: { code: CryptoCurrencyCode }) {
  const palette: Record<CryptoCurrencyCode, { bg: string; glyph: string }> = {
    BTC: { bg: "bg-orange text-white", glyph: "₿" },
    ETH: { bg: "bg-purple text-white", glyph: "Ξ" },
    SOL: { bg: "bg-lime text-ink", glyph: "◎" },
    USDT: { bg: "bg-teal text-ink", glyph: "₮" },
  };
  const style = palette[code];
  return (
    <span
      aria-hidden="true"
      className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink text-lg font-extrabold ${style.bg}`}
    >
      {style.glyph}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; cls: string }> = {
    pending_payment: { label: "Awaiting payment", cls: "bg-lime text-ink" },
    payment_submitted: { label: "Payment submitted", cls: "bg-teal text-ink" },
    paid: { label: "Paid", cls: "bg-teal text-ink" },
    cancelled: { label: "Cancelled", cls: "bg-pink text-ink" },
  };
  const badge = map[status] ?? map.pending_payment;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1 text-xs font-extrabold tracking-[0.08em] uppercase ${badge.cls}`}
    >
      <span className="size-2 rounded-full bg-ink" />
      {badge.label}
    </span>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function AddressBlock({
  title,
  address,
  email,
  phone,
}: {
  title: string;
  address: OrderAddress;
  email?: string;
  phone?: string;
}) {
  return (
    <section className="rounded-[28px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] sm:p-7">
      <h2 className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
        {title}
      </h2>
      <div className="mt-4 space-y-1 text-[16px] leading-7 text-ink/90">
        <p className="font-bold text-ink">
          {address.firstName} {address.lastName}
        </p>
        <p>{address.address}</p>
        {address.apartment && <p>{address.apartment}</p>}
        <p>
          {address.city}, {address.state}
        </p>
        <p className="font-mono text-[15px] font-semibold">{address.zip}</p>
        <p>{address.country}</p>
        {email && (
          <p className="flex items-center gap-2 pt-2 font-medium text-ink">
            <MailIcon />
            <span>{email}</span>
          </p>
        )}
        {phone && <p className="text-sm text-ink/75">{phone}</p>}
      </div>
    </section>
  );
}

export default function OrderReceivedView({
  order: initialOrder,
  settings,
  qrDataUrl,
}: {
  order: OrderRecord;
  settings: PaymentSettings;
  qrDataUrl: string | null;
}) {
  const supportEmail = settings.supportEmail;
  const [order, setOrder] = useState<OrderRecord>(initialOrder);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [mutating, setMutating] = useState<"confirm_sent" | "cancel" | null>(
    null,
  );
  const [actionFeedback, setActionFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (
      order.paymentMethod !== "crypto" ||
      order.status !== "pending_payment" ||
      !order.cryptoExpiresAt
    ) {
      return;
    }

    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    const poll = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.accessToken}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { order?: OrderRecord };
        if (json.order) {
          setOrder(json.order);
        }
      } catch {
        // Ignore transient poll errors.
      }
    }, 15_000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [order.accessToken, order.cryptoExpiresAt, order.paymentMethod, order.status]);

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Clipboard blocked.
    }
  }

  async function handleOrderAction(action: "confirm_sent" | "cancel") {
    if (mutating || order.status !== "pending_payment") return;
    setMutating(action);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/orders/${order.accessToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await res.json()) as {
        order?: OrderRecord;
        error?: string;
      };

      if (!res.ok || !data.order) {
        setActionFeedback({
          kind: "error",
          text: data.error || "Unable to update order status.",
        });
        return;
      }

      setOrder(data.order);
      setActionFeedback({
        kind: "success",
        text:
          action === "confirm_sent"
            ? "Thanks! We've marked your crypto payment as submitted and notified our team."
            : "Your order has been cancelled.",
      });
    } catch {
      setActionFeedback({
        kind: "error",
        text: "Network error updating order status.",
      });
    } finally {
      setMutating(null);
    }
  }

  const paymentLabel = getPaymentLabel(order.paymentMethod);
  const formattedDate = formatOrderDate(order.createdAt);
  const cryptoMeta = order.cryptoCurrency
    ? CRYPTO_CURRENCIES[order.cryptoCurrency]
    : null;
  const expiresMs = order.cryptoExpiresAt
    ? new Date(order.cryptoExpiresAt).getTime()
    : 0;
  const remainingMs = Math.max(0, expiresMs - nowMs);
  const walletUri =
    order.cryptoCurrency && order.cryptoAddress && order.cryptoAmount
      ? buildCryptoPaymentUri(
          order.cryptoCurrency,
          order.cryptoAddress,
          order.cryptoAmount,
        )
      : null;

  return (
    <main className="shell pt-8 pb-16 lg:pt-[30px] lg:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <StatusBadge status={order.status} />
          <h1 className="mt-4 text-[40px] leading-[1.08] font-extrabold tracking-[-0.04em] sm:text-[58px]">
            Order{" "}
            <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
              received.
            </em>
          </h1>
          <p className="mt-3 text-[17px] leading-7 text-ink/80">
            {settings.orderReceivedSubtitle}
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex h-12 items-center gap-1.5 rounded-full border-2 border-ink bg-white px-6 text-[15px] font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-lime"
        >
          Continue shopping
          <ArrowIcon className="size-4" />
        </Link>
      </div>

      {/* 4-column Order Overview strip */}
      <section
        aria-label="Order overview"
        className="mt-8 grid gap-4 rounded-[28px] border-2 border-ink bg-white p-5 shadow-[5px_5px_0_var(--color-ink)] sm:grid-cols-2 sm:p-7 lg:grid-cols-4"
      >
        <div className="rounded-2xl bg-cream p-4">
          <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-ink/60">
            Order number
          </p>
          <p className="mt-1.5 font-mono text-xl font-extrabold">
            #{order.orderNumber}
          </p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-ink/60">
            Date
          </p>
          <p className="mt-1.5 text-lg font-extrabold">{formattedDate}</p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-ink/60">
            Total
          </p>
          <p className="mt-1.5 text-xl font-extrabold">
            {formatPrice(order.total)}
          </p>
        </div>
        <div className="rounded-2xl bg-sand p-4">
          <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-ink/60">
            Payment method
          </p>
          <p className="mt-1.5 text-lg font-extrabold">{paymentLabel}</p>
        </div>
      </section>

      {/* Payment instructions panel based on chosen payment method */}
      {order.paymentMethod === "gift-card" && (
        <section
          aria-label="Gift card payment instructions"
          className="mt-8 rounded-[28px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] sm:p-9"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-ink/60">
                Payment instructions
              </p>
              <h2 className="mt-1 text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
                {settings.giftCardTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void copyText("order-ref", `#${order.orderNumber}`)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-ink bg-sand px-4 text-xs font-extrabold hover:bg-lime"
            >
              <CopyIcon copied={copiedKey === "order-ref"} />
              {copiedKey === "order-ref"
                ? "Copied reference"
                : `Copy ref #${order.orderNumber}`}
            </button>
          </div>

          <div className="mt-6 space-y-4 text-[17px] leading-7">
            <p className="whitespace-pre-line">{settings.giftCardIntro}</p>
            <ol className="space-y-2 rounded-2xl border-2 border-ink bg-cream p-5 font-bold">
              {settings.giftCardAcceptedCards.map((card, index) => (
                <li key={`${card}-${index}`}>
                  {index + 1}. {card}
                </li>
              ))}
            </ol>
            {settings.giftCardInstructions
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            <div className="rounded-2xl border-2 border-ink bg-sand/70 p-4 text-[16px]">
              <span className="font-bold">Company email: </span>
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Order #${order.orderNumber} Gift Card Payment`)}`}
                className="font-extrabold underline underline-offset-4"
              >
                {supportEmail}
              </a>{" "}
              <span className="text-ink/75">
                (Order total: {formatPrice(order.total)} · Ref #{order.orderNumber})
              </span>
            </div>
            <p className="pt-2 font-semibold whitespace-pre-line">
              {settings.giftCardClosing}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void copyText("support-email", supportEmail)}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white"
            >
              <CopyIcon copied={copiedKey === "support-email"} />
              {copiedKey === "support-email"
                ? "Email copied!"
                : `Copy ${supportEmail}`}
            </button>
            <Link
              href="/faq#contact"
              className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-white px-6 text-sm font-bold hover:bg-sand"
            >
              Contact support
            </Link>
          </div>
        </section>
      )}

      {order.paymentMethod === "bank" && (
        <section
          aria-label="Direct bank transfer instructions"
          className="mt-8 rounded-[28px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] sm:p-9"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-ink/60">
                Payment instructions
              </p>
              <h2 className="mt-1 text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
                {settings.bankTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void copyText("order-ref", `#${order.orderNumber}`)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-ink bg-sand px-4 text-xs font-extrabold hover:bg-lime"
            >
              <CopyIcon copied={copiedKey === "order-ref"} />
              {copiedKey === "order-ref"
                ? "Copied reference"
                : `Copy ref #${order.orderNumber}`}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border-2 border-ink bg-cream p-6 text-[17px] leading-7">
              <p className="whitespace-pre-line">{settings.bankInstructions}</p>
              <p className="mt-3 text-[15px] text-ink/80">
                Order email: <strong className="text-ink">{order.email}</strong>{" "}
                · Support:{" "}
                <a
                  href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Order #${order.orderNumber} Bank Transfer Details`)}`}
                  className="font-extrabold text-ink underline underline-offset-4"
                >
                  {supportEmail}
                </a>
              </p>
            </div>

            {(settings.bankAccountName ||
              settings.bankSortCode ||
              settings.bankAccountNumber) && (
              <div className="rounded-2xl border-2 border-ink bg-sand p-5">
                <p className="text-xs font-extrabold tracking-[0.1em] uppercase text-ink/65">
                  UK Bank Details
                </p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {settings.bankAccountName && (
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-[11px] font-bold uppercase text-ink/60">
                        Account Name
                      </dt>
                      <dd className="mt-1 font-extrabold">
                        {settings.bankAccountName}
                      </dd>
                    </div>
                  )}
                  {settings.bankSortCode && (
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-[11px] font-bold uppercase text-ink/60">
                        Sort Code
                      </dt>
                      <dd className="mt-1 font-mono font-extrabold">
                        {settings.bankSortCode}
                      </dd>
                    </div>
                  )}
                  {settings.bankAccountNumber && (
                    <div className="rounded-xl bg-white p-3">
                      <dt className="text-[11px] font-bold uppercase text-ink/60">
                        Account Number
                      </dt>
                      <dd className="mt-1 font-mono font-extrabold">
                        {settings.bankAccountNumber}
                      </dd>
                    </div>
                  )}
                  <div className="rounded-xl bg-white p-3">
                    <dt className="text-[11px] font-bold uppercase text-ink/60">
                      Reference
                    </dt>
                    <dd className="mt-1 font-mono font-extrabold">
                      #{order.orderNumber}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void copyText("support-email", supportEmail)}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white"
            >
              <CopyIcon copied={copiedKey === "support-email"} />
              {copiedKey === "support-email"
                ? "Email copied!"
                : `Copy ${supportEmail}`}
            </button>
            <Link
              href="/faq#contact"
              className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-white px-6 text-sm font-bold hover:bg-sand"
            >
              Open contact page
            </Link>
          </div>
        </section>
      )}

      {order.paymentMethod === "crypto" &&
        order.cryptoCurrency &&
        order.cryptoAmount &&
        order.cryptoAddress &&
        cryptoMeta && (
          <section
            aria-label="Cryptocurrency payment"
            className="mt-8 rounded-[28px] border-2 border-ink bg-white p-6 shadow-[6px_6px_0_var(--color-ink)] sm:p-9"
          >
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Left payment instructions & live status */}
              <div>
                <h2 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[34px]">
                  {settings.cryptoTitle}
                </h2>
                <p className="mt-2 text-[16px] leading-6 text-ink/80">
                  {settings.cryptoSubtitle.replaceAll(
                    "{TICKER}",
                    cryptoMeta.ticker,
                  )}
                </p>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-ink bg-sand p-4">
                  <span className="mt-0.5 text-ink">
                    <AlertCircleIcon />
                  </span>
                  <div className="text-sm leading-6">
                    <p className="font-extrabold">Important</p>
                    <p className="text-ink/85 whitespace-pre-line">
                      {settings.cryptoImportantNotice}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-extrabold">Amount</p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="flex h-13 flex-1 items-center rounded-xl border-2 border-ink bg-cream px-4 font-mono text-base font-bold">
                      {order.cryptoAmount} {cryptoMeta.ticker}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void copyText("crypto-amount", order.cryptoAmount ?? "")
                      }
                      aria-label="Copy crypto amount"
                      className="inline-flex h-13 shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 text-sm font-bold hover:bg-lime"
                    >
                      <CopyIcon copied={copiedKey === "crypto-amount"} />
                      <span className="hidden sm:inline">
                        {copiedKey === "crypto-amount" ? "Copied" : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-extrabold">Pay to address</p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-cream px-4 py-3 font-mono text-sm leading-6 font-bold break-all">
                      {order.cryptoAddress}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(
                          "crypto-address",
                          order.cryptoAddress ?? "",
                        )
                      }
                      aria-label="Copy wallet address"
                      className="inline-flex h-13 shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-ink bg-white px-4 text-sm font-bold hover:bg-lime"
                    >
                      <CopyIcon copied={copiedKey === "crypto-address"} />
                      <span className="hidden sm:inline">
                        {copiedKey === "crypto-address" ? "Copied" : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink p-4 ${
                    order.status === "cancelled"
                      ? "bg-pink"
                      : order.status === "payment_submitted" ||
                          order.status === "paid"
                        ? "bg-teal"
                        : "bg-lime/55"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon />
                    <div>
                      <p className="text-sm font-extrabold">
                        {order.status === "pending_payment"
                          ? "Awaiting payment"
                          : order.status === "payment_submitted"
                            ? "Payment submitted for verification"
                            : order.status === "paid"
                              ? "Payment confirmed"
                              : "Order cancelled"}
                      </p>
                      {order.status === "pending_payment" && (
                        <p className="text-xs text-ink/75">
                          (checked every 15 secs)
                        </p>
                      )}
                    </div>
                  </div>
                  {order.status === "pending_payment" && (
                    <span className="font-mono text-2xl font-extrabold tracking-tight">
                      {formatCountdown(remainingMs)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right wallet badge, deep-link, and QR code */}
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl border-2 border-ink bg-cream p-4">
                  <CryptoBadgeIcon code={order.cryptoCurrency} />
                  <div>
                    <p className="text-lg font-extrabold leading-tight">
                      {cryptoMeta.name}
                    </p>
                    <p className="font-mono text-xs font-bold text-ink/65">
                      {cryptoMeta.ticker}
                    </p>
                  </div>
                </div>

                {walletUri && (
                  <div className="rounded-2xl border-2 border-ink bg-cream p-4 text-center">
                    <p className="text-sm font-extrabold">Pay with</p>
                    <a
                      href={walletUri}
                      className="mt-3 flex h-12 w-full items-center justify-between rounded-full border-2 border-ink bg-teal px-5 text-sm font-extrabold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-lime"
                    >
                      <span>Open in {cryptoMeta.ticker} Wallet</span>
                      <ArrowIcon className="size-4" />
                    </a>
                  </div>
                )}

                <div className="rounded-2xl border-2 border-ink bg-cream p-5 text-center">
                  <p className="text-sm font-extrabold">Scan to pay</p>
                  {qrDataUrl ? (
                    <div className="mx-auto mt-3 inline-flex rounded-2xl border-2 border-ink bg-white p-3">
                      <Image
                        src={qrDataUrl}
                        alt={`QR code to pay ${order.cryptoAmount} ${cryptoMeta.ticker}`}
                        width={220}
                        height={220}
                        unoptimized
                        className="size-[210px]"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-ink/70">
                      QR code unavailable
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      {/* Order details card */}
      <section
        aria-label="Order details"
        className="mt-8 rounded-[28px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] sm:p-9"
      >
        <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
          Order details
        </h2>

        <div className="mt-5 overflow-hidden rounded-2xl border-2 border-ink">
          <table className="w-full border-collapse text-left text-[15px] sm:text-[16px]">
            <thead>
              <tr className="border-b-2 border-ink bg-sand">
                <th className="px-4 py-3.5 font-extrabold">Product</th>
                <th className="px-4 py-3.5 text-right font-extrabold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-bold underline underline-offset-4 hover:text-purple"
                    >
                      {item.name}
                    </Link>{" "}
                    <span className="font-extrabold">× {item.qty}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold">
                    {formatPrice(item.lineTotalPence / 100)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3.5 font-bold">Subtotal:</td>
                <td className="px-4 py-3.5 text-right font-bold">
                  {formatPrice(order.subtotal)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-bold">Shipping:</td>
                <td className="px-4 py-3.5 text-right">
                  <strong>
                    {order.shipping === 0
                      ? "Free"
                      : formatPrice(order.shipping)}
                  </strong>{" "}
                  <span className="text-ink/75">via {order.shippingLabel}</span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-bold">Payment method:</td>
                <td className="px-4 py-3.5 text-right font-bold">
                  {paymentLabel}
                </td>
              </tr>
              <tr className="border-t-2 border-ink bg-cream">
                <td className="px-4 py-4 text-lg font-extrabold">Total:</td>
                <td className="px-4 py-4 text-right text-lg font-extrabold">
                  {formatPrice(order.total)}
                </td>
              </tr>
              {order.paymentMethod === "crypto" && (
                <tr className="border-t border-ink/15">
                  <td className="px-4 py-4 font-bold">Actions:</td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        disabled={
                          order.status !== "pending_payment" || mutating !== null
                        }
                        onClick={() => void handleOrderAction("confirm_sent")}
                        className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-extrabold text-ink hover:bg-teal disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {mutating === "confirm_sent" ? "Saving…" : "Pay"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          order.status !== "pending_payment" || mutating !== null
                        }
                        onClick={() => void handleOrderAction("cancel")}
                        className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-5 text-sm font-extrabold text-ink hover:bg-pink disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {mutating === "cancel" ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {actionFeedback && (
          <p
            role={actionFeedback.kind === "error" ? "alert" : "status"}
            className={`mt-4 text-sm font-bold ${
              actionFeedback.kind === "error" ? "text-[#c8102e]" : "text-ink"
            }`}
          >
            {actionFeedback.text}
          </p>
        )}

        {order.orderNote && (
          <div className="mt-5 rounded-2xl bg-sand p-4 text-sm leading-6">
            <span className="font-extrabold">Order note: </span>
            <span>{order.orderNote}</span>
          </div>
        )}
      </section>

      {/* Billing & Shipping addresses */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <AddressBlock
          title="Billing address"
          address={order.billingAddress}
          email={order.email}
          phone={order.phone}
        />
        <AddressBlock
          title="Shipping address"
          address={order.shippingAddress}
        />
      </div>
    </main>
  );
}
