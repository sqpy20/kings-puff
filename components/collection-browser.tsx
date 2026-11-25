"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { type Category, type Product, bgClass } from "@/lib/catalog";
import ProductCard from "./product-card";

const PAGE_SIZE = 24;

const sorts = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
  "name-desc": "Name: Z to A",
} as const;

type Sort = keyof typeof sorts;

function subscribePopState(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function readUrlSearchQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

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
  const urlQuery = useSyncExternalStore(
    subscribePopState,
    readUrlSearchQuery,
    () => "",
  );
  const [searchEdited, setSearchEdited] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = searchEdited ? searchDraft : urlQuery;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const detailsText = p.details.map((d) => `${d.label} ${d.value}`).join(" ");
      const haystack = `${p.name} ${p.meta} ${p.description} ${p.category} ${detailsText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, query]);

  const sorted = useMemo(() => {
    if (sort === "featured") return filtered;
    return [...filtered].sort((a, b) => {
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
  }, [filtered, sort]);

  const shown = sorted.slice(0, visible);
  const hasMore = shown.length < sorted.length;

  function handleSearchChange(nextValue: string) {
    setSearchEdited(true);
    setSearchDraft(nextValue);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextValue.trim()) {
        url.searchParams.set("q", nextValue.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:mt-[32px] xl:flex-row xl:items-center xl:justify-between">
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

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            id="search"
            type="search"
            aria-label="Search products"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search flavours, mg, strains…"
            className="h-10 min-w-[210px] flex-1 rounded-full border-2 border-ink bg-white px-4 text-sm font-medium placeholder:text-ink/45 sm:h-[46px] sm:flex-initial"
          />
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 rounded-full border-2 border-ink bg-white px-4 text-sm font-bold sm:h-[46px]"
          >
            {Object.entries(sorts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[24px] border-2 border-ink bg-white px-6 py-12 text-center">
          <p className="text-base font-bold">
            No products matched &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 lg:mt-[32px] lg:grid-cols-4 lg:gap-5 xl:gap-[26px]">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ul>
      )}

      <div className="mt-10 text-center lg:mt-[52px]">
        <p aria-live="polite">
          Showing {shown.length} of {sorted.length} products
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="mt-[13px] h-14 cursor-pointer rounded-full border-2 border-ink px-[30px] text-[17px] font-bold"
          >
            Load more
          </button>
        )}
      </div>
    </>
  );
}
