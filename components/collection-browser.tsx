"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type Category, type Product, bgClass } from "@/lib/catalog";
import Pagination, { paginateItems } from "./pagination";
import ProductCard from "./product-card";

const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZE_OPTIONS = [8, 12, 24];
const URL_CHANGE_EVENT = "momo:collection-url-change";

const sorts = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
  "name-desc": "Name: Z to A",
} as const;

type Sort = keyof typeof sorts;

function subscribeUrl(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", listener);
  window.addEventListener(URL_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(URL_CHANGE_EVENT, listener);
  };
}

function readUrlSearchQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function readUrlPage(): number {
  if (typeof window === "undefined") return 1;
  const raw = Number(new URLSearchParams(window.location.search).get("page"));
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
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
    subscribeUrl,
    readUrlSearchQuery,
    () => "",
  );
  const urlPage = useSyncExternalStore(subscribeUrl, readUrlPage, () => 1);
  const [searchEdited, setSearchEdited] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const gridTopRef = useRef<HTMLDivElement>(null);

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

  const { items: shown, safePage } = paginateItems(sorted, urlPage, pageSize);

  function syncUrlPage(nextPage: number) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (nextPage > 1) {
      url.searchParams.set("page", String(nextPage));
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState(null, "", url.pathname + url.search);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  }

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
      url.searchParams.delete("page");
      window.history.replaceState(null, "", url.pathname + url.search);
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    }
  }

  function handleSortChange(nextSort: Sort) {
    setSort(nextSort);
    syncUrlPage(1);
  }

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    syncUrlPage(1);
  }

  function handlePageChange(nextPage: number) {
    syncUrlPage(nextPage);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div
        ref={gridTopRef}
        className="mt-6 flex scroll-mt-24 flex-col gap-4 lg:mt-[32px] xl:flex-row xl:items-center xl:justify-between"
      >
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
            onChange={(e) => handleSortChange(e.target.value as Sort)}
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

      <Pagination
        variant="storefront"
        page={safePage}
        pageSize={pageSize}
        totalItems={sorted.length}
        itemLabel="products"
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        className="mt-10 lg:mt-[52px]"
      />
    </>
  );
}
