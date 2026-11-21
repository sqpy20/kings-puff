import type { Metadata } from "next";
import {
  type Category,
  FREE_SHIPPING_THRESHOLD,
  type Product,
} from "./catalog";

export const SITE_NAME = "Momo Eliquid";
export const SITE_TAGLINE = "UK E-Liquids, Gummies & Small-Batch Kush";
export const SITE_DESCRIPTION =
  "Shop UK-made Momo Eliquid shortfills, nic salts, ExPod Pro pods, clearly dosed THC gummies, and small-batch Kush. Order before 2PM for same-day UK dispatch.";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://momoeliquid.co.uk"
).replace(/\/$/, "");
export const SITE_LOCALE = "en_GB";
export const SITE_TWITTER = "@momoeliquid";
export const SOCIAL_PROFILES = [
  "https://instagram.com/momoeliquid",
  "https://x.com/momoeliquid",
];

export function absoluteUrl(path: string): string {
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
}: {
  title?: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
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
    alternates: { canonical: path },
    openGraph: {
      title: resolvedTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      site: SITE_TWITTER,
      ...(ogImages ? { images: ogImages } : {}),
    },
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
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.jpg"),
    sameAs: SOCIAL_PROFILES,
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
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.id,
    description: product.description,
    image: [absoluteUrl(product.image)],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category,
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
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
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
