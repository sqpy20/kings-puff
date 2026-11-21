"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { useCart, useShipState } from "@/lib/cart";
import {
  FREE_SHIPPING_THRESHOLD,
  bgClass,
  formatPrice,
  getCategory,
} from "@/lib/catalog";
import { states } from "@/lib/states";
import { ArrowIcon } from "./illustrations";
import { ProductArt } from "./product-card";

const shippingOptions = [
  { id: "express", label: "Express delivery (1–2 working days)", price: 5.99 },
  { id: "standard", label: "Standard delivery (3–5 working days)", price: 3.99 },
];

const paymentOptions = [
  { id: "crypto", label: "Cryptocurrency" },
  { id: "gift-card", label: "Pay with gift cards" },
  { id: "bank", label: "Direct bank transfer" },
];

const currencies = ["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)", "Tether (USDT)"];

type Errors = Record<string, string>;

function validate(data: FormData): Errors {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email")))
    errors.email = "Please enter a valid email address";
  if (!get("firstName")) errors.firstName = "Please enter a valid first name";
  if (!get("lastName")) errors.lastName = "Please enter a valid last name";
  if (!get("address")) errors.address = "Please enter a valid address";
  if (!get("city")) errors.city = "Please enter a valid city";
  if (!get("state")) errors.state = "Please select a state";
  if (!/^\d{5}(-\d{4})?$/.test(get("zip")))
    errors.zip = "Please enter a valid ZIP code";
  if (get("payment") === "crypto" && !get("currency"))
    errors.currency = "Please select a currency";
  return errors;
}

