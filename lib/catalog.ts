import type { ColorName } from "@/components/illustrations";

export type CategorySlug = string;

export const VALID_COLORS: readonly ColorName[] = [
  "purple",
  "pink",
  "lime",
  "orange",
  "teal",
  "ink",
  "cream",
];

export const BADGES = [
  "New arrival",
  "Featured",
  "Limited stock",
  "Available",
] as const;

export type Badge = (typeof BADGES)[number];

export type Category = {
  slug: string;
  /** Full name, used for headings and links. */
  label: string;
  /** Short name, used on the filter pills. */
  short: string;
  description: string;
  color: ColorName;
  sortOrder: number;
  productCount?: number;
};

export type ProductDetailItem = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  category: CategorySlug;
  meta: string;
  description: string;
  details: ProductDetailItem[];
  price: number;
  stockQty: number;
  image: string;
  badge?: Badge;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  categoryColor?: ColorName;
  categoryLabel?: string;
};

export const FREE_SHIPPING_THRESHOLD = 50;
export const LOW_STOCK_THRESHOLD = 10;

export const PRODUCT_IMAGE_PRESETS: readonly { label: string; value: string }[] = [
  { label: "Soda-lish Shortfill (/vapes/image-1.png)", value: "/vapes/image-1.png" },
  { label: "Kuro Momo Fuji (/vapes/image-2.jpg)", value: "/vapes/image-2.jpg" },
  { label: "ExPod Pro Cola (/vapes/image-3.jpeg)", value: "/vapes/image-3.jpeg" },
  { label: "Blue Raspberry Rings (/gummies/image-1.jpeg)", value: "/gummies/image-1.jpeg" },
  { label: "Wild Berry Bites (/gummies/image-2.jpeg)", value: "/gummies/image-2.jpeg" },
  { label: "Sour Apple Cubes (/gummies/image-3.webp)", value: "/gummies/image-3.webp" },
  { label: "OG Kush Reserve (/kush/image-1.webp)", value: "/kush/image-1.webp" },
  { label: "Purple Kush (/kush/image-2.webp)", value: "/kush/image-2.webp" },
  { label: "Lemon Kush (/kush/image-3.webp)", value: "/kush/image-3.webp" },
  { label: "Momo Eliquid Brand Mark (/logo.jpg)", value: "/logo.jpg" },
];

export function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function findCategory(
  catalogList: readonly Category[],
  slug: string,
): Category | undefined {
  return catalogList.find((c) => c.slug === slug);
}

// Full class names so Tailwind can see them.
export const bgClass: Record<ColorName, string> = {
  ink: "bg-ink",
  cream: "bg-cream",
  lime: "bg-lime",
  pink: "bg-pink",
  purple: "bg-purple",
  orange: "bg-orange",
  teal: "bg-teal",
};

/** Short compliance tag shown on bag and checkout lines. */
export function productTag(
  product: Pick<Product, "category">,
): { label: string; className: string } {
  if (product.category === "vapes") {
    return { label: "E-Liquid · 18+", className: "bg-sand" };
  }
  return { label: "Contains THC · 18+", className: "bg-lime" };
}
