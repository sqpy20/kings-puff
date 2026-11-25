import type { Metadata } from "next";
import {
  type Category,
  FREE_SHIPPING_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  type Product,
} from "./catalog";
import { BRAND_LOGO_URL } from "./media";

export const SITE_NAME = "Momo Eliquid";
export const SITE_TAGLINE = "UK E-Liquids, Gummies & Small-Batch Kush";
export const SITE_DESCRIPTION =
  "Shop UK-made Momo Eliquid shortfills, nic salts, ExPod Pro pods, clearly dosed THC gummies, and small-batch Kush. Order before 2PM for same-day UK dispatch.";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://momoeliquidz.co.uk"
).replace(/\/$/, "");
export const SITE_LOCALE = "en_GB";
export const SITE_TWITTER = "@momoeliquid";
export const SOCIAL_PROFILES = [
  "https://instagram.com/momoeliquid",
  "https://x.com/momoeliquid",
];

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildBacklinkSnippets({
  path,
  anchorText,
  ref,
  utmSource,
}: {
  path: string;
  anchorText: string;
  ref?: string;
  utmSource?: string;
}) {
  const base = absoluteUrl(path);
  const params = new URLSearchParams();
  const cleanRef = ref?.trim();
  const cleanUtm = utmSource?.trim();
  if (cleanRef) params.set("ref", cleanRef);
  if (cleanUtm) params.set("utm_source", cleanUtm);
  const query = params.toString();
  const url = query ? `${base}?${query}` : base;

  return {
    url,
    html: `<a href="${escapeHtml(url)}">${escapeHtml(anchorText)}</a>`,
    markdown: `[${anchorText}](${url})`,
  };
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  image,
  imageAlt,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  other,
}: {
  title?: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  other?: Record<string, string>;
}): Metadata {
  const resolvedTitle = title
    ? `${title} · ${SITE_NAME}`
    : `${SITE_NAME} · ${SITE_TAGLINE}`;
  const ogImages = image
    ? [
        {
          url: absoluteUrl(image),
          alt: imageAlt ?? resolvedTitle,
        },
      ]
    : undefined;

  return {
    ...(title ? { title } : {}),
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: path,
      languages: {
        "en-GB": path,
        "x-default": path,
      },
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      site: SITE_TWITTER,
      ...(ogImages ? { images: ogImages } : {}),
    },
    ...(other ? { other } : {}),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: BRAND_LOGO_URL,
    },
    description: SITE_DESCRIPTION,
    sameAs: SOCIAL_PROFILES,
    areaServed: {
      "@type": "Country",
      name: "United Kingdom",
    },
    currenciesAccepted: "GBP",
    priceRange: "£4.99 - £60.00",
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "GB",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "GB",
      availableLanguage: "English",
    },
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-GB",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: Product): Record<string, unknown> {
  const url = absoluteUrl(`/products/${product.id}`);
  const availability =
    product.stockQty <= 0
      ? "https://schema.org/OutOfStock"
      : product.stockQty <= LOW_STOCK_THRESHOLD
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.id,
    mpn: product.id,
    url,
    mainEntityOfPage: url,
    description: product.description,
    image: [absoluteUrl(product.image)],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.categoryLabel ?? product.category,
    additionalProperty: product.details.map((d) => ({
      "@type": "PropertyValue",
      name: d.label,
      value: d.value,
    })),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      priceValidUntil: "2027-12-31",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "GB",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.price >= FREE_SHIPPING_THRESHOLD ? "0.00" : "3.99",
          currency: "GBP",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
        },
      },
    },
  };
}

export function collectionJsonLd(
  list: Product[],
  category?: Category,
): Record<string, unknown> {
  const path = category ? `/shop/${category.slug}` : "/shop";
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category ? `${category.label} · ${SITE_NAME}` : `Products · ${SITE_NAME}`,
    description: category?.description ?? SITE_DESCRIPTION,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/products/${p.id}`),
        name: p.name,
        image: absoluteUrl(p.image),
      })),
    },
  };
}

export function faqJsonLd(
  items: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
  image,
  datePublished,
  dateModified,
  keywords,
}: {
  headline: string;
  description: string;
  path: string;
  image: string;
  datePublished: string;
  dateModified: string;
  keywords?: string[];
}): Record<string, unknown> {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    description,
    url,
    mainEntityOfPage: url,
    image: [absoluteUrl(image)],
    datePublished,
    dateModified,
    inLanguage: "en-GB",
    ...(keywords && keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: BRAND_LOGO_URL,
      },
    },
  };
}
