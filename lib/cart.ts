"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Product } from "./catalog";
import { states } from "./states";

// The bag lives in the browser's localStorage, so it survives reloads but is
// per-device. Components stay in sync through a custom event (same tab) and
// the native "storage" event (other tabs).
const CART_KEY = "momo-eliquid-cart";
const STATE_KEY = "momo-eliquid-ship-state";
const CHANGE_EVENT = "momo-eliquid-storage";
const MAX_QTY = 99;

export type CartLine = { product: Product; qty: number };
type StoredLine = { id: string; qty: number };

let cachedCatalogProducts: Product[] | null = null;
let inFlightProductsFetch: Promise<Product[]> | null = null;

async function fetchCatalogProducts(): Promise<Product[]> {
  if (!inFlightProductsFetch) {
    inFlightProductsFetch = fetch("/api/products", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as { products?: Product[] };
        const list = Array.isArray(json.products) ? json.products : [];
        cachedCatalogProducts = list;
        return list;
      })
      .finally(() => {
        inFlightProductsFetch = null;
      });
  }
  return inFlightProductsFetch;
}

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeRaw(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota): the change is dropped.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Raw stored string, or null while rendering on the server / before hydration. */
function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
}

function parseLines(raw: string): StoredLine[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (l): l is StoredLine =>
        typeof l?.id === "string" &&
        l.id.length > 0 &&
        Number.isInteger(l?.qty) &&
        l.qty > 0,
    );
  } catch {
    return [];
  }
}

function update(fn: (lines: StoredLine[]) => StoredLine[]) {
  writeRaw(CART_KEY, JSON.stringify(fn(parseLines(readRaw(CART_KEY)))));
}

export function addToCart(id: string, qty = 1) {
  const step = Math.max(1, Math.min(Math.trunc(qty) || 1, MAX_QTY));
  update((lines) =>
    lines.some((l) => l.id === id)
      ? lines.map((l) =>
          l.id === id ? { ...l, qty: Math.min(l.qty + step, MAX_QTY) } : l,
        )
      : [...lines, { id, qty: step }],
  );
}

export function setQty(id: string, qty: number) {
  const next = Math.max(1, Math.min(qty, MAX_QTY));
  update((lines) => lines.map((l) => (l.id === id ? { ...l, qty: next } : l)));
}

export function removeFromCart(id: string) {
  update((lines) => lines.filter((l) => l.id !== id));
}

/** Lightweight item count for nav badges without fetching the product catalog. */
export function useCartCount(): number {
  const raw = useStored(CART_KEY);
  return useMemo(
    () => parseLines(raw ?? "").reduce((n, l) => n + l.qty, 0),
    [raw],
  );
}

export function useCart() {
  const raw = useStored(CART_KEY);
  const [products, setProducts] = useState<Product[]>(
    () => cachedCatalogProducts ?? [],
  );
  const [loaded, setLoaded] = useState(() => cachedCatalogProducts !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCatalogProducts()
      .then((items) => {
        if (!active) return;
        setProducts(items);
        setLoaded(true);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
        setError("Unable to load products from the catalog API.");
      });
    return () => {
      active = false;
    };
  }, []);

  const lines = useMemo<CartLine[]>(() => {
    if (!loaded) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return parseLines(raw ?? "").flatMap((l) => {
      const product = byId.get(l.id);
      return product ? [{ product, qty: l.qty }] : [];
    });
  }, [raw, loaded, products]);

  return {
    /** False until the bag has been read from localStorage and API catalog loaded. */
    ready: raw !== null && loaded,
    lines,
    products,
    count: lines.reduce((n, l) => n + l.qty, 0),
    error,
  };
}

/** The shipping county/region picked in the bag, shared with checkout. */
export function useShipState(): [string, (state: string) => void] {
  const raw = useStored(STATE_KEY);
  const valid = raw && states.includes(raw) ? raw : "";
  return [valid, (state) => writeRaw(STATE_KEY, state)];
}
