import crypto from "node:crypto";
import "server-only";
import { FREE_SHIPPING_THRESHOLD } from "./catalog";
import { getCryptoQuote } from "./crypto-rates";
import { getPool } from "./db";
import {
  type AdminOrderStats,
  type CryptoCurrencyCode,
  DEFAULT_PAYMENT_SETTINGS,
  ORDER_STATUS_OPTIONS,
  type OrderAddress,
  type OrderAttribution,
  type OrderItem,
  type OrderRecord,
  type OrderStatus,
  PAYMENT_OPTIONS,
  type PaymentMethod,
  type PaymentSettings,
  SHIPPING_OPTIONS,
  type ShippingMethodId,
  normalizeCryptoCode,
} from "./payment";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const TOKEN_RE = /^[a-f0-9]{32}$/i;
const VALID_ORDER_STATUSES = new Set<OrderStatus>(
  ORDER_STATUS_OPTIONS.map((o) => o.id),
);
const VALID_PAYMENT_METHODS = new Set<PaymentMethod>(
  PAYMENT_OPTIONS.map((o) => o.id),
);

export class OrderDataError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const globalForOrders = globalThis as typeof globalThis & {
  __momoOrdersSchemaPromise?: Promise<void>;
  __momoOrdersSchemaVersion?: number;
};

const ORDERS_SCHEMA_VERSION = 2;

