import "server-only";
import { CRYPTO_CURRENCIES, type CryptoCurrencyCode } from "./payment";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedRates = {
  fetchedAt: number;
  rates: Partial<Record<CryptoCurrencyCode, number>>;
};

const globalForCryptoRates = globalThis as typeof globalThis & {
  __momoCryptoRates?: CachedRates;
};

async function fetchLiveRates(): Promise<
  Partial<Record<CryptoCurrencyCode, number>> | null
> {
  const ids = Object.values(CRYPTO_CURRENCIES)
    .map((c) => c.coinGeckoId)
    .join(",");

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=gbp`,
      {
        signal: AbortSignal.timeout(4000),
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, { gbp?: unknown }>;
    const rates: Partial<Record<CryptoCurrencyCode, number>> = {};

    for (const currency of Object.values(CRYPTO_CURRENCIES)) {
      const value = json?.[currency.coinGeckoId]?.gbp;
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        rates[currency.code] = value;
      }
    }

    return Object.keys(rates).length > 0 ? rates : null;
  } catch {
    return null;
  }
}

/** Quotes a GBP order total in the chosen cryptocurrency with live CoinGecko rates and safe fallbacks. */
export async function getCryptoQuote(
  code: CryptoCurrencyCode,
  totalPence: number,
): Promise<{
  rateGbp: number;
  amount: string;
  source: "live" | "fallback";
}> {
  const meta = CRYPTO_CURRENCIES[code];
  const now = Date.now();
  const cached = globalForCryptoRates.__momoCryptoRates;

  let rateGbp: number | undefined;
  let source: "live" | "fallback" = "fallback";

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS && cached.rates[code]) {
    rateGbp = cached.rates[code];
    source = "live";
  } else {
    const live = await fetchLiveRates();
    if (live) {
      globalForCryptoRates.__momoCryptoRates = {
        fetchedAt: now,
        rates: live,
      };
      if (live[code]) {
        rateGbp = live[code];
        source = "live";
      }
    }
  }

  if (!rateGbp || !Number.isFinite(rateGbp) || rateGbp <= 0) {
    rateGbp = meta.fallbackGbpRate;
    source = "fallback";
  }

  const totalGbp = totalPence / 100;
  const rawAmount = totalGbp / rateGbp;
  const formatted = rawAmount.toFixed(meta.decimals);

  return {
    rateGbp,
    amount: formatted,
    source,
  };
}
