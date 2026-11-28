import {
  type Category,
  FREE_SHIPPING_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  MIN_ORDER_AMOUNT,
  type Product,
  formatPrice,
} from "./catalog";
import { faqs } from "./faqs";
import { guides } from "./guides";
import {
  CRYPTO_CURRENCY_LIST,
  DEFAULT_PAYMENT_SETTINGS,
  SHIPPING_OPTIONS,
} from "./payment";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
} from "./seo";

export const LLMS_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
} as const;

type ProductGroup = {
  category: Category | null;
  title: string;
  items: Product[];
};

/** Collapses internal whitespace and newlines into single spaces. */
function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Formats live stock quantity into a clear availability status label. */
function stockLabel(stockQty: number): string {
  if (stockQty <= 0) return "Out of stock";
  if (stockQty <= LOW_STOCK_THRESHOLD) return "Limited stock";
  return "In stock";
}

/** Computes a formatted GBP min-max price range across products. */
function priceRangeLabel(products: readonly Product[]): string {
  if (products.length === 0) return "N/A";
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const product of products) {
    if (product.price < min) min = product.price;
    if (product.price > max) max = product.price;
  }
  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)}–${formatPrice(max)}`;
}

/** Groups products under ordered categories plus any unmatched items. */
function groupProductsByCategory(
  categories: readonly Category[],
  products: readonly Product[],
): ProductGroup[] {
  const groups: ProductGroup[] = [];
  const knownSlugs = new Set(categories.map((c) => c.slug));

  for (const category of categories) {
    const items = products.filter((p) => p.category === category.slug);
    if (items.length > 0) {
      groups.push({ category, title: category.label, items });
    }
  }

  const uncategorized = products.filter((p) => !knownSlugs.has(p.category));
  if (uncategorized.length > 0) {
    groups.push({
      category: null,
      title: "Additional Products",
      items: uncategorized,
    });
  }

  return groups;
}

/** Builds a human-readable UK shipping summary string from SHIPPING_OPTIONS. */
function shippingSummaryLine(): string {
  const tiers = SHIPPING_OPTIONS.map((opt) =>
    opt.id === "standard"
      ? `${opt.label}: ${formatPrice(opt.price)} (Free over ${formatPrice(FREE_SHIPPING_THRESHOLD)})`
      : `${opt.label}: ${formatPrice(opt.price)}`,
  );
  return `Ships across England, Scotland, Wales, and Northern Ireland. Orders placed before 2:00 PM Mon–Fri dispatch same working day. ${tiers.join("; ")}.`;
}

/** Builds the concise, llmstxt.org-compliant `/llms.txt` Markdown index. */
export function buildLlmsTxt(
  categories: readonly Category[],
  products: readonly Product[],
): string {
  const cryptoCodes = CRYPTO_CURRENCY_LIST.map((c) => c.code).join(", ");
  const groups = groupProductsByCategory(categories, products);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `- Storefront URL: ${SITE_URL} (locale: en-GB, currency: GBP)`,
    `- Catalog Summary: ${products.length} active products across ${categories.length} collections (${priceRangeLabel(products)})`,
    `- Minimum Order: ${formatPrice(MIN_ORDER_AMOUNT)} minimum product subtotal required to place an order`,
    "- Age Policy: Strictly 18+ UK adult customers; age confirmed at checkout and valid photo ID may be required upon delivery",
    `- UK Delivery & Dispatch: ${shippingSummaryLine()}`,
    `- Accepted Payment Methods: Cryptocurrency (${cryptoCodes}), Gift Cards (Steam & Apple), and Direct UK Bank Transfer`,
    `- Returns & Support: 14-day return window for unopened sealed items; support email ${DEFAULT_PAYMENT_SETTINGS.supportEmail}`,
    `- Full Single-File Knowledge Base: ${absoluteUrl("/llms-full.txt")}`,
    "",
    "## Core Pages",
    `- [Home](${absoluteUrl("/")}): Main UK storefront featuring collections, seasonal releases, and brand story.`,
    `- [All Products](${absoluteUrl("/shop")}): Full filterable UK catalogue across e-liquids, gummies, and small-batch Kush.`,
    `- [UK Buyer Guides](${absoluteUrl("/guides")}): In-depth guides on shortfills vs nic salts, prefilled pods, edible dosing, and Kush cultivars.`,
    `- [About & Quality](${absoluteUrl("/about")}): UK manufacturing standards, clear batch labelling, and brand background.`,
    `- [FAQ & Shipping](${absoluteUrl("/faq")}): Answers on 18+ verification, UK delivery times, batch testing, and 14-day returns.`,
    `- [Press & Partners](${absoluteUrl("/press")}): Official logos, verified product directory, and partner link snippets.`,
    "",
    "## Collections",
    ...categories.map((c) => {
      const count = products.filter((p) => p.category === c.slug).length;
      return `- [${c.label}](${absoluteUrl(`/shop/${c.slug}`)}): ${singleLine(c.description)} (${count} products)`;
    }),
    "",
    "## UK Buyer Guides",
    ...guides.map(
      (g) =>
        `- [${g.title}](${absoluteUrl(`/guides/${g.slug}`)}): ${singleLine(g.description)}`,
    ),
  ];

  for (const group of groups) {
    lines.push("", `## ${group.title}`);
    for (const p of group.items) {
      const metaPart = p.meta ? ` · ${singleLine(p.meta)}` : "";
      lines.push(
        `- [${p.name}](${absoluteUrl(`/products/${p.id}`)}): ${formatPrice(p.price)} · ${stockLabel(p.stockQty)}${metaPart}`,
      );
    }
  }

  lines.push(
    "",
    "## Optional",
    `- [Full Storefront Knowledge Base (llms-full.txt)](${absoluteUrl("/llms-full.txt")}): Complete single-file Markdown reference with full product descriptions, specs, buyer guides, and FAQs.`,
    `- [XML Sitemap](${absoluteUrl("/sitemap.xml")}): Machine-readable index of all public pages, collections, products, and guides.`,
    `- [Press & Partners](${absoluteUrl("/press")}): Official brand assets, logos, and verified catalog directory.`,
  );

  return lines.join("\n");
}