/** Idempotently creates/migrates order and payment_settings tables/sequence if missing. */
export async function ensureOrdersSchema(): Promise<void> {
  if (
    !globalForOrders.__momoOrdersSchemaPromise ||
    globalForOrders.__momoOrdersSchemaVersion !== ORDERS_SCHEMA_VERSION
  ) {
    const db = getPool();
    globalForOrders.__momoOrdersSchemaVersion = ORDERS_SCHEMA_VERSION;
    globalForOrders.__momoOrdersSchemaPromise = (async () => {
      await db.query(
        `CREATE SEQUENCE IF NOT EXISTS public.orders_number_seq START WITH 1001;`,
      );
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.orders (
          id BIGSERIAL PRIMARY KEY,
          order_number INTEGER NOT NULL UNIQUE DEFAULT nextval('public.orders_number_seq'),
          access_token TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending_payment',
          payment_method TEXT NOT NULL,
          shipping_method TEXT NOT NULL,
          shipping_label TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          shipping_address JSONB NOT NULL,
          billing_address JSONB NOT NULL,
          same_billing BOOLEAN NOT NULL DEFAULT true,
          items JSONB NOT NULL,
          subtotal_pence INTEGER NOT NULL,
          shipping_pence INTEGER NOT NULL,
          total_pence INTEGER NOT NULL,
          order_note TEXT NOT NULL DEFAULT '',
          crypto_currency TEXT,
          crypto_amount TEXT,
          crypto_address TEXT,
          crypto_rate_gbp NUMERIC(18, 6),
          crypto_expires_at TIMESTAMPTZ,
          attribution JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_created_at
          ON public.orders (created_at DESC);
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.payment_settings (
          id TEXT PRIMARY KEY,
          support_email TEXT NOT NULL DEFAULT 'support@momoeliquidz.co.uk',
          btc_address TEXT NOT NULL DEFAULT '',
          eth_address TEXT NOT NULL DEFAULT '',
          sol_address TEXT NOT NULL DEFAULT '',
          usdt_address TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.query(`
        ALTER TABLE public.payment_settings
          ADD COLUMN IF NOT EXISTS order_received_subtitle TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS gift_card_title TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS gift_card_checkout_hint TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS gift_card_intro TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS gift_card_accepted_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS gift_card_instructions TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS gift_card_closing TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_title TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_checkout_hint TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_instructions TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_account_name TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_sort_code TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS bank_account_number TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS crypto_title TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS crypto_subtitle TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS crypto_important_notice TEXT NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS crypto_expiry_minutes INTEGER NOT NULL DEFAULT 120;
      `);
    })().catch((err) => {
      globalForOrders.__momoOrdersSchemaPromise = undefined;
      throw err;
    });
  }
  await globalForOrders.__momoOrdersSchemaPromise;
}

type PaymentSettingsRow = {
  support_email: string;
  btc_address: string;
  eth_address: string;
  sol_address: string;
  usdt_address: string;
  order_received_subtitle: string;
  gift_card_title: string;
  gift_card_checkout_hint: string;
  gift_card_intro: string;
  gift_card_accepted_cards: unknown;
  gift_card_instructions: string;
  gift_card_closing: string;
  bank_title: string;
  bank_checkout_hint: string;
  bank_instructions: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  crypto_title: string;
  crypto_subtitle: string;
  crypto_important_notice: string;
  crypto_expiry_minutes: number | null;
};

function envPaymentFallback(): PaymentSettings {
  return {
    ...DEFAULT_PAYMENT_SETTINGS,
    supportEmail:
      process.env.PAYMENT_SUPPORT_EMAIL?.trim() ||
      DEFAULT_PAYMENT_SETTINGS.supportEmail,
    btcAddress:
      process.env.CRYPTO_BTC_ADDRESS?.trim() ||
      DEFAULT_PAYMENT_SETTINGS.btcAddress,
    ethAddress:
      process.env.CRYPTO_ETH_ADDRESS?.trim() ||
      DEFAULT_PAYMENT_SETTINGS.ethAddress,
    solAddress:
      process.env.CRYPTO_SOL_ADDRESS?.trim() ||
      DEFAULT_PAYMENT_SETTINGS.solAddress,
    usdtAddress:
      process.env.CRYPTO_USDT_ADDRESS?.trim() ||
      DEFAULT_PAYMENT_SETTINGS.usdtAddress,
  };
}

function normalizeAcceptedCards(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : null;
}

/** Reads payment settings & Order Received content from Neon Postgres with env/default fallbacks. */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  await ensureOrdersSchema();
  const db = getPool();
  const res = await db.query<PaymentSettingsRow>(
    `SELECT
       support_email,
       btc_address,
       eth_address,
       sol_address,
       usdt_address,
       order_received_subtitle,
       gift_card_title,
       gift_card_checkout_hint,
       gift_card_intro,
       gift_card_accepted_cards,
       gift_card_instructions,
       gift_card_closing,
       bank_title,
       bank_checkout_hint,
       bank_instructions,
       bank_account_name,
       bank_sort_code,
       bank_account_number,
       crypto_title,
       crypto_subtitle,
       crypto_important_notice,
       crypto_expiry_minutes
     FROM public.payment_settings
     WHERE id = 'default'`,
  );
  const row = res.rows[0];
  const fallback = envPaymentFallback();

  if (!row) return fallback;

  const acceptedCards = normalizeAcceptedCards(row.gift_card_accepted_cards);
  const expiry = Number(row.crypto_expiry_minutes);

  return {
    supportEmail: row.support_email?.trim() || fallback.supportEmail,
    orderReceivedSubtitle:
      row.order_received_subtitle?.trim() || fallback.orderReceivedSubtitle,
    giftCardTitle: row.gift_card_title?.trim() || fallback.giftCardTitle,
    giftCardCheckoutHint:
      row.gift_card_checkout_hint?.trim() || fallback.giftCardCheckoutHint,
    giftCardIntro: row.gift_card_intro?.trim() || fallback.giftCardIntro,
    giftCardAcceptedCards: acceptedCards ?? fallback.giftCardAcceptedCards,
    giftCardInstructions:
      row.gift_card_instructions?.trim() || fallback.giftCardInstructions,
    giftCardClosing: row.gift_card_closing?.trim() || fallback.giftCardClosing,
    bankTitle: row.bank_title?.trim() || fallback.bankTitle,
    bankCheckoutHint:
      row.bank_checkout_hint?.trim() || fallback.bankCheckoutHint,
    bankInstructions:
      row.bank_instructions?.trim() || fallback.bankInstructions,
    bankAccountName: row.bank_account_name?.trim() ?? "",
    bankSortCode: row.bank_sort_code?.trim() ?? "",
    bankAccountNumber: row.bank_account_number?.trim() ?? "",
    cryptoTitle: row.crypto_title?.trim() || fallback.cryptoTitle,
    cryptoSubtitle: row.crypto_subtitle?.trim() || fallback.cryptoSubtitle,
    cryptoImportantNotice:
      row.crypto_important_notice?.trim() || fallback.cryptoImportantNotice,
    cryptoExpiryMinutes:
      Number.isInteger(expiry) && expiry >= 15 && expiry <= 1440
        ? expiry
        : fallback.cryptoExpiryMinutes,
    btcAddress: row.btc_address?.trim() || fallback.btcAddress,
    ethAddress: row.eth_address?.trim() || fallback.ethAddress,
    solAddress: row.sol_address?.trim() || fallback.solAddress,
    usdtAddress: row.usdt_address?.trim() || fallback.usdtAddress,
  };
}

function cleanTextField(
  raw: unknown,
  label: string,
  { max = 500, required = false }: { max?: number; required?: boolean } = {},
): string | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") {
    throw new OrderDataError(400, `${label} must be a string.`);
  }
  const value = raw.trim();
  if (required && !value) {
    throw new OrderDataError(400, `${label} is required.`);
  }
  if (value.length > max) {
    throw new OrderDataError(
      400,
      `${label} must be at most ${max} characters.`,
    );
  }
  return value;
}

