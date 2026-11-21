"use client";

import { useMemo, useSyncExternalStore } from "react";
import { type Product, products } from "./catalog";

// The bag lives in the browser's localStorage, so it survives reloads but is
// per-device. Components stay in sync through a custom event (same tab) and
// the native "storage" event (other tabs).
const CART_KEY = "momo-eliquid-cart";
const STATE_KEY = "momo-eliquid-ship-state";
const CHANGE_EVENT = "momo-eliquid-storage";
const MAX_QTY = 99;

export type CartLine = { product: Product; qty: number };
type StoredLine = { id: string; qty: number };

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
        Number.isInteger(l?.qty) &&
        l.qty > 0 &&
        products.some((p) => p.id === l.id),
    );
  } catch {
    return [];
  }
}

function update(fn: (lines: StoredLine[]) => StoredLine[]) {
  writeRaw(CART_KEY, JSON.stringify(fn(parseLines(readRaw(CART_KEY)))));
}

export function addToCart(id: string) {
  update((lines) =>
    lines.some((l) => l.id === id)
      ? lines.map((l) =>
          l.id === id ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY) } : l,
        )
      : [...lines, { id, qty: 1 }],
  );
}

export function setQty(id: string, qty: number) {
  const next = Math.max(1, Math.min(qty, MAX_QTY));
  update((lines) => lines.map((l) => (l.id === id ? { ...l, qty: next } : l)));
}

export function removeFromCart(id: string) {
  update((lines) => lines.filter((l) => l.id !== id));
}

export function useCart() {
  const raw = useStored(CART_KEY);
  const lines = useMemo<CartLine[]>(
    () =>
      parseLines(raw ?? "").map((l) => ({
        product: products.find((p) => p.id === l.id)!,
        qty: l.qty,
      })),
    [raw],
  );
  return {
    /** False until the bag has been read from localStorage. */
    ready: raw !== null,
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
  };
}

/** The shipping state picked in the bag, shared with checkout. */
export function useShipState(): [string, (state: string) => void] {
  const raw = useStored(STATE_KEY);
  return [raw ?? "", (state) => writeRaw(STATE_KEY, state)];
}
