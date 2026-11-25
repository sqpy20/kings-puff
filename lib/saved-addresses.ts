"use client";

import { useSyncExternalStore } from "react";

export type SavedAddress = {
  id: string;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  updatedAt: string;
};

export type SavedAddressStore = {
  defaultId: string | null;
  addresses: SavedAddress[];
};

const STORAGE_KEY = "momo_checkout_saved_addresses_v1";
const MAX_SAVED_ADDRESSES = 5;
const EMPTY_STORE: SavedAddressStore = { defaultId: null, addresses: [] };

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: SavedAddressStore = EMPTY_STORE;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function normalizeRecord(raw: unknown): SavedAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (key: string) =>
    typeof r[key] === "string" ? r[key].trim() : "";

  const id = str("id");
  const firstName = str("firstName");
  const lastName = str("lastName");
  const address = str("address");
  const city = str("city");
  const state = str("state");
  const zip = str("zip");

  if (!id || !firstName || !lastName || !address || !city || !state || !zip) {
    return null;
  }

  return {
    id,
    country: str("country") || "United Kingdom (UK)",
    firstName,
    lastName,
    address,
    apartment: str("apartment"),
    city,
    state,
    zip,
    phone: str("phone"),
    email: str("email"),
    updatedAt: str("updatedAt") || new Date(0).toISOString(),
  };
}

function readStore(): SavedAddressStore {
  if (typeof window === "undefined") return EMPTY_STORE;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_STORE;
  }

  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_STORE;
    return cachedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw) as {
      defaultId?: unknown;
      addresses?: unknown;
    };
    const addresses = Array.isArray(parsed?.addresses)
      ? parsed.addresses
          .map(normalizeRecord)
          .filter((item): item is SavedAddress => item !== null)
      : [];
    const rawDefault =
      typeof parsed?.defaultId === "string" ? parsed.defaultId : null;
    const defaultId =
      rawDefault && addresses.some((a) => a.id === rawDefault)
        ? rawDefault
        : (addresses[0]?.id ?? null);

    cachedSnapshot = { defaultId, addresses };
    return cachedSnapshot;
  } catch {
    cachedSnapshot = EMPTY_STORE;
    return cachedSnapshot;
  }
}

function writeStore(next: SavedAddressStore) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(next);
  cachedRaw = serialized;
  cachedSnapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Ignore storage quota or private-mode errors gracefully.
  }
  emitChange();
}

function addressFingerprint(
  addr: Pick<
    SavedAddress,
    "firstName" | "lastName" | "address" | "apartment" | "city" | "state" | "zip"
  >,
): string {
  return [
    addr.firstName,
    addr.lastName,
    addr.address,
    addr.apartment,
    addr.city,
    addr.state,
    addr.zip,
  ]
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

function createAddressId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Subscribes to cached customer shipping addresses in localStorage without hydration drift. */
export function useSavedAddresses(): SavedAddressStore {
  return useSyncExternalStore(subscribe, readStore, () => EMPTY_STORE);
}

/** Saves or updates a shipping address and promotes it to the customer's default. */
export function saveCheckoutAddress(
  input: Omit<SavedAddress, "id" | "updatedAt">,
  replaceId?: string,
): SavedAddress {
  const store = readStore();
  const clean: Omit<SavedAddress, "id" | "updatedAt"> = {
    country: input.country.trim() || "United Kingdom (UK)",
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    address: input.address.trim(),
    apartment: input.apartment.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
  };

  const targetFingerprint = addressFingerprint(clean);
  const existing = store.addresses.find(
    (item) =>
      (replaceId && item.id === replaceId) ||
      addressFingerprint(item) === targetFingerprint,
  );

  const saved: SavedAddress = {
    ...clean,
    id: existing?.id ?? createAddressId(),
    updatedAt: new Date().toISOString(),
  };

  const remaining = store.addresses.filter((item) => item.id !== saved.id);
  const addresses = [saved, ...remaining].slice(0, MAX_SAVED_ADDRESSES);

  writeStore({
    defaultId: saved.id,
    addresses,
  });

  return saved;
}

/** Marks a cached address as the customer's default for future checkouts. */
export function setDefaultCheckoutAddress(id: string) {
  const store = readStore();
  if (!store.addresses.some((item) => item.id === id)) return;
  if (store.defaultId === id) return;
  writeStore({
    ...store,
    defaultId: id,
  });
}

/** Removes a cached address and promotes the next remaining entry as default if needed. */
export function removeCheckoutAddress(id: string) {
  const store = readStore();
  const addresses = store.addresses.filter((item) => item.id !== id);
  const defaultId =
    store.defaultId === id
      ? (addresses[0]?.id ?? null)
      : store.defaultId;
  writeStore({
    defaultId,
    addresses,
  });
}
