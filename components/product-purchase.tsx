"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";

export default function ProductPurchase({
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const step =
    "grid h-full w-11 cursor-pointer place-items-center text-xl font-bold disabled:cursor-default disabled:opacity-30";

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex h-14 items-center self-start rounded-full border-2 border-ink bg-white">
        <button
          type="button"
          aria-label={`Decrease quantity of ${name}`}
          disabled={qty <= 1}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className={step}
        >
          −
        </button>
        <span aria-live="polite" className="w-9 text-center text-lg font-bold">
          {qty}
        </span>
        <button
          type="button"
          aria-label={`Increase quantity of ${name}`}
          disabled={qty >= 99}
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          className={step}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          addToCart(id, qty);
          setAdded(true);
          setHasAdded(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1500);
        }}
        className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-full bg-pink px-7 text-[17px] font-bold text-ink"
      >
        <span aria-live="polite">
          {added
            ? "Added to bag"
            : `Add to bag · ${formatPrice(price * qty)}`}
        </span>
      </button>
      {hasAdded && (
        <Link
          href="/cart"
          className="inline-flex h-14 items-center justify-center rounded-full border-2 border-ink px-6 text-[17px] font-bold"
        >
          View bag
        </Link>
      )}
    </div>
  );
}
