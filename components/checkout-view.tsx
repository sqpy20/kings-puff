"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useAttribution } from "@/lib/backlinks";
import { clearCart, useCart, useShipState } from "@/lib/cart";
import {
  FREE_SHIPPING_THRESHOLD,
  MIN_ORDER_AMOUNT,
  bgClass,
  formatPrice,
} from "@/lib/catalog";
import {
  CRYPTO_CURRENCY_LIST,
  DEFAULT_PAYMENT_SETTINGS,
  PAYMENT_OPTIONS,
  type PaymentMethod,
  SHIPPING_OPTIONS,
  type ShippingMethodId,
} from "@/lib/payment";
import {
  type SavedAddress,
  removeCheckoutAddress,
  saveCheckoutAddress,
  setDefaultCheckoutAddress,
  useSavedAddresses,
} from "@/lib/saved-addresses";
import { states } from "@/lib/states";
import { ArrowIcon } from "./illustrations";
import { ProductArt } from "./product-card";

type Errors = Record<string, string>;

type AddressDraft = {
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

const EMPTY_DRAFT: AddressDraft = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
};

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function validate(data: FormData, sameBilling: boolean): Errors {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const errors: Errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email")))
    errors.email = "Please enter a valid email address";
  if (!get("firstName")) errors.firstName = "Please enter a valid first name";
  if (!get("lastName")) errors.lastName = "Please enter a valid last name";
  if (!get("address")) errors.address = "Please enter a valid address";
  if (!get("city")) errors.city = "Please enter a valid town or city";
  if (!get("state")) errors.state = "Please select a county / region";
  if (!UK_POSTCODE_RE.test(get("zip")))
    errors.zip = "Please enter a valid UK postcode";

  if (!sameBilling) {
    if (!get("billingFirstName"))
      errors.billingFirstName = "Please enter a valid billing first name";
    if (!get("billingLastName"))
      errors.billingLastName = "Please enter a valid billing last name";
    if (!get("billingAddress"))
      errors.billingAddress = "Please enter a valid billing address";
    if (!get("billingCity"))
      errors.billingCity = "Please enter a valid billing town or city";
    if (!get("billingState"))
      errors.billingState = "Please select a billing county / region";
    if (!UK_POSTCODE_RE.test(get("billingZip")))
      errors.billingZip = "Please enter a valid UK billing postcode";
  }

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
  options: readonly { id: string; label: string; price?: string }[];
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
  const router = useRouter();
  const { ready, lines, count } = useCart();
  const attribution = useAttribution();
  const touch = attribution.lastTouch ?? attribution.firstTouch;
  const [shipState, setShipState] = useShipState();

  const savedStore = useSavedAddresses();
  const [selectedAddressIdOverride, setSelectedAddressIdOverride] = useState<
    string | null
  >(null);
  const [modeOverride, setModeOverride] = useState<"saved" | "new" | null>(
    null,
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_DRAFT);
  const [saveAddress, setSaveAddress] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [shipping, setShipping] = useState<ShippingMethodId>("express");
  const [payment, setPayment] = useState<PaymentMethod>("crypto");
  const [apartment, setApartment] = useState(false);
  const [sameBilling, setSameBilling] = useState(true);
  const [note, setNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutHints, setCheckoutHints] = useState({
    giftCardCheckoutHint: DEFAULT_PAYMENT_SETTINGS.giftCardCheckoutHint,
    bankCheckoutHint: DEFAULT_PAYMENT_SETTINGS.bankCheckoutHint,
  });

  const hasSavedAddresses = savedStore.addresses.length > 0;
  const addressMode: "saved" | "new" = !hasSavedAddresses
    ? "new"
    : (modeOverride ?? "saved");

  const activeSavedAddress: SavedAddress | null = hasSavedAddresses
    ? (savedStore.addresses.find((a) => a.id === selectedAddressIdOverride) ??
      savedStore.addresses.find((a) => a.id === savedStore.defaultId) ??
      savedStore.addresses[0])
    : null;

  const currentEmail = emailTouched
    ? emailValue
    : (activeSavedAddress?.email ?? "");
  const effectiveNewState = draft.state || shipState;

  useEffect(() => {
    let active = true;
    fetch("/api/payment-content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            giftCardCheckoutHint?: string;
            bankCheckoutHint?: string;
          } | null,
        ) => {
          if (!active || !data) return;
          setCheckoutHints({
            giftCardCheckoutHint:
              data.giftCardCheckoutHint ||
              DEFAULT_PAYMENT_SETTINGS.giftCardCheckoutHint,
            bankCheckoutHint:
              data.bankCheckoutHint ||
              DEFAULT_PAYMENT_SETTINGS.bankCheckoutHint,
          });
        },
      )
      .catch(() => {
        // Keep default hints on transient error.
      });
    return () => {
      active = false;
    };
  }, []);

  function clearFieldError(name: string) {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function clearShippingErrors() {
    setErrors((prev) => {
      const shippingKeys = [
        "firstName",
        "lastName",
        "address",
        "city",
        "state",
        "zip",
      ];
      if (!shippingKeys.some((k) => Boolean(prev[k]))) return prev;
      const next = { ...prev };
      for (const k of shippingKeys) delete next[k];
      return next;
    });
  }

  function selectSavedAddress(addr: SavedAddress) {
    setSelectedAddressIdOverride(addr.id);
    setDefaultCheckoutAddress(addr.id);
    setShipState(addr.state);
    setModeOverride("saved");
    setEditingAddressId(null);
    clearShippingErrors();
  }

  function startEditSavedAddress(addr: SavedAddress) {
    setEditingAddressId(addr.id);
    setDraft({
      firstName: addr.firstName,
      lastName: addr.lastName,
      address: addr.address,
      apartment: addr.apartment,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      phone: addr.phone,
    });
    setApartment(Boolean(addr.apartment));
    setShipState(addr.state);
    setSaveAddress(true);
    setModeOverride("new");
    clearShippingErrors();
  }

  function startNewAddress() {
    setEditingAddressId(null);
    setDraft({ ...EMPTY_DRAFT, state: shipState });
    setApartment(false);
    setSaveAddress(true);
    setModeOverride("new");
    clearShippingErrors();
  }

  function returnToSavedAddresses() {
    setEditingAddressId(null);
    setModeOverride("saved");
    clearShippingErrors();
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.price * l.qty,
    0,
  );
  const minOrderRemaining = Math.max(0, MIN_ORDER_AMOUNT - subtotal);
  const belowMinimum = minOrderRemaining > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (belowMinimum) {
      setSubmitError(
        `Minimum product order is ${formatPrice(MIN_ORDER_AMOUNT)}. Add ${formatPrice(minOrderRemaining)} more to place an order.`,
      );
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const found = validate(formData, sameBilling);
    setErrors(found);
    setSubmitError(null);

    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const get = (k: string) => String(formData.get(k) ?? "").trim();
    const customerEmail = get("email");
    const customerPhone = get("phone");

    const shippingAddress = {
      country: get("country") || "United Kingdom (UK)",
      firstName: get("firstName"),
      lastName: get("lastName"),
      address: get("address"),
      apartment: get("apartment"),
      city: get("city"),
      state: get("state"),
      zip: get("zip"),
    };

    const billingAddress = sameBilling
      ? shippingAddress
      : {
        country: get("billingCountry") || "United Kingdom (UK)",
        firstName: get("billingFirstName"),
        lastName: get("billingLastName"),
        address: get("billingAddress"),
        apartment: get("billingApartment"),
        city: get("billingCity"),
        state: get("billingState"),
        zip: get("billingZip"),
      };

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerEmail,
          phone: customerPhone,
          orderNote: note ? get("note") : "",
          sameBilling,
          shippingAddress,
          billingAddress,
          shippingMethod: shipping,
          paymentMethod: payment,
          cryptoCurrency: payment === "crypto" ? get("currency") : undefined,
          attribution: {
            refSource: get("refSource"),
            utmSource: get("utmSource"),
            utmCampaign: get("utmCampaign"),
            referrer: get("referrer"),
            landingPath: get("landingPath"),
          },
          items: lines.map((l) => ({ id: l.product.id, qty: l.qty })),
        }),
      });

      let data: { accessToken?: string; error?: string } | null = null;
      try {
        data = (await res.json()) as { accessToken?: string; error?: string };
      } catch {
        data = null;
      }

      if (!res.ok || !data?.accessToken) {
        setSubmitError(
          data?.error || "Unable to place your order right now. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      if (addressMode === "saved" && activeSavedAddress) {
        saveCheckoutAddress(
          {
            ...activeSavedAddress,
            email: customerEmail || activeSavedAddress.email,
          },
          activeSavedAddress.id,
        );
      } else if (addressMode === "new" && saveAddress) {
        saveCheckoutAddress(
          {
            ...shippingAddress,
            phone: customerPhone,
            email: customerEmail,
          },
          editingAddressId ?? undefined,
        );
      }

      if (shippingAddress.state) {
        setShipState(shippingAddress.state);
      }

      clearCart();
      router.push(`/checkout/order-received/${data.accessToken}`);
    } catch {
      setSubmitError("Network error while placing your order. Please try again.");
      setSubmitting(false);
    }
  }

  // Props for a text control: red border when invalid, error cleared on edit.
  const input = (name: string) => ({
    name,
    "aria-invalid": errors[name] ? true : undefined,
    className: `${control} ${errors[name] ? "border-[#c8102e]" : "border-ink"}`,
    onChange: () => clearFieldError(name),
  });

  const resolvedShipping = SHIPPING_OPTIONS.map((o) => {
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
            {belowMinimum && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#c8102e] bg-[#fff5f6] px-5 py-4 text-[15px] leading-6 font-semibold text-[#c8102e]"
              >
                <span>
                  Minimum product order is{" "}
                  <strong>{formatPrice(MIN_ORDER_AMOUNT)}</strong>. Add{" "}
                  <strong>{formatPrice(minOrderRemaining)}</strong> more to
                  place your order.
                </span>
                <Link
                  href="/shop"
                  className="inline-flex h-9 items-center rounded-full border-2 border-ink bg-lime px-4 text-xs font-extrabold text-ink"
                >
                  Add more items →
                </Link>
              </div>
            )}
            <input type="hidden" name="refSource" value={touch?.ref ?? ""} />
            <input
              type="hidden"
              name="utmSource"
              value={touch?.utmSource ?? ""}
            />
            <input
              type="hidden"
              name="utmCampaign"
              value={touch?.utmCampaign ?? ""}
            />
            <input
              type="hidden"
              name="referrer"
              value={touch?.referrer ?? ""}
            />
            <input
              type="hidden"
              name="landingPath"
              value={touch?.landingPath ?? ""}
            />
            <section>
              <SectionTitle>Contact information</SectionTitle>
              <Field label="Email address" error={errors.email} className="mt-5">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  name="email"
                  aria-invalid={errors.email ? true : undefined}
                  className={`${control} ${errors.email ? "border-[#c8102e]" : "border-ink"}`}
                  value={currentEmail}
                  onChange={(e) => {
                    setEmailTouched(true);
                    setEmailValue(e.target.value);
                    clearFieldError("email");
                  }}
                />
              </Field>
              {/* <p className="mt-2 text-sm text-[#666]">
                You are currently checking out as a guest.
              </p> */}
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle>Shipping address</SectionTitle>
                {hasSavedAddresses && addressMode === "new" && (
                  <button
                    type="button"
                    onClick={returnToSavedAddresses}
                    className="cursor-pointer text-sm font-bold underline underline-offset-4"
                  >
                    ← Use saved address
                  </button>
                )}
              </div>

              {addressMode === "saved" && activeSavedAddress ? (
                <div className="mt-5 space-y-3">
                  <input
                    type="hidden"
                    name="country"
                    value={activeSavedAddress.country}
                  />
                  <input
                    type="hidden"
                    name="firstName"
                    value={activeSavedAddress.firstName}
                  />
                  <input
                    type="hidden"
                    name="lastName"
                    value={activeSavedAddress.lastName}
                  />
                  <input
                    type="hidden"
                    name="address"
                    value={activeSavedAddress.address}
                  />
                  <input
                    type="hidden"
                    name="apartment"
                    value={activeSavedAddress.apartment}
                  />
                  <input
                    type="hidden"
                    name="city"
                    value={activeSavedAddress.city}
                  />
                  <input
                    type="hidden"
                    name="state"
                    value={activeSavedAddress.state}
                  />
                  <input
                    type="hidden"
                    name="zip"
                    value={activeSavedAddress.zip}
                  />
                  <input
                    type="hidden"
                    name="phone"
                    value={activeSavedAddress.phone}
                  />

                  <div className="space-y-3">
                    {savedStore.addresses.map((addr) => {
                      const isSelected = addr.id === activeSavedAddress.id;
                      const isDefault = addr.id === savedStore.defaultId;
                      return (
                        <div
                          key={addr.id}
                          className={`rounded-2xl border-2 border-ink p-4 transition ${isSelected ? "bg-sand/60" : "bg-white"
                            }`}
                        >
                          <div className="flex flex-wrap items-start gap-3">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                              <input
                                type="radio"
                                name="savedAddressSelection"
                                checked={isSelected}
                                onChange={() => selectSavedAddress(addr)}
                                className="mt-1 size-5 shrink-0 accent-ink"
                              />
                              <div className="min-w-0 space-y-0.5 text-[15px] leading-6">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-ink">
                                    {addr.firstName} {addr.lastName}
                                  </span>
                                  {isDefault && (
                                    <span className="rounded-full border border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-ink/85">
                                  {addr.address}
                                  {addr.apartment ? `, ${addr.apartment}` : ""}
                                </p>
                                <p className="text-ink/85">
                                  {addr.city}, {addr.state} {addr.zip}
                                </p>
                                <p className="text-xs font-semibold text-ink/60">
                                  {addr.country}
                                  {addr.phone ? ` · ${addr.phone}` : ""}
                                </p>
                              </div>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditSavedAddress(addr)}
                                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3 text-xs font-bold hover:bg-lime"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCheckoutAddress(addr.id)}
                                className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink/35 bg-white px-3 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={startNewAddress}
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-cream px-5 text-sm font-bold hover:bg-lime"
                  >
                    + Ship to a different address
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Country / Region" className="sm:col-span-2">
                    <select
                      name="country"
                      disabled
                      title="We only operate in the UK for now."
                      className={`${control} cursor-not-allowed border-ink/50 bg-sand/60 text-ink/75`}
                    >
                      <option value="United Kingdom (UK)">
                        United Kingdom (UK)
                      </option>
                    </select>
                    <span className="mt-1.5 block text-xs font-medium text-ink/65">
                      We only operate in the UK for now.
                    </span>
                  </Field>
                  <Field label="First name" error={errors.firstName}>
                    <input
                      autoComplete="given-name"
                      name="firstName"
                      aria-invalid={errors.firstName ? true : undefined}
                      className={`${control} ${errors.firstName ? "border-[#c8102e]" : "border-ink"}`}
                      value={draft.firstName}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }));
                        clearFieldError("firstName");
                      }}
                    />
                  </Field>
                  <Field label="Last name" error={errors.lastName}>
                    <input
                      autoComplete="family-name"
                      name="lastName"
                      aria-invalid={errors.lastName ? true : undefined}
                      className={`${control} ${errors.lastName ? "border-[#c8102e]" : "border-ink"}`}
                      value={draft.lastName}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }));
                        clearFieldError("lastName");
                      }}
                    />
                  </Field>
                  <Field
                    label="Address"
                    error={errors.address}
                    className="sm:col-span-2"
                  >
                    <input
                      autoComplete="address-line1"
                      name="address"
                      aria-invalid={errors.address ? true : undefined}
                      className={`${control} ${errors.address ? "border-[#c8102e]" : "border-ink"}`}
                      value={draft.address}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }));
                        clearFieldError("address");
                      }}
                    />
                  </Field>
                  {apartment ? (
                    <Field
                      label="Apartment, suite, etc. (optional)"
                      className="sm:col-span-2"
                    >
                      <input
                        name="apartment"
                        autoComplete="address-line2"
                        className={`${control} border-ink`}
                        value={draft.apartment}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            apartment: e.target.value,
                          }))
                        }
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
                  <Field label="Town / City" error={errors.city}>
                    <input
                      autoComplete="address-level2"
                      name="city"
                      aria-invalid={errors.city ? true : undefined}
                      className={`${control} ${errors.city ? "border-[#c8102e]" : "border-ink"}`}
                      value={draft.city}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }));
                        clearFieldError("city");
                      }}
                    />
                  </Field>
                  <Field label="County / Region" error={errors.state}>
                    <select
                      autoComplete="address-level1"
                      name="state"
                      aria-invalid={errors.state ? true : undefined}
                      className={`${control} ${errors.state ? "border-[#c8102e]" : "border-ink"}`}
                      value={effectiveNewState}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDraft((prev) => ({ ...prev, state: value }));
                        setShipState(value);
                        clearFieldError("state");
                      }}
                    >
                      <option value="">Select your county / region</option>
                      {states.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Postcode" error={errors.zip}>
                    <input
                      autoComplete="postal-code"
                      placeholder="e.g. SW1A 1AA"
                      name="zip"
                      aria-invalid={errors.zip ? true : undefined}
                      className={`${control} ${errors.zip ? "border-[#c8102e]" : "border-ink"}`}
                      value={draft.zip}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          zip: e.target.value,
                        }));
                        clearFieldError("zip");
                      }}
                    />
                  </Field>
                  <Field label="Phone (optional)">
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className={`${control} border-ink`}
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <label className="flex cursor-pointer items-center gap-3 text-[15px] font-medium sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="size-6 shrink-0 accent-ink"
                    />
                    Save this address as my default for future orders
                  </label>
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  name="sameBilling"
                  checked={sameBilling}
                  onChange={(e) => setSameBilling(e.target.checked)}
                  className="size-6 shrink-0 accent-ink"
                />
                Use same address for billing
              </label>

              {!sameBilling && (
                <div className="mt-6 rounded-2xl border-2 border-ink/15 bg-cream/60 p-5 sm:p-6">
                  <h3 className="text-lg font-extrabold">Billing address</h3>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <Field label="Country / Region" className="sm:col-span-2">
                      <select
                        name="billingCountry"
                        disabled
                        title="We only operate in the UK for now."
                        className={`${control} cursor-not-allowed border-ink/50 bg-sand/60 text-ink/75`}
                      >
                        <option value="United Kingdom (UK)">
                          United Kingdom (UK)
                        </option>
                      </select>
                      <span className="mt-1.5 block text-xs font-medium text-ink/65">
                        We only operate in the UK for now.
                      </span>
                    </Field>
                    <Field label="First name" error={errors.billingFirstName}>
                      <input {...input("billingFirstName")} />
                    </Field>
                    <Field label="Last name" error={errors.billingLastName}>
                      <input {...input("billingLastName")} />
                    </Field>
                    <Field
                      label="Address"
                      error={errors.billingAddress}
                      className="sm:col-span-2"
                    >
                      <input {...input("billingAddress")} />
                    </Field>
                    <Field
                      label="Apartment, suite, etc. (optional)"
                      className="sm:col-span-2"
                    >
                      <input
                        name="billingApartment"
                        className={`${control} border-ink`}
                      />
                    </Field>
                    <Field label="Town / City" error={errors.billingCity}>
                      <input {...input("billingCity")} />
                    </Field>
                    <Field label="County / Region" error={errors.billingState}>
                      <select defaultValue="" {...input("billingState")}>
                        <option value="">Select your county / region</option>
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Postcode" error={errors.billingZip}>
                      <input
                        placeholder="e.g. SW1A 1AA"
                        {...input("billingZip")}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </section>

            <section>
              <SectionTitle>Shipping options</SectionTitle>
              <RadioGroup
                name="shipping"
                options={resolvedShipping}
                value={shipping}
                onChange={(id) => setShipping(id as ShippingMethodId)}
              />
            </section>

            <section>
              <SectionTitle>Payment options</SectionTitle>
              <RadioGroup
                name="payment"
                options={PAYMENT_OPTIONS}
                value={payment}
                onChange={(id) => setPayment(id as PaymentMethod)}
                detail={(id) =>
                  id === "crypto" ? (
                    <div className="px-[18px] pb-5">
                      <Field label="Please select a currency *" error={errors.currency}>
                        <select defaultValue="" {...input("currency")}>
                          <option value="" disabled>
                            Select a currency
                          </option>
                          {CRYPTO_CURRENCY_LIST.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  ) : (
                    <p className="px-[18px] pb-5 text-[15px] leading-6 text-ink/80">
                      {id === "gift-card"
                        ? checkoutHints.giftCardCheckoutHint
                        : checkoutHints.bankCheckoutHint}
                    </p>
                  )
                }
              />
            </section>

            <section>
              <label className="flex cursor-pointer items-center gap-3 text-[15px]">
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
                disabled={submitting || belowMinimum}
                className="mt-6 flex h-[60px] w-full cursor-pointer items-center justify-center rounded-full bg-ink px-6 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Placing order…"
                  : belowMinimum
                    ? `Add ${formatPrice(minOrderRemaining)} more to order`
                    : "Place order"}
              </button>
              {submitError && (
                <p
                  role="alert"
                  className="mt-4 text-center text-[15px] leading-6 font-semibold text-[#c8102e]"
                >
                  {submitError}
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
                      className={`relative size-full overflow-hidden rounded-[10px] ${bgClass[product.categoryColor ?? "pink"]}`}
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
