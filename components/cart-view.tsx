"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type CartLine,
  removeFromCart,
  setQty,
  useCart,
  useShipState,
} from "@/lib/cart";
import { bgClass, getCategory, productTag, products } from "@/lib/catalog";
import { states } from "@/lib/states";
import AddToBag from "./add-to-bag";
import { ArrowIcon, GummiesIcon } from "./illustrations";
import { ProductArt } from "./product-card";

// Shown under the bag, in this order, skipping anything already in it.
const SUGGESTED = ["purple-reign-disposable", "crown-grinder", "sour-sunburst-bites"];

function Line({ product, qty }: CartLine) {
  const color = getCategory(product.category)?.color ?? "pink";
  const tag = productTag(product);
  const step =
    "grid h-full w-10 cursor-pointer place-items-center text-xl font-bold disabled:cursor-default disabled:opacity-30 sm:w-11";
  return (
    <li className="flex gap-4 rounded-3xl bg-white p-3.5 sm:gap-[27px] sm:p-[17px]">
      <div
        className={`grid aspect-[138/173] w-[92px] shrink-0 place-items-center self-start rounded-[14px] sm:w-[138px] ${bgClass[color]}`}
      >
        <ProductArt product={product} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:pt-[3px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[17px] leading-[1.3] font-semibold tracking-[0.01em] sm:text-[21px]">
            {product.name}
          </h2>
          <span className="shrink-0 text-[17px] leading-[1.3] font-medium sm:text-[21px]">
            [Price]
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-[22px] text-[#666] sm:text-sm">
          {product.meta}
        </p>
        <p
          className={`mt-2 inline-flex h-6 items-center self-start rounded-full px-[11px] text-[10px] font-bold tracking-[0.1em] uppercase sm:text-[11px] ${tag.className}`}
        >
          {tag.label}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="inline-flex h-10 items-center rounded-full border-2 border-ink sm:h-[46px]">
            <button
              type="button"
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={qty <= 1}
              onClick={() => setQty(product.id, qty - 1)}
              className={step}
            >
              −
            </button>
            <span aria-live="polite" className="w-8 text-center text-lg font-medium">
              {qty}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${product.name}`}
              onClick={() => setQty(product.id, qty + 1)}
              className={step}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeFromCart(product.id)}
            className="mb-2 cursor-pointer text-[15px] font-bold underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function Summary({ count }: { count: number }) {
  const [state, setState] = useShipState();
  const [confirmed, setConfirmed] = useState(false);
  const [promoTried, setPromoTried] = useState(false);
  const blocked = !state
    ? "Choose a shipping state to continue"
    : !confirmed
      ? "Confirm your age to continue"
      : null;
  const cta =
    "flex min-h-[60px] w-full items-center justify-center gap-1.5 rounded-full px-6 py-2 text-center text-lg leading-[1.4] font-bold";

  return (
    <aside className="rounded-[28px] bg-white px-5 py-8 sm:px-[35px] sm:py-9">
      <h2 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] sm:text-[30px]">
        Order summary
      </h2>
      <label className="mt-6 block text-[15px] font-bold">
        Shipping to
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="mt-2.5 block h-[54px] w-full rounded-xl border-2 border-ink bg-white px-[18px] text-[17px] font-medium"
        >
          <option value="">Select your state</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <form
        className="mt-7 flex gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setPromoTried(true);
        }}
      >
        <input
          name="promo"
          aria-label="Promo code"
          placeholder="Promo code"
          className="h-[50px] min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-[18px] text-[17px] placeholder:text-ink/45"
        />
        <button
          type="submit"
          className="h-[50px] cursor-pointer rounded-xl border-2 border-ink px-[22px] text-[17px] font-bold"
        >
          Apply
        </button>
      </form>
      {promoTried && (
        <p role="status" className="mt-2 text-sm leading-5">
          [Promo codes are not connected yet.]
        </p>
      )}
      <dl className="mt-7 space-y-[15px] text-[17px] leading-6">
        <div className="flex justify-between gap-4">
          <dt>
            Subtotal ({count} {count === 1 ? "item" : "items"})
          </dt>
          <dd className="font-bold">[Subtotal]</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Shipping</dt>
          <dd>Calculated at checkout</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Estimated taxes</dt>
          <dd>[Excise + sales tax]</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-ink/15 pt-5 text-[22px] leading-7 font-bold">
          <dt>Total</dt>
          <dd>[Total]</dd>
        </div>
      </dl>
      <label className="mt-7 flex gap-3 text-[15px] leading-[23px]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 size-6 shrink-0 accent-ink"
        />
        <span>
          I confirm I&apos;m 21 or older and will show valid ID on delivery. I
          agree to the{" "}
          <Link href="#" className="underline underline-offset-2">
            Terms
          </Link>
          .
        </span>
      </label>
      {blocked ? (
        <button type="button" disabled className={`${cta} mt-5 bg-[#e8dccb]`}>
          {blocked}
        </button>
      ) : (
        <Link href="/checkout" className={`${cta} mt-5 bg-pink`}>
          Continue to shipping
          <ArrowIcon className="size-[18px]" />
        </Link>
      )}
      <p className="mt-6 text-center text-[13.5px] leading-[21px]">
        Secure checkout · ID verification by [verification provider] ·
        [Accepted payment methods]
      </p>
    </aside>
  );
}

function Empty() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-[28px] bg-white px-6 py-14 text-center lg:mt-[35px] lg:py-20">
      <div className="grid size-[150px] place-items-center rounded-full bg-lime">
        <GummiesIcon className="w-[62%]" />
      </div>
      <h2 className="mt-8 text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[43px]">
        Your bag is{" "}
        <em className="font-serif text-[1.1em] leading-[0] font-normal tracking-[-0.01em]">
          empty.
        </em>
      </h2>
      <p className="mt-4 max-w-[420px] text-[17px] leading-7">
        Nothing in here yet. Have a look around and add something loud.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex h-14 items-center gap-1.5 rounded-full bg-ink px-7 text-[17px] font-bold text-white"
      >
        Shop the drop
        <ArrowIcon className="size-[18px]" />
      </Link>
    </div>
  );
}