/** Validates and upserts admin payment settings and page copy in Neon Postgres. */
export async function updatePaymentSettings(
  input: Partial<PaymentSettings>,
): Promise<PaymentSettings> {
  await ensureOrdersSchema();
  const current = await getPaymentSettings();

  let supportEmail = current.supportEmail;
  if (input.supportEmail !== undefined) {
    if (typeof input.supportEmail !== "string") {
      throw new OrderDataError(400, "Support email must be a string.");
    }
    const trimmed = input.supportEmail.trim();
    if (!trimmed || trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
      throw new OrderDataError(400, "Please enter a valid support email.");
    }
    supportEmail = trimmed;
  }

  let giftCardAcceptedCards = current.giftCardAcceptedCards;
  if (input.giftCardAcceptedCards !== undefined) {
    if (!Array.isArray(input.giftCardAcceptedCards)) {
      throw new OrderDataError(
        400,
        "Accepted gift cards must be a list of card names.",
      );
    }
    const parsedCards = input.giftCardAcceptedCards
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.trim())
      .filter(Boolean);
    if (parsedCards.length === 0 || parsedCards.length > 20) {
      throw new OrderDataError(
        400,
        "Please include between 1 and 20 accepted gift card options.",
      );
    }
    if (parsedCards.some((c) => c.length > 160)) {
      throw new OrderDataError(
        400,
        "Each accepted gift card name must be at most 160 characters.",
      );
    }
    giftCardAcceptedCards = parsedCards;
  }

  let cryptoExpiryMinutes = current.cryptoExpiryMinutes;
  if (input.cryptoExpiryMinutes !== undefined) {
    const mins = Number(input.cryptoExpiryMinutes);
    if (!Number.isInteger(mins) || mins < 15 || mins > 1440) {
      throw new OrderDataError(
        400,
        "Crypto payment expiry must be a whole number between 15 and 1,440 minutes.",
      );
    }
    cryptoExpiryMinutes = mins;
  }

  const next: PaymentSettings = {
    supportEmail,
    orderReceivedSubtitle:
      cleanTextField(input.orderReceivedSubtitle, "Order received subtitle", {
        max: 300,
        required: true,
      }) ?? current.orderReceivedSubtitle,
    giftCardTitle:
      cleanTextField(input.giftCardTitle, "Gift card title", {
        max: 120,
        required: true,
      }) ?? current.giftCardTitle,
    giftCardCheckoutHint:
      cleanTextField(input.giftCardCheckoutHint, "Gift card checkout hint", {
        max: 400,
        required: true,
      }) ?? current.giftCardCheckoutHint,
    giftCardIntro:
      cleanTextField(input.giftCardIntro, "Gift card intro", {
        max: 500,
        required: true,
      }) ?? current.giftCardIntro,
    giftCardAcceptedCards,
    giftCardInstructions:
      cleanTextField(input.giftCardInstructions, "Gift card instructions", {
        max: 4000,
        required: true,
      }) ?? current.giftCardInstructions,
    giftCardClosing:
      cleanTextField(input.giftCardClosing, "Gift card closing", {
        max: 500,
        required: true,
      }) ?? current.giftCardClosing,
    bankTitle:
      cleanTextField(input.bankTitle, "Bank transfer title", {
        max: 120,
        required: true,
      }) ?? current.bankTitle,
    bankCheckoutHint:
      cleanTextField(input.bankCheckoutHint, "Bank transfer checkout hint", {
        max: 400,
        required: true,
      }) ?? current.bankCheckoutHint,
    bankInstructions:
      cleanTextField(input.bankInstructions, "Bank transfer instructions", {
        max: 4000,
        required: true,
      }) ?? current.bankInstructions,
    bankAccountName:
      cleanTextField(input.bankAccountName, "Bank account name", { max: 120 }) ??
      current.bankAccountName,
    bankSortCode:
      cleanTextField(input.bankSortCode, "Bank sort code", { max: 40 }) ??
      current.bankSortCode,
    bankAccountNumber:
      cleanTextField(input.bankAccountNumber, "Bank account number", {
        max: 40,
      }) ?? current.bankAccountNumber,
    cryptoTitle:
      cleanTextField(input.cryptoTitle, "Crypto payment title", {
        max: 120,
        required: true,
      }) ?? current.cryptoTitle,
    cryptoSubtitle:
      cleanTextField(input.cryptoSubtitle, "Crypto payment subtitle", {
        max: 300,
        required: true,
      }) ?? current.cryptoSubtitle,
    cryptoImportantNotice:
      cleanTextField(input.cryptoImportantNotice, "Crypto important notice", {
        max: 500,
        required: true,
      }) ?? current.cryptoImportantNotice,
    cryptoExpiryMinutes,
    btcAddress:
      cleanTextField(input.btcAddress, "Bitcoin address", { max: 160 }) ??
      current.btcAddress,
    ethAddress:
      cleanTextField(input.ethAddress, "Ethereum address", { max: 160 }) ??
      current.ethAddress,
    solAddress:
      cleanTextField(input.solAddress, "Solana address", { max: 160 }) ??
      current.solAddress,
    usdtAddress:
      cleanTextField(input.usdtAddress, "Tether address", { max: 160 }) ??
      current.usdtAddress,
  };

  const db = getPool();
  await db.query(
    `INSERT INTO public.payment_settings (
       id,
       support_email,
       btc_address,
       eth_address,
       sol_address,
       usdt_address,
       order_received_subtitle,
       gift_card_title,
       gift_card_checkout_hint,
       gift_card_intro,
       gift_card_accepted_cards,
       gift_card_instructions,
       gift_card_closing,
       bank_title,
       bank_checkout_hint,
       bank_instructions,
       bank_account_name,
       bank_sort_code,
       bank_account_number,
       crypto_title,
       crypto_subtitle,
       crypto_important_notice,
       crypto_expiry_minutes,
       updated_at
     )
     VALUES (
       'default',
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12,
       $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       support_email = EXCLUDED.support_email,
       btc_address = EXCLUDED.btc_address,
       eth_address = EXCLUDED.eth_address,
       sol_address = EXCLUDED.sol_address,
       usdt_address = EXCLUDED.usdt_address,
       order_received_subtitle = EXCLUDED.order_received_subtitle,
       gift_card_title = EXCLUDED.gift_card_title,
       gift_card_checkout_hint = EXCLUDED.gift_card_checkout_hint,
       gift_card_intro = EXCLUDED.gift_card_intro,
       gift_card_accepted_cards = EXCLUDED.gift_card_accepted_cards,
       gift_card_instructions = EXCLUDED.gift_card_instructions,
       gift_card_closing = EXCLUDED.gift_card_closing,
       bank_title = EXCLUDED.bank_title,
       bank_checkout_hint = EXCLUDED.bank_checkout_hint,
       bank_instructions = EXCLUDED.bank_instructions,
       bank_account_name = EXCLUDED.bank_account_name,
       bank_sort_code = EXCLUDED.bank_sort_code,
       bank_account_number = EXCLUDED.bank_account_number,
       crypto_title = EXCLUDED.crypto_title,
       crypto_subtitle = EXCLUDED.crypto_subtitle,
       crypto_important_notice = EXCLUDED.crypto_important_notice,
       crypto_expiry_minutes = EXCLUDED.crypto_expiry_minutes,
       updated_at = NOW()`,
    [
      next.supportEmail,
      next.btcAddress,
      next.ethAddress,
      next.solAddress,
      next.usdtAddress,
      next.orderReceivedSubtitle,
      next.giftCardTitle,
      next.giftCardCheckoutHint,
      next.giftCardIntro,
      JSON.stringify(next.giftCardAcceptedCards),
      next.giftCardInstructions,
      next.giftCardClosing,
      next.bankTitle,
      next.bankCheckoutHint,
      next.bankInstructions,
      next.bankAccountName,
      next.bankSortCode,
      next.bankAccountNumber,
      next.cryptoTitle,
      next.cryptoSubtitle,
      next.cryptoImportantNotice,
      next.cryptoExpiryMinutes,
    ],
  );

  return getPaymentSettings();
}

