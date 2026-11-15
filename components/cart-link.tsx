"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/** Bag icon in the nav with the live item count. */
export default function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
      className="flex items-center gap-2"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-lime px-1.5 text-xs font-bold">
        {count}
      </span>
    </Link>
  );
}