function Suggestions({ lines }: { lines: CartLine[] }) {
  const inBag = new Set(lines.map((l) => l.product.id));
  const picks = [
    ...SUGGESTED.flatMap((id) => products.filter((p) => p.id === id)),
    ...products.filter((p) => !SUGGESTED.includes(p.id)),
  ]
    .filter((p) => !inBag.has(p.id))
    .slice(0, 3);
  if (picks.length === 0) return null;

  return (
    <section className="mt-16 lg:mt-[100px]">
      <h2 className="text-[30px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[43px]">
        Complete the vibe
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-[34px] xl:grid-cols-4 xl:gap-[27px]">
        {picks.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-[18px] rounded-[22px] bg-white p-[13px]"
          >
            <div
              className={`size-[104px] shrink-0 rounded-[14px] ${bgClass[getCategory(p.category)?.color ?? "pink"]}`}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] leading-6 font-semibold tracking-[0.01em]">
                {p.name}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span>[Price]</span>
                <AddToBag
                  id={p.id}
                  label="Add"
                  className="h-[43px] rounded-[10px] bg-pink px-4 text-[15px] font-bold"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CartView() {
  const { ready, lines, count } = useCart();

  return (
    <main className="shell pt-8 pb-16 lg:pt-[30px] lg:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.04em] sm:text-[60px]">
          Your{" "}
          <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
            royal
          </em>{" "}
          bag
        </h1>
        <Link
          href="/shop"
          className="mb-2 inline-flex items-center gap-1.5 font-bold sm:text-[17px]"
        >
          <ArrowIcon className="size-4 rotate-180" />
          Keep shopping
        </Link>
      </div>
      {!ready ? (
        // Bag not read from localStorage yet: hold the space, show nothing.
        <div className="min-h-[420px]" />
      ) : lines.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-8 grid items-start gap-9 lg:mt-[35px] xl:grid-cols-[1fr_370px]">
          <div>
            <ul className="flex flex-col gap-[18px]">
              {lines.map((l) => (
                <Line key={l.product.id} {...l} />
              ))}
            </ul>
            <div className="mt-[18px] flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-[22px] bg-lime px-[26px] py-[19px] leading-6">
              <p className="font-semibold">
                Add [amount] more for free shipping.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 font-bold"
              >
                Top up
                <ArrowIcon className="size-4" />
              </Link>
            </div>
          </div>
          <Summary count={count} />
        </div>
      )}
      {ready && <Suggestions lines={lines} />}
    </main>
  );
}