type OrderRow = {
  id: string | number;
  order_number: number;
  access_token: string;
  status: string;
  payment_method: string;
  shipping_method: string;
  shipping_label: string;
  email: string;
  phone: string;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  same_billing: boolean;
  items: OrderItem[];
  subtotal_pence: number;
  shipping_pence: number;
  total_pence: number;
  order_note: string;
  crypto_currency: string | null;
  crypto_amount: string | null;
  crypto_address: string | null;
  crypto_rate_gbp: string | number | null;
  crypto_expires_at: Date | string | null;
  attribution: OrderAttribution | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapOrderRow(row: OrderRow): OrderRecord {
  const subtotalPence = Number(row.subtotal_pence);
  const shippingPence = Number(row.shipping_pence);
  const totalPence = Number(row.total_pence);

  return {
    id: Number(row.id),
    orderNumber: Number(row.order_number),
    accessToken: row.access_token,
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    shippingMethod: row.shipping_method as ShippingMethodId,
    shippingLabel: row.shipping_label,
    email: row.email,
    phone: row.phone ?? "",
    shippingAddress: row.shipping_address,
    billingAddress: row.billing_address,
    sameBilling: Boolean(row.same_billing),
    items: Array.isArray(row.items) ? row.items : [],
    subtotalPence,
    shippingPence,
    totalPence,
    subtotal: Number((subtotalPence / 100).toFixed(2)),
    shipping: Number((shippingPence / 100).toFixed(2)),
    total: Number((totalPence / 100).toFixed(2)),
    orderNote: row.order_note ?? "",
    cryptoCurrency: row.crypto_currency
      ? (row.crypto_currency as CryptoCurrencyCode)
      : null,
    cryptoAmount: row.crypto_amount ?? null,
    cryptoAddress: row.crypto_address ?? null,
    cryptoRateGbp:
      row.crypto_rate_gbp !== null && row.crypto_rate_gbp !== undefined
        ? Number(row.crypto_rate_gbp)
        : null,
    cryptoExpiresAt: toIso(row.crypto_expires_at),
    attribution: row.attribution ?? null,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function validateAddress(raw: unknown, label: string): OrderAddress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OrderDataError(400, `${label} is required.`);
  }
  const obj = raw as Record<string, unknown>;
  const str = (k: string, max = 120) =>
    typeof obj[k] === "string" ? obj[k].trim().slice(0, max) : "";

  const country = str("country", 80) || "United Kingdom (UK)";
  const firstName = str("firstName", 80);
  const lastName = str("lastName", 80);
  const address = str("address", 180);
  const apartment = str("apartment", 120);
  const city = str("city", 100);
  const state = str("state", 100);
  const zip = str("zip", 24).toUpperCase();

  if (!firstName) {
    throw new OrderDataError(
      400,
      `Please enter a valid ${label.toLowerCase()} first name.`,
    );
  }
  if (!lastName) {
    throw new OrderDataError(
      400,
      `Please enter a valid ${label.toLowerCase()} last name.`,
    );
  }
  if (!address) {
    throw new OrderDataError(
      400,
      `Please enter a valid ${label.toLowerCase()} address.`,
    );
  }
  if (!city) {
    throw new OrderDataError(
      400,
      `Please enter a valid ${label.toLowerCase()} town or city.`,
    );
  }
  if (!state) {
    throw new OrderDataError(
      400,
      `Please select a ${label.toLowerCase()} county / region.`,
    );
  }
  if (!UK_POSTCODE_RE.test(zip)) {
    throw new OrderDataError(
      400,
      `Please enter a valid UK ${label.toLowerCase()} postcode.`,
    );
  }

  return {
    country,
    firstName,
    lastName,
    address,
    apartment,
    city,
    state,
    zip,
  };
}

function getCryptoAddress(
  settings: PaymentSettings,
  code: CryptoCurrencyCode,
): string {
  switch (code) {
    case "BTC":
      return settings.btcAddress;
    case "ETH":
      return settings.ethAddress;
    case "SOL":
      return settings.solAddress;
    case "USDT":
      return settings.usdtAddress;
  }
}

function sanitizeAttribution(raw: unknown): OrderAttribution | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const pick = (k: string) => {
    const v = typeof obj[k] === "string" ? obj[k].trim().slice(0, 240) : "";
    return v || undefined;
  };
  const out: OrderAttribution = {
    refSource: pick("refSource"),
    utmSource: pick("utmSource"),
    utmCampaign: pick("utmCampaign"),
    referrer: pick("referrer"),
    landingPath: pick("landingPath"),
  };
  return Object.values(out).some(Boolean) ? out : null;
}

