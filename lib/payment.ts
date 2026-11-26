export const SHIPPING_OPTIONS = [
  {
    id: "express" as const,
    label: "Express delivery (1–2 working days)",
    price: 5.99,
    pricePence: 599,
  },
  {
    id: "standard" as const,
    label: "Standard delivery (3–5 working days)",
    price: 3.99,
    pricePence: 399,
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_OPTIONS)[number]["id"];

export const PAYMENT_OPTIONS = [
  { id: "crypto" as const, label: "Cryptocurrency" },
  { id: "gift-card" as const, label: "Pay with gift cards" },
  { id: "bank" as const, label: "Direct bank transfer" },
] as const;

export type PaymentMethod = (typeof PAYMENT_OPTIONS)[number]["id"];

export const CRYPTO_CURRENCIES = {
  BTC: {
    code: "BTC",
    label: "Bitcoin (BTC)",
    name: "Bitcoin",
    ticker: "BTC",
    coinGeckoId: "bitcoin",
    decimals: 7,
    fallbackGbpRate: 54000,
  },
  ETH: {
    code: "ETH",
    label: "Ethereum (ETH)",
    name: "Ethereum",
    ticker: "ETH",
    coinGeckoId: "ethereum",
    decimals: 6,
    fallbackGbpRate: 2100,
  },
  SOL: {
    code: "SOL",
    label: "Solana (SOL)",
    name: "Solana",
    ticker: "SOL",
    coinGeckoId: "solana",
    decimals: 4,
    fallbackGbpRate: 120,
  },
  USDT: {
    code: "USDT",
    label: "Tether (USDT)",
    name: "Tether",
    ticker: "USDT",
    coinGeckoId: "tether",
    decimals: 2,
    fallbackGbpRate: 0.79,
  },
} as const;

export type CryptoCurrencyCode = keyof typeof CRYPTO_CURRENCIES;

export const CRYPTO_CURRENCY_LIST = Object.values(CRYPTO_CURRENCIES);

export type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "paid"
  | "cancelled";

export const ORDER_STATUS_OPTIONS: {
  id: OrderStatus;
  label: string;
}[] = [
  { id: "pending_payment", label: "Awaiting payment" },
  { id: "payment_submitted", label: "Payment submitted" },
  { id: "paid", label: "Paid" },
  { id: "cancelled", label: "Cancelled" },
];

export type OrderItem = {
  productId: string;
  name: string;
  meta: string;
  image: string;
  categoryColor: string;
  unitPricePence: number;
  qty: number;
  lineTotalPence: number;
};

export type OrderAddress = {
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
};

export type OrderAttribution = {
  refSource?: string;
  utmSource?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPath?: string;
};

export type OrderRecord = {
  id: number;
  orderNumber: number;
  accessToken: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethodId;
  shippingLabel: string;
  email: string;
  phone: string;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  sameBilling: boolean;
  items: OrderItem[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  subtotal: number;
  shipping: number;
  total: number;
  orderNote: string;
  cryptoCurrency: CryptoCurrencyCode | null;
  cryptoAmount: string | null;
  cryptoAddress: string | null;
  cryptoRateGbp: number | null;
  cryptoExpiresAt: string | null;
  attribution: OrderAttribution | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderStats = {
  totalOrders: number;
  pendingCount: number;
  submittedCount: number;
  paidCount: number;
  cancelledCount: number;
  paidRevenuePence: number;
  pendingRevenuePence: number;
  byMethod: Record<PaymentMethod, number>;
};

export type AdminNotification = {
  id: number;
  orderId: number | null;
  orderNumber: number;
  type: "new_order" | "payment_submitted";
  title: string;
  message: string;
  totalPence: number;
  total: number;
  paymentMethod: string;
  read: boolean;
  createdAt: string;
};

export type PaymentSettings = {
  supportEmail: string;
  orderReceivedSubtitle: string;
  giftCardTitle: string;
  giftCardCheckoutHint: string;
  giftCardIntro: string;
  giftCardAcceptedCards: string[];
  giftCardInstructions: string;
  giftCardClosing: string;
  bankTitle: string;
  bankCheckoutHint: string;
  bankInstructions: string;
  bankAccountName: string;
  bankSortCode: string;
  bankAccountNumber: string;
  cryptoTitle: string;
  cryptoSubtitle: string;
  cryptoImportantNotice: string;
  cryptoExpiryMinutes: number;
  btcAddress: string;
  ethAddress: string;
  solAddress: string;
  usdtAddress: string;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  supportEmail: "support@momoeliquidz.co.uk",
  orderReceivedSubtitle: "Thank you. Your order has been received.",
  giftCardTitle: "Pay with gift cards",
  giftCardCheckoutHint:
    "Purchase a Steam or Apple Gift Card and email clear photos of the card and receipt after placing your order.",
  giftCardIntro:
    "To pay with a gift card, simply purchase any of the gift cards which we accept:",
  giftCardAcceptedCards: [
    "Steam Gift Card",
    "Apple Gift Card (The gift card for everything Apple)",
  ],
  giftCardInstructions: [
    "and scratch the code.",
    "When done, send us clear pictures of the card (front and back) showing the scratch codes on the card, not forgetting the receipt which was given on purchase of the gift card, to our company email below.",
    "If the card balance is sufficient to cover the total purchase amount, the transaction will be approved.",
    "If you have any questions or concerns about using gift cards as a payment option, please don't hesitate to contact us.",
  ].join("\n\n"),
  giftCardClosing: "Thank you for choosing Momo Eliquid for your purchases.\nBest regards.",
  bankTitle: "Direct bank transfer",
  bankCheckoutHint:
    "Place your order to receive our UK bank transfer details by email shortly after confirmation.",
  bankInstructions:
    "Account details will be emailed shortly. If you don't receive them, please contact us via our contact page or email us below.",
  bankAccountName: "",
  bankSortCode: "",
  bankAccountNumber: "",
  cryptoTitle: "Complete your payment",
  cryptoSubtitle:
    "Please send the exact amount of {TICKER} to the address below.",
  cryptoImportantNotice:
    "Send the exact amount shown to help ensure the payment is detected automatically.",
  cryptoExpiryMinutes: 120,
  btcAddress: "bc1qey3v543dhpxwjcetwzsyhjptpmdz0x6epsd274",
  ethAddress: "0x0000000000000000000000000000000000000000",
  solAddress: "11111111111111111111111111111111",
  usdtAddress: "0x0000000000000000000000000000000000000000",
};

/** Normalizes a currency code or label (e.g. "Bitcoin (BTC)" or "btc") to a CryptoCurrencyCode. */
export function normalizeCryptoCode(input: string): CryptoCurrencyCode | null {
  const raw = input.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper in CRYPTO_CURRENCIES) {
    return upper as CryptoCurrencyCode;
  }
  const match = CRYPTO_CURRENCY_LIST.find(
    (c) =>
      c.label.toUpperCase() === upper ||
      c.name.toUpperCase() === upper ||
      upper.includes(`(${c.code})`),
  );
  return match ? match.code : null;
}

/** Returns the human-readable payment method label. */
export function getPaymentLabel(method: PaymentMethod): string {
  return PAYMENT_OPTIONS.find((o) => o.id === method)?.label ?? method;
}

/** Builds a wallet deep-link URI for QR scanning and one-click wallet launch. */
export function buildCryptoPaymentUri(
  code: CryptoCurrencyCode,
  address: string,
  amount: string,
): string {
  const cleanAddress = address.trim();
  const cleanAmount = amount.trim();
  switch (code) {
    case "BTC":
      return `bitcoin:${cleanAddress}?amount=${encodeURIComponent(cleanAmount)}`;
    case "SOL":
      return `solana:${cleanAddress}?amount=${encodeURIComponent(cleanAmount)}`;
    case "ETH":
    case "USDT":
      return `ethereum:${cleanAddress}`;
  }
}

/** Formats an ISO date string into "November 25, 2026". */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}