const control =
  "mt-2 block h-[54px] w-full rounded-xl border-2 bg-white px-[18px] text-[17px] font-normal placeholder:text-ink/40";

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-[15px] font-bold ${className}`}>
      {label}
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-sm font-medium text-[#c8102e]">
          {error}
        </span>
      )}
    </label>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[24px] leading-[1.2] font-extrabold tracking-[-0.01em] sm:text-[28px]">
      {children}
    </h2>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  detail,
}: {
  name: string;
  options: { id: string; label: string; price?: string }[];
  value: string;
  onChange: (id: string) => void;
  /** Extra content shown inside the selected option. */
  detail?: (id: string) => ReactNode;
}) {
  return (
    <div className="mt-5 divide-y-2 divide-ink overflow-hidden rounded-xl border-2 border-ink bg-white">
      {options.map((o) => (
        <div key={o.id} className={value === o.id ? "bg-sand/60" : ""}>
          <label className="flex cursor-pointer items-center gap-3.5 px-[18px] py-4 text-[17px]">
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="size-5 shrink-0 accent-ink"
            />
            <span className="flex-1 font-medium">{o.label}</span>
            {o.price && <span>{o.price}</span>}
          </label>
          {value === o.id && detail?.(o.id)}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutView() {
  const { ready, lines, count } = useCart();
  const [shipState, setShipState] = useShipState();
  const [errors, setErrors] = useState<Errors>({});
  const [shipping, setShipping] = useState("express");
  const [payment, setPayment] = useState("crypto");
  const [apartment, setApartment] = useState(false);
  const [note, setNote] = useState(false);
  const [placed, setPlaced] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate(new FormData(e.currentTarget));
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      setPlaced(false);
    } else {
      // No payment or order backend yet: nothing is sent or charged.
      setPlaced(true);
    }
  }

  // Props for a text control: red border when invalid, error cleared on edit.
  const input = (name: string) => ({
    name,
    "aria-invalid": errors[name] ? true : undefined,
    className: `${control} ${errors[name] ? "border-[#c8102e]" : "border-ink"}`,
    onChange: () =>
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      }),
  });

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.price * l.qty,
    0,
  );
  const resolvedShipping = shippingOptions.map((o) => {
    const amount =
      o.id === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : o.price;
    return {
      ...o,
      amount,
      price: amount === 0 ? "Free" : formatPrice(amount),
    };
  });
  const activeShipping =
    resolvedShipping.find((o) => o.id === shipping) ?? resolvedShipping[0];
  const shippingCost = activeShipping.amount;
  const total = subtotal + shippingCost;
  const shippingLabel = activeShipping.label;

  return (
    <main className="shell pt-8 pb-16 lg:pt-[30px] lg:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.04em] sm:text-[60px]">
          Almost{" "}
          <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
            yours.
          </em>
        </h1>
        <Link
          href="/cart"
          className="mb-2 inline-flex items-center gap-1.5 font-bold sm:text-[17px]"
        >
          <ArrowIcon className="size-4 rotate-180" />
          Back to bag
        </Link>
      </div>

      {!ready ? (
        <div className="min-h-[420px]" />
      ) : lines.length === 0 ? (
        <div className="mt-8 rounded-[28px] bg-white px-6 py-14 text-center lg:mt-[35px]">
          <p className="text-[17px] leading-7">
            Your bag is empty, so there&apos;s nothing to check out yet.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-14 items-center gap-1.5 rounded-full bg-ink px-7 text-[17px] font-bold text-white"
          >
            Shop the drop
            <ArrowIcon className="size-[18px]" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-9 lg:mt-[35px] xl:grid-cols-[1fr_420px]">
          <form
            noValidate
            onSubmit={onSubmit}
            className="space-y-10 rounded-[28px] bg-white px-5 py-8 sm:px-10 sm:py-10"
          >
            <section>
              <SectionTitle>Contact information</SectionTitle>
              <Field label="Email address" error={errors.email} className="mt-5">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  {...input("email")}
                />
              </Field>
              <p className="mt-2 text-sm text-[#666]">
                You are currently checking out as a guest.
              </p>
            </section>

            <section>
              <SectionTitle>Shipping address</SectionTitle>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Country / Region" className="sm:col-span-2">
                  <select name="country" className={`${control} border-ink`}>
                    <option>United States (US)</option>
                  </select>
                </Field>
                <Field label="First name" error={errors.firstName}>
                  <input autoComplete="given-name" {...input("firstName")} />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input autoComplete="family-name" {...input("lastName")} />
                </Field>
                <Field label="Address" error={errors.address} className="sm:col-span-2">
                  <input autoComplete="address-line1" {...input("address")} />
                </Field>
                {apartment ? (
                  <Field label="Apartment, suite, etc. (optional)" className="sm:col-span-2">
                    <input
                      name="apartment"
                      autoComplete="address-line2"
                      className={`${control} border-ink`}
                    />
                  </Field>
                ) : (
                  <button
                    type="button"
                    onClick={() => setApartment(true)}
                    className="-my-1.5 cursor-pointer justify-self-start text-[15px] font-medium underline underline-offset-4 sm:col-span-2"
                  >
                    + Add apartment, suite, etc.
                  </button>
                )}
                <Field label="City" error={errors.city}>
                  <input autoComplete="address-level2" {...input("city")} />
                </Field>
                <Field label="State" error={errors.state}>
                  <select
                    autoComplete="address-level1"
                    {...input("state")}
                    value={shipState}
                    onChange={(e) => {
                      setShipState(e.target.value);
                      input("state").onChange();
                    }}
                  >
                    <option value="">Select your state</option>
                    {states.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ZIP code" error={errors.zip}>
                  <input
                    autoComplete="postal-code"
                    inputMode="numeric"
                    {...input("zip")}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`${control} border-ink`}
                  />
                </Field>
              </div>
              <label className="mt-5 flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  name="sameBilling"
                  defaultChecked
                  className="size-6 shrink-0 accent-ink"
                />
                Use same address for billing
              </label>
            </section>

            <section>
              <SectionTitle>Shipping options</SectionTitle>
              <RadioGroup
                name="shipping"
                options={resolvedShipping}
                value={shipping}
                onChange={setShipping}
              />
            </section>

            <section>
              <SectionTitle>Payment options</SectionTitle>
              <RadioGroup
                name="payment"
                options={paymentOptions}
                value={payment}
                onChange={setPayment}
                detail={(id) =>
                  id === "crypto" ? (
                    <div className="px-[18px] pb-5">
                      <Field label="Please select a currency *" error={errors.currency}>
                        <select defaultValue="" {...input("currency")}>
                          <option value="" disabled>
                            Select a currency
                          </option>
                          {currencies.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  ) : (
                    <p className="px-[18px] pb-5 text-[15px] leading-6">
                      {id === "gift-card"
                        ? "[Add gift card payment instructions.]"
                        : "[Add bank transfer instructions.]"}
                    </p>
                  )
                }
              />
            </section>

            <section>
              <label className="flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  checked={note}
                  onChange={(e) => setNote(e.target.checked)}
                  className="size-6 shrink-0 accent-ink"
                />
                Add a note to your order
              </label>
              {note && (
                <textarea
                  name="note"
                  rows={4}
                  aria-label="Order note"
                  placeholder="Notes about your order, e.g. delivery instructions."
                  className="mt-4 block w-full rounded-xl border-2 border-ink bg-white px-[18px] py-3.5 text-[17px] leading-7 placeholder:text-ink/40"
                />
              )}
              <p className="mt-8 border-t border-ink/15 pt-6 text-[15px] leading-6">
                By proceeding with your purchase you agree to our{" "}
                <Link href="#" className="underline underline-offset-2">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
              <button
                type="submit"
                className="mt-6 flex h-[60px] w-full cursor-pointer items-center justify-center rounded-full bg-ink px-6 text-lg font-bold text-white"
              >
                Place order
              </button>
              {placed && (
                <p role="status" className="mt-4 text-center text-[15px] leading-6">
                  [Checkout is not connected yet. No order was placed and
                  nothing was charged.]
                </p>
              )}
            </section>
          </form>

          <aside className="rounded-[28px] bg-white px-5 py-8 sm:px-[35px] sm:py-9 xl:sticky xl:top-[111px]">
            <h2 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] sm:text-[30px]">
              Order summary
            </h2>
            <ul className="mt-6 space-y-5">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-4">
                  <div className="relative size-[60px] shrink-0 self-start">
                    <div
                      className={`relative size-full overflow-hidden rounded-[10px] ${bgClass[getCategory(product.category)?.color ?? "pink"]}`}
                    >
                      <ProductArt product={product} sizes="60px" />
                    </div>
                    <span className="absolute -top-2 -right-2 z-10 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
                      {qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="leading-[1.35] font-semibold">{product.name}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-[#666]">
                      {product.meta}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPrice(product.price * qty)}
                  </span>
                </li>
              ))}
            </ul>
            <details className="group mt-6 border-y border-ink/15 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
                Add coupons
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="group-open:rotate-180"
                >
                  <path d="m3 5 4 4 4-4" />
                </svg>
              </summary>
              <div className="mt-4 flex gap-2.5">
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  className="h-[50px] min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-[18px] text-[17px] placeholder:text-ink/45"
                />
                <button
                  type="button"
                  className="h-[50px] rounded-xl border-2 border-ink px-[22px] text-[17px] font-bold"
                >
                  Apply
                </button>
              </div>
              <p className="mt-2 text-sm leading-5">
                [Coupons are not connected yet.]
              </p>
            </details>
            <dl className="mt-5 space-y-[15px] text-[17px] leading-6">
              <div className="flex justify-between gap-4">
                <dt>
                  Subtotal ({count} {count === 1 ? "item" : "items"})
                </dt>
                <dd className="font-bold">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>
                  Delivery
                  <span className="block text-[13px] leading-5 text-[#666]">
                    {shippingLabel}
                  </span>
                </dt>
                <dd>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-ink/15 pt-5 text-[22px] leading-7 font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </main>
  );
}
