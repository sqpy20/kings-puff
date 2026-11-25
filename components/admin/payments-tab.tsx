"use client";

import { type FormEvent, useState } from "react";
import {
  DEFAULT_PAYMENT_SETTINGS,
  type PaymentSettings,
} from "@/lib/payment";

const inputCls =
  "mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream px-3.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-65";

const textareaCls =
  "mt-1.5 block w-full rounded-xl border-2 border-ink bg-cream px-3.5 py-2.5 text-sm leading-6 font-medium disabled:cursor-not-allowed disabled:opacity-65";

function PaymentsForm({
  initial,
  canWrite,
  onMutated,
  onFlash,
}: {
  initial: PaymentSettings;
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [orderReceivedSubtitle, setOrderReceivedSubtitle] = useState(
    initial.orderReceivedSubtitle,
  );

  const [giftCardTitle, setGiftCardTitle] = useState(initial.giftCardTitle);
  const [giftCardCheckoutHint, setGiftCardCheckoutHint] = useState(
    initial.giftCardCheckoutHint,
  );
  const [giftCardIntro, setGiftCardIntro] = useState(initial.giftCardIntro);
  const [giftCardAcceptedCardsText, setGiftCardAcceptedCardsText] = useState(
    initial.giftCardAcceptedCards.join("\n"),
  );
  const [giftCardInstructions, setGiftCardInstructions] = useState(
    initial.giftCardInstructions,
  );
  const [giftCardClosing, setGiftCardClosing] = useState(
    initial.giftCardClosing,
  );

  const [bankTitle, setBankTitle] = useState(initial.bankTitle);
  const [bankCheckoutHint, setBankCheckoutHint] = useState(
    initial.bankCheckoutHint,
  );
  const [bankInstructions, setBankInstructions] = useState(
    initial.bankInstructions,
  );
  const [bankAccountName, setBankAccountName] = useState(
    initial.bankAccountName,
  );
  const [bankSortCode, setBankSortCode] = useState(initial.bankSortCode);
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initial.bankAccountNumber,
  );

  const [cryptoTitle, setCryptoTitle] = useState(initial.cryptoTitle);
  const [cryptoSubtitle, setCryptoSubtitle] = useState(initial.cryptoSubtitle);
  const [cryptoImportantNotice, setCryptoImportantNotice] = useState(
    initial.cryptoImportantNotice,
  );
  const [cryptoExpiryMinutes, setCryptoExpiryMinutes] = useState(
    String(initial.cryptoExpiryMinutes),
  );
  const [btcAddress, setBtcAddress] = useState(initial.btcAddress);
  const [ethAddress, setEthAddress] = useState(initial.ethAddress);
  const [solAddress, setSolAddress] = useState(initial.solAddress);
  const [usdtAddress, setUsdtAddress] = useState(initial.usdtAddress);

  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canWrite || saving) return;

    const acceptedCards = giftCardAcceptedCardsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportEmail,
          orderReceivedSubtitle,
          giftCardTitle,
          giftCardCheckoutHint,
          giftCardIntro,
          giftCardAcceptedCards: acceptedCards,
          giftCardInstructions,
          giftCardClosing,
          bankTitle,
          bankCheckoutHint,
          bankInstructions,
          bankAccountName,
          bankSortCode,
          bankAccountNumber,
          cryptoTitle,
          cryptoSubtitle,
          cryptoImportantNotice,
          cryptoExpiryMinutes: Number(cryptoExpiryMinutes),
          btcAddress,
          ethAddress,
          solAddress,
          usdtAddress,
        }),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || "Failed to save payment content.");
        return;
      }

      await onMutated();
      onFlash(
        "success",
        "Order Received & Payment page settings saved.",
      );
    } catch {
      onFlash("error", "Network error saving payment page settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. General & Support */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
        <h3 className="text-lg font-extrabold">General &amp; Support</h3>
        <p className="mt-0.5 text-xs text-ink/70">
          Shown on the Order Received header and used as the contact email in
          Gift Card &amp; Bank Transfer instructions.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-extrabold uppercase">
            Support Email
            <input
              type="email"
              required
              disabled={!canWrite}
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Order Received Subtitle
            <input
              type="text"
              required
              disabled={!canWrite}
              value={orderReceivedSubtitle}
              onChange={(e) => setOrderReceivedSubtitle(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* 2. Pay with Gift Cards */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
        <h3 className="text-lg font-extrabold">Pay with Gift Cards</h3>
        <p className="mt-0.5 text-xs text-ink/70">
          Controls both the checkout option hint and the full Gift Card payment
          page copy.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-extrabold uppercase">
            Section Title
            <input
              type="text"
              required
              disabled={!canWrite}
              value={giftCardTitle}
              onChange={(e) => setGiftCardTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Checkout Option Hint
            <input
              type="text"
              required
              disabled={!canWrite}
              value={giftCardCheckoutHint}
              onChange={(e) => setGiftCardCheckoutHint(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Intro Text
            <input
              type="text"
              required
              disabled={!canWrite}
              value={giftCardIntro}
              onChange={(e) => setGiftCardIntro(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Accepted Gift Cards (one per line)
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={giftCardAcceptedCardsText}
              onChange={(e) => setGiftCardAcceptedCardsText(e.target.value)}
              className={textareaCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Detailed Instructions
            <textarea
              rows={6}
              required
              disabled={!canWrite}
              value={giftCardInstructions}
              onChange={(e) => setGiftCardInstructions(e.target.value)}
              className={textareaCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Closing Sign-Off
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={giftCardClosing}
              onChange={(e) => setGiftCardClosing(e.target.value)}
              className={textareaCls}
            />
          </label>
        </div>
      </section>

      {/* 3. Direct Bank Transfer */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
        <h3 className="text-lg font-extrabold">Direct Bank Transfer</h3>
        <p className="mt-0.5 text-xs text-ink/70">
          Leave UK Bank Details blank to email account details manually, or fill
          them in to display them directly on the payment page and confirmation
          email.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-extrabold uppercase">
            Section Title
            <input
              type="text"
              required
              disabled={!canWrite}
              value={bankTitle}
              onChange={(e) => setBankTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Checkout Option Hint
            <input
              type="text"
              required
              disabled={!canWrite}
              value={bankCheckoutHint}
              onChange={(e) => setBankCheckoutHint(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Bank Transfer Instructions
            <textarea
              rows={3}
              required
              disabled={!canWrite}
              value={bankInstructions}
              onChange={(e) => setBankInstructions(e.target.value)}
              className={textareaCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Account Name (optional)
            <input
              type="text"
              disabled={!canWrite}
              placeholder="e.g. Momo Eliquid Ltd"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Sort Code (optional)
            <input
              type="text"
              disabled={!canWrite}
              placeholder="e.g. 00-00-00"
              value={bankSortCode}
              onChange={(e) => setBankSortCode(e.target.value)}
              className={`${inputCls} font-mono font-bold`}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Account Number (optional)
            <input
              type="text"
              disabled={!canWrite}
              placeholder="e.g. 12345678"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className={`${inputCls} font-mono font-bold`}
            />
          </label>
        </div>
      </section>

      {/* 4. Cryptocurrency */}
      <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
        <h3 className="text-lg font-extrabold">Cryptocurrency &amp; Wallets</h3>
        <p className="mt-0.5 text-xs text-ink/70">
          Use <code className="font-mono font-bold">{"{TICKER}"}</code> in the
          subtitle to dynamically insert BTC, ETH, SOL, or USDT.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-extrabold uppercase">
            Payment Box Title
            <input
              type="text"
              required
              disabled={!canWrite}
              value={cryptoTitle}
              onChange={(e) => setCryptoTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Payment Window (minutes, 15–1440)
            <input
              type="number"
              min={15}
              max={1440}
              required
              disabled={!canWrite}
              value={cryptoExpiryMinutes}
              onChange={(e) => setCryptoExpiryMinutes(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Subtitle
            <input
              type="text"
              required
              disabled={!canWrite}
              value={cryptoSubtitle}
              onChange={(e) => setCryptoSubtitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase sm:col-span-2">
            Important Notice Banner
            <textarea
              rows={2}
              required
              disabled={!canWrite}
              value={cryptoImportantNotice}
              onChange={(e) => setCryptoImportantNotice(e.target.value)}
              className={textareaCls}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Bitcoin (BTC) Address
            <input
              type="text"
              disabled={!canWrite}
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              className={`${inputCls} font-mono text-xs font-bold`}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Ethereum (ETH) Address
            <input
              type="text"
              disabled={!canWrite}
              value={ethAddress}
              onChange={(e) => setEthAddress(e.target.value)}
              className={`${inputCls} font-mono text-xs font-bold`}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Solana (SOL) Address
            <input
              type="text"
              disabled={!canWrite}
              value={solAddress}
              onChange={(e) => setSolAddress(e.target.value)}
              className={`${inputCls} font-mono text-xs font-bold`}
            />
          </label>
          <label className="block text-xs font-extrabold uppercase">
            Tether (USDT) Address
            <input
              type="text"
              disabled={!canWrite}
              value={usdtAddress}
              onChange={(e) => setUsdtAddress(e.target.value)}
              className={`${inputCls} font-mono text-xs font-bold`}
            />
          </label>
        </div>
      </section>

      {canWrite && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-7 text-sm font-extrabold text-ink shadow-[4px_4px_0_var(--color-ink)] hover:bg-teal disabled:opacity-60"
          >
            {saving ? "Saving changes…" : "Save payment page content"}
          </button>
        </div>
      )}
    </form>
  );
}

export default function PaymentsTab({
  settings,
  canWrite,
  onMutated,
  onFlash,
}: {
  settings: PaymentSettings | null;
  canWrite: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const resolved = settings ?? DEFAULT_PAYMENT_SETTINGS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Payment page{" "}
            <em className="font-serif text-[1.08em] leading-0 font-normal">
              content
            </em>
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Customize what customers see on the Order Received &amp; Payment
            page for Gift Cards, Bank Transfer, and Cryptocurrency.
          </p>
        </div>
        {!canWrite && (
          <span className="rounded-full border-2 border-ink bg-sand px-3.5 py-1 text-xs font-extrabold uppercase">
            Read-only access
          </span>
        )}
      </div>

      <PaymentsForm
        key={JSON.stringify(resolved)}
        initial={resolved}
        canWrite={canWrite}
        onMutated={onMutated}
        onFlash={onFlash}
      />
    </div>
  );
}