type ProductLookupRow = {
  id: string;
  name: string;
  meta: string;
  price_pence: number;
  image: string;
  category_color: string | null;
};

/** Validates a checkout submission, computes totals server-side, and persists the order in Postgres. */
export async function createOrder(
  input: Record<string, unknown>,
): Promise<OrderRecord> {
  await ensureOrdersSchema();

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new OrderDataError(400, "Please enter a valid email address.");
  }

  const phone =
    typeof input.phone === "string" ? input.phone.trim().slice(0, 40) : "";
  const orderNote =
    typeof input.orderNote === "string"
      ? input.orderNote.trim().slice(0, 1000)
      : "";

  const sameBilling =
    input.sameBilling === undefined ? true : Boolean(input.sameBilling);
  const shippingAddress = validateAddress(
    input.shippingAddress,
    "Shipping address",
  );
  const billingAddress = sameBilling
    ? shippingAddress
    : validateAddress(input.billingAddress, "Billing address");

  const shippingMethodRaw =
    typeof input.shippingMethod === "string" ? input.shippingMethod.trim() : "";
  const shippingOpt = SHIPPING_OPTIONS.find((o) => o.id === shippingMethodRaw);
  if (!shippingOpt) {
    throw new OrderDataError(400, "Please select a valid shipping option.");
  }

  const paymentMethodRaw =
    typeof input.paymentMethod === "string" ? input.paymentMethod.trim() : "";
  const paymentOpt = PAYMENT_OPTIONS.find((o) => o.id === paymentMethodRaw);
  if (!paymentOpt) {
    throw new OrderDataError(400, "Please select a valid payment method.");
  }

  let cryptoCurrency: CryptoCurrencyCode | null = null;
  if (paymentOpt.id === "crypto") {
    const rawCurrency =
      typeof input.cryptoCurrency === "string" ? input.cryptoCurrency : "";
    cryptoCurrency = normalizeCryptoCode(rawCurrency);
    if (!cryptoCurrency) {
      throw new OrderDataError(400, "Please select a cryptocurrency.");
    }
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderDataError(400, "Your bag is empty.");
  }

  const requestedQtyById = new Map<string, number>();
  for (const entry of input.items) {
    if (!entry || typeof entry !== "object") {
      throw new OrderDataError(400, "Invalid item in order.");
    }
    const rec = entry as { id?: unknown; qty?: unknown };
    const id = typeof rec.id === "string" ? rec.id.trim() : "";
    const qty = typeof rec.qty === "number" ? rec.qty : Number(rec.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new OrderDataError(
        400,
        "Each order item must have a valid product ID and quantity (1–99).",
      );
    }
    const nextQty = Math.min(99, (requestedQtyById.get(id) ?? 0) + qty);
    requestedQtyById.set(id, nextQty);
  }

  const productIds = Array.from(requestedQtyById.keys());
  const db = getPool();
  const prodRes = await db.query<ProductLookupRow>(
    `SELECT
       p.id,
       p.name,
       p.meta,
       p.price_pence,
       p.image,
       c.color AS category_color
     FROM public.products p
     LEFT JOIN public.catalogs c ON c.slug = p.category_slug
     WHERE p.id = ANY($1::text[]) AND p.active = true`,
    [productIds],
  );

  const byId = new Map(prodRes.rows.map((r) => [r.id, r]));
  const items: OrderItem[] = [];
  let subtotalPence = 0;

  for (const [id, qty] of requestedQtyById.entries()) {
    const product = byId.get(id);
    if (!product) {
      throw new OrderDataError(
        400,
        `Product "${id}" is unavailable or no longer active.`,
      );
    }
    const unitPricePence = Number(product.price_pence);
    const lineTotalPence = unitPricePence * qty;
    subtotalPence += lineTotalPence;
    items.push({
      productId: product.id,
      name: product.name,
      meta: product.meta ?? "",
      image: product.image,
      categoryColor: product.category_color ?? "pink",
      unitPricePence,
      qty,
      lineTotalPence,
    });
  }

  const shippingPence =
    shippingOpt.id === "standard" &&
    subtotalPence >= FREE_SHIPPING_THRESHOLD * 100
      ? 0
      : shippingOpt.pricePence;
  const totalPence = subtotalPence + shippingPence;

  let cryptoAmount: string | null = null;
  let cryptoAddress: string | null = null;
  let cryptoRateGbp: number | null = null;
  let cryptoExpiresAt: string | null = null;

  if (paymentOpt.id === "crypto" && cryptoCurrency) {
    const [quote, settings] = await Promise.all([
      getCryptoQuote(cryptoCurrency, totalPence),
      getPaymentSettings(),
    ]);
    cryptoAmount = quote.amount;
    cryptoRateGbp = quote.rateGbp;
    cryptoAddress = getCryptoAddress(settings, cryptoCurrency);
    cryptoExpiresAt = new Date(
      Date.now() + settings.cryptoExpiryMinutes * 60 * 1000,
    ).toISOString();
  }

  const accessToken = crypto.randomBytes(16).toString("hex");
  const attribution = sanitizeAttribution(input.attribution);

  const insertRes = await db.query<OrderRow>(
    `INSERT INTO public.orders (
       access_token,
       status,
       payment_method,
       shipping_method,
       shipping_label,
       email,
       phone,
       shipping_address,
       billing_address,
       same_billing,
       items,
       subtotal_pence,
       shipping_pence,
       total_pence,
       order_note,
       crypto_currency,
       crypto_amount,
       crypto_address,
       crypto_rate_gbp,
       crypto_expires_at,
       attribution
     )
     VALUES (
       $1, 'pending_payment', $2, $3, $4, $5, $6,
       $7::jsonb, $8::jsonb, $9, $10::jsonb, $11, $12, $13, $14,
       $15, $16, $17, $18, $19, $20::jsonb
     )
     RETURNING *`,
    [
      accessToken,
      paymentOpt.id,
      shippingOpt.id,
      shippingOpt.label,
      email,
      phone,
      JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress),
      sameBilling,
      JSON.stringify(items),
      subtotalPence,
      shippingPence,
      totalPence,
      orderNote,
      cryptoCurrency,
      cryptoAmount,
      cryptoAddress,
      cryptoRateGbp,
      cryptoExpiresAt,
      attribution ? JSON.stringify(attribution) : null,
    ],
  );

  return mapOrderRow(insertRes.rows[0]);
}

