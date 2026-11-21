import type { ColorName } from "@/components/illustrations";

export type CategorySlug = "vapes" | "gummies" | "kush";

export type Category = {
  slug: CategorySlug;
  /** Full name, used for headings and links. */
  label: string;
  /** Short name, used on the filter pills. */
  short: string;
  description: string;
  color: ColorName;
};

export type Badge = "New arrival" | "Featured" | "Limited stock" | "Available";

export type Product = {
  id: string;
  name: string;
  category: CategorySlug;
  meta: string;
  price: number;
  image: string;
  badge?: Badge;
};

export const FREE_SHIPPING_THRESHOLD = 50;

export function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export const categories: Category[] = [
  {
    slug: "vapes",
    label: "Vapes",
    short: "Vapes",
    description:
      "Smooth, flavour-forward and ready to go. Every device lists strain, potency and size.",
    color: "purple",
  },
  {
    slug: "gummies",
    label: "Gummies",
    short: "Gummies",
    description:
      "Chewy, fruity and clearly dosed. Every pack lists THC per piece and per pack.",
    color: "pink",
  },
  {
    slug: "kush",
    label: "Kush",
    short: "Kush",
    description:
      "Aromatic, top-shelf flower in bold packs. Every pouch lists strain, potency and weight.",
    color: "lime",
  },
];

export const products: Product[] = [
  {
    id: "momo-soda-lish",
    name: "Momo Soda-lish",
    category: "vapes",
    meta: "60 ml · Raspberry, Grapefruit & Lemon",
    price: 14.99,
    image: "/vapes/image-1.png",
    badge: "Featured",
  },
  {
    id: "kuro-momo-fuji",
    name: "Kuro Momo Fuji",
    category: "vapes",
    meta: "10 ml · 5 mg Nicotine · White Peach & Fuji Apple",
    price: 4.99,
    image: "/vapes/image-2.jpg",
    badge: "New arrival",
  },
  {
    id: "momo-expod-pro-cola-gummy",
    name: "Momo ExPod Pro — Cola Gummy",
    category: "vapes",
    meta: "2 ml Prefilled Pod · 20 mg/ml Nicotine",
    price: 6.99,
    image: "/vapes/image-3.jpeg",
    badge: "Available",
  },
  {
    id: "blue-raspberry-rings",
    name: "Blue Raspberry Rings",
    category: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    price: 22.0,
    image: "/gummies/image-1.jpeg",
    badge: "New arrival",
  },
  {
    id: "wild-berry-bites",
    name: "Wild Berry Bites",
    category: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    price: 22.0,
    image: "/gummies/image-2.jpeg",
    badge: "Featured",
  },
  {
    id: "sour-apple-cubes",
    name: "Sour Apple Cubes",
    category: "gummies",
    meta: "15 mg THC per piece · 10 pieces (150 mg)",
    price: 26.0,
    image: "/gummies/image-3.webp",
    badge: "Limited stock",
  },
  {
    id: "og-kush-reserve",
    name: "OG Kush Reserve",
    category: "kush",
    meta: "3.5 g · Indica-Dominant · 24% THC",
    price: 35.0,
    image: "/kush/image-1.webp",
    badge: "Featured",
  },
  {
    id: "purple-kush",
    name: "Purple Kush",
    category: "kush",
    meta: "3.5 g · Indica · 26% THC",
    price: 38.0,
    image: "/kush/image-2.webp",
    badge: "New arrival",
  },
  {
    id: "lemon-kush",
    name: "Lemon Kush",
    category: "kush",
    meta: "7 g · Hybrid · 22% THC",
    price: 60.0,
    image: "/kush/image-3.webp",
    badge: "Limited stock",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(id: string): Product {
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product: ${id}`);
  return product;
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
export function productTag(product: Product): { label: string; className: string } {
  if (product.category === "vapes") {
    return { label: "E-Liquid · 18+", className: "bg-sand" };
  }
  return { label: "Contains THC · 18+", className: "bg-lime" };
}
