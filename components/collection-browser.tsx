"use client";

import Link from "next/link";
import { useState } from "react";
import { type Category, type Product, bgClass } from "@/lib/catalog";
import ProductCard from "./product-card";

const PAGE_SIZE = 8;

const sorts = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
  "name-desc": "Name: Z to A",
} as const;

type Sort = keyof typeof sorts;

function Pill({
  href,
  active,
  dot,
  children,
}: {
  href: string;
  active: boolean;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink px-4 text-sm font-bold sm:h-[46px] sm:gap-2.5 sm:px-[22px] sm:text-base ${
        active ? "bg-ink text-white" : ""
      }`}
    >
      <span className={`size-3.5 rounded-full border-2 border-ink ${dot}`} />
      {children}
    </Link>
  );
}

export default function CollectionBrowser({
  categories,
  active,
  products,
}: {
  categories: Category[];
  /** Slug of the current category, or undefined on the "all" page. */
  active?: string;
  products: Product[];
}) {
  const [sort, setSort] = useState<Sort>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sorted =
    sort === "featured"
      ? products
      : [...products].sort((a, b) => {
          switch (sort) {
            case "price-asc":
              return a.price - b.price;
            case "price-desc":
              return b.price - a.price;
            case "name-asc":
              return a.name.localeCompare(b.name);
            case "name-desc":
              return b.name.localeCompare(a.name);
          }
        });
  const shown = sorted.slice(0, visible);
  const hasMore = shown.length < sorted.length;

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:mt-[37px] xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label="Categories" className="flex flex-wrap gap-2 sm:gap-2.5">
          <Pill href="/shop" active={!active} dot="bg-cream">
            All
          </Pill>
          {categories.map((c) => (
            <Pill
              key={c.slug}
              href={`/shop/${c.slug}`}
              active={c.slug === active}
              dot={bgClass[c.color]}
            >
              {c.short}
            </Pill>
          ))}
        </nav>
        <label className="flex shrink-0 items-center gap-3.5 font-bold">
          Sort by
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as Sort);
              setVisible(PAGE_SIZE);
            }}
            className="h-10 w-[218px] rounded-xl border-2 border-ink bg-white px-4 font-medium sm:h-[46px] sm:px-[18px]"
          >
            {Object.entries(sorts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-4 lg:mt-[37px] lg:grid-cols-4 lg:gap-5 xl:gap-[26px]">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
      <div className="mt-10 text-center lg:mt-[52px]">
        <p aria-live="polite">
          Showing {shown.length} of {sorted.length} products
        </p>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-[13px] h-14 cursor-pointer rounded-full border-2 border-ink px-[30px] text-[17px] font-bold disabled:cursor-default disabled:opacity-40"
        >
          Load more
        </button>
      </div>
    </>
  );
}