/** Fetches a single order by its 32-character access token. */
export async function getOrderByToken(
  token: string,
): Promise<OrderRecord | null> {
  if (!TOKEN_RE.test(token)) return null;
  await ensureOrdersSchema();
  const db = getPool();
  const res = await db.query<OrderRow>(
    `SELECT * FROM public.orders WHERE access_token = $1`,
    [token],
  );
  return res.rows[0] ? mapOrderRow(res.rows[0]) : null;
}

/** Transitions a pending order to payment_submitted or cancelled by access token. */
export async function updateOrderStatusByToken(
  token: string,
  action: "cancel" | "confirm_sent",
): Promise<OrderRecord> {
  if (!TOKEN_RE.test(token)) {
    throw new OrderDataError(404, "Order not found.");
  }
  await ensureOrdersSchema();
  const db = getPool();

  const existing = await db.query<OrderRow>(
    `SELECT * FROM public.orders WHERE access_token = $1`,
    [token],
  );
  const row = existing.rows[0];
  if (!row) {
    throw new OrderDataError(404, "Order not found.");
  }

  if (row.status !== "pending_payment") {
    throw new OrderDataError(
      409,
      "Order status cannot be updated from its current state.",
    );
  }

  const nextStatus: OrderStatus =
    action === "cancel" ? "cancelled" : "payment_submitted";

  const updated = await db.query<OrderRow>(
    `UPDATE public.orders
     SET status = $2, updated_at = NOW()
     WHERE access_token = $1
     RETURNING *`,
    [token, nextStatus],
  );

  return mapOrderRow(updated.rows[0]);
}

