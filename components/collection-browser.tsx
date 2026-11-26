"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Category, type Product, bgClass } from "@/lib/catalog";
import ProductCard from "./product-card";

const BATCH_SIZE = 8;

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
      className={`inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink px-4 text-sm font-bold sm:h-11.5 sm:gap-2.5 sm:px-5.5 sm:text-base ${
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
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

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

  const shown = sorted.slice(0, visibleCount);
  const hasMore = shown.length < sorted.length;
  const progressPct =
    sorted.length > 0
      ? Math.min(100, Math.round((shown.length / sorted.length) * 100))
      : 0;

  const resetScrollBatch = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    loadingRef.current = false;
    setLoadingMore(false);
    setVisibleCount(BATCH_SIZE);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setVisibleCount((prev) => prev + BATCH_SIZE);
      loadingRef.current = false;
      setLoadingMore(false);
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  function handleSearchChange(nextValue: string) {
    setSearchEdited(true);
    setSearchDraft(nextValue);
    resetScrollBatch();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextValue.trim()) {
        url.searchParams.set("q", nextValue.trim());
      } else {
        url.searchParams.delete("q");
      }
      url.searchParams.delete("page");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }

  function handleSortChange(nextSort: Sort) {
    setSort(nextSort);
    resetScrollBatch();
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:mt-8 xl:flex-row xl:items-center xl:justify-between">
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

      {sorted.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center lg:mt-[52px]">
          <p aria-live="polite" className="text-sm font-semibold text-ink/80">
            Showing <strong className="font-extrabold text-ink">{shown.length}</strong>{" "}
            of <strong className="font-extrabold text-ink">{sorted.length}</strong>{" "}
            products
          </p>

          <div
            aria-hidden="true"
            className="h-2 w-48 overflow-hidden rounded-full border-2 border-ink bg-white"
          >
            <div
              className="h-full bg-lime transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="mt-1 flex min-h-12 flex-col items-center justify-center gap-2"
            >
              {loadingMore ? (
                <div
                  role="status"
                  className="inline-flex h-11 items-center gap-2.5 rounded-full border-2 border-ink bg-lime px-6 text-sm font-extrabold text-ink"
                >
                  <span
                    aria-hidden="true"
                    className="size-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent"
                  />
                  Loading more products…
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={loadMore}
                    className="inline-flex h-11 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-6 text-sm font-extrabold text-ink transition hover:bg-lime"
                  >
                    Load more products
                  </button>
                  <p className="text-xs font-medium text-ink/60">
                    Scroll down to load more
                  </p>
                </>
              )}
            </div>
          ) : (
            sorted.length > BATCH_SIZE && (
              <span className="mt-1 inline-flex items-center rounded-full border-2 border-ink bg-sand px-4 py-1 text-xs font-extrabold text-ink">
                All {sorted.length} products loaded
              </span>
            )
          )}
        </div>
      )}
    </>
  );
}