/** Builds the complete `/llms-full.txt` Markdown storefront knowledge base. */
export function buildLlmsFullTxt(
  categories: readonly Category[],
  products: readonly Product[],
): string {
  const groups = groupProductsByCategory(categories, products);
  const cryptoLabels = CRYPTO_CURRENCY_LIST.map((c) => c.label).join(", ");
  const giftCards = DEFAULT_PAYMENT_SETTINGS.giftCardAcceptedCards.join(", ");

  const lines: string[] = [
    `# ${SITE_NAME} — Complete Storefront Knowledge Base`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Store Overview & Policies",
    "",
    `- **Brand Name**: ${SITE_NAME}`,
    `- **Tagline**: ${SITE_TAGLINE}`,
    `- **Storefront URL**: ${SITE_URL}`,
    "- **Locale & Currency**: English (United Kingdom, `en-GB`), Pounds Sterling (`GBP`)",
    "- **Delivery Region**: United Kingdom (England, Scotland, Wales, and Northern Ireland)",
    `- **Social Profiles**: ${SOCIAL_PROFILES.join(", ")}`,
    `- **Customer Support**: ${DEFAULT_PAYMENT_SETTINGS.supportEmail}`,
    `- **Age & Ordering Policy**: Strictly 18+ adults only. Age is confirmed at checkout and valid photo ID may be required upon delivery. Minimum product subtotal of ${formatPrice(MIN_ORDER_AMOUNT)} applies before checkout.`,
    `- **Shipping & Dispatch**: ${shippingSummaryLine()}`,
    `- **Accepted Payment Methods**: Cryptocurrency (${cryptoLabels}), Gift Cards (${giftCards}), and Direct UK Bank Transfer.`,
    "- **Returns & Quality**: Unopened, sealed items in original packaging may be returned within 14 days of delivery. Every blend and infused product carries batch labelling for clear ingredients and potency.",
    "",
    "## Collections & Full Product Catalog",
  ];

  for (const group of groups) {
    lines.push("", `### ${group.title}`);
    if (group.category) {
      lines.push(
        `- **Collection URL**: ${absoluteUrl(`/shop/${group.category.slug}`)}`,
        `- **Description**: ${singleLine(group.category.description)}`,
        `- **Active Products**: ${group.items.length}`,
      );
    } else {
      lines.push(`- **Active Products**: ${group.items.length}`);
    }

    for (const p of group.items) {
      lines.push(
        "",
        `#### ${p.name}`,
        `- **URL**: ${absoluteUrl(`/products/${p.id}`)}`,
        `- **Category**: ${p.categoryLabel ?? group.title} (\`${p.category}\`)`,
        `- **Price**: ${formatPrice(p.price)}`,
        `- **Availability**: ${stockLabel(p.stockQty)}`,
      );
      if (p.meta) {
        lines.push(`- **Summary**: ${singleLine(p.meta)}`);
      }
      if (p.badge) {
        lines.push(`- **Badge**: ${p.badge}`);
      }
      lines.push(`- **Image**: ${absoluteUrl(p.image)}`);
      if (p.description) {
        lines.push("", singleLine(p.description));
      }
      if (p.details.length > 0) {
        lines.push("", "**Specifications:**");
        for (const detail of p.details) {
          lines.push(`- ${detail.label}: ${detail.value}`);
        }
      }
    }
  }

  lines.push("", "## UK Buyer Guides");
  for (const guide of guides) {
    const relatedLinks = guide.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .map((p) => `[${p.name}](${absoluteUrl(`/products/${p.id}`)})`);

    lines.push(
      "",
      `### ${guide.title}`,
      `- **URL**: ${absoluteUrl(`/guides/${guide.slug}`)}`,
      `- **Reading Time**: ${guide.readingTime}`,
      `- **Updated**: ${guide.updatedAt.slice(0, 10)}`,
      `- **Summary**: ${singleLine(guide.description)}`,
    );
    if (relatedLinks.length > 0) {
      lines.push(`- **Featured Products**: ${relatedLinks.join(", ")}`);
    }

    for (const section of guide.sections) {
      lines.push("", `#### ${section.heading}`);
      for (const paragraph of section.paragraphs) {
        lines.push("", singleLine(paragraph));
      }
      if (section.bullets && section.bullets.length > 0) {
        lines.push("");
        for (const bullet of section.bullets) {
          lines.push(`- ${singleLine(bullet)}`);
        }
      }
    }

    if (guide.faqs.length > 0) {
      lines.push("", "#### Guide FAQs");
      for (const faq of guide.faqs) {
        lines.push("", `**Q:** ${faq.q}`, `**A:** ${faq.a}`);
      }
    }
  }

  lines.push("", "## Frequently Asked Questions");
  for (const item of faqs) {
    lines.push("", `### ${item.q}`, "", item.a);
  }

  return lines.join("\n");
}