/** Lists orders for the admin dashboard with optional status, payment method, and search filters. */
export async function listAdminOrders(filters?: {
  status?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
}): Promise<OrderRecord[]> {
  await ensureOrdersSchema();
  const db = getPool();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (
    filters?.status &&
    VALID_ORDER_STATUSES.has(filters.status as OrderStatus)
  ) {
    params.push(filters.status);
    clauses.push(`status = $${params.length}`);
  }

  if (
    filters?.paymentMethod &&
    VALID_PAYMENT_METHODS.has(filters.paymentMethod as PaymentMethod)
  ) {
    params.push(filters.paymentMethod);
    clauses.push(`payment_method = $${params.length}`);
  }

  if (filters?.search && filters.search.trim()) {
    const clean = filters.search.trim().replace(/^#/, "");
    params.push(`%${clean}%`);
    const p = `$${params.length}`;
    clauses.push(
      `(order_number::text ILIKE ${p} OR email ILIKE ${p} OR shipping_address->>'firstName' ILIKE ${p} OR shipping_address->>'lastName' ILIKE ${p} OR shipping_address->>'zip' ILIKE ${p})`,
    );
  }

  const limit = Math.max(1, Math.min(500, Math.trunc(filters?.limit ?? 200)));
  params.push(limit);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const res = await db.query<OrderRow>(
    `SELECT * FROM public.orders
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return res.rows.map(mapOrderRow);
}

/** Aggregates order counts and revenue metrics for the admin dashboard. */
export async function getAdminOrderStats(): Promise<AdminOrderStats> {
  await ensureOrdersSchema();
  const db = getPool();
  const res = await db.query<{
    total_orders: number;
    pending_count: number;
    submitted_count: number;
    paid_count: number;
    cancelled_count: number;
    paid_revenue_pence: string | number;
    pending_revenue_pence: string | number;
    crypto_count: number;
    gift_card_count: number;
    bank_count: number;
  }>(`
    SELECT
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::int AS pending_count,
      COUNT(*) FILTER (WHERE status = 'payment_submitted')::int AS submitted_count,
      COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
      COALESCE(SUM(total_pence) FILTER (WHERE status = 'paid'), 0)::bigint AS paid_revenue_pence,
      COALESCE(SUM(total_pence) FILTER (WHERE status IN ('pending_payment', 'payment_submitted')), 0)::bigint AS pending_revenue_pence,
      COUNT(*) FILTER (WHERE payment_method = 'crypto')::int AS crypto_count,
      COUNT(*) FILTER (WHERE payment_method = 'gift-card')::int AS gift_card_count,
      COUNT(*) FILTER (WHERE payment_method = 'bank')::int AS bank_count
    FROM public.orders
  `);

  const row = res.rows[0];
  return {
    totalOrders: Number(row?.total_orders ?? 0),
    pendingCount: Number(row?.pending_count ?? 0),
    submittedCount: Number(row?.submitted_count ?? 0),
    paidCount: Number(row?.paid_count ?? 0),
    cancelledCount: Number(row?.cancelled_count ?? 0),
    paidRevenuePence: Number(row?.paid_revenue_pence ?? 0),
    pendingRevenuePence: Number(row?.pending_revenue_pence ?? 0),
    byMethod: {
      crypto: Number(row?.crypto_count ?? 0),
      "gift-card": Number(row?.gift_card_count ?? 0),
      bank: Number(row?.bank_count ?? 0),
    },
  };
}

/** Updates an order's status from the admin dashboard. */
export async function adminUpdateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<OrderRecord> {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new OrderDataError(400, "Invalid order ID.");
  }
  if (!VALID_ORDER_STATUSES.has(status)) {
    throw new OrderDataError(400, "Invalid order status.");
  }
  await ensureOrdersSchema();
  const db = getPool();

  const res = await db.query<OrderRow>(
    `UPDATE public.orders
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId, status],
  );
  if (!res.rows[0]) {
    throw new OrderDataError(404, "Order not found.");
  }
  return mapOrderRow(res.rows[0]);
}
