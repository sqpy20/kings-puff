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
  description: string;
  details: { label: string; value: string }[];
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
    description:
      "Our iconic fruity soda shortfill blending tart raspberry, zesty pink grapefruit, and crisp lemon over a sparkling finish. Crafted in a 60 ml bottle for bold all-day flavour.",
    details: [
      { label: "Volume", value: "60 ml" },
      { label: "Nicotine", value: "0 mg (Shortfill)" },
      { label: "Flavour", value: "Raspberry, Grapefruit & Lemon" },
      { label: "Format", value: "Dropper Bottle" },
    ],
    price: 14.99,
    image: "/vapes/image-1.png",
    badge: "Featured",
  },
  {
    id: "kuro-momo-fuji",
    name: "Kuro Momo Fuji",
    category: "vapes",
    meta: "10 ml · 5 mg Nicotine · White Peach & Fuji Apple",
    description:
      "UK-made nicotine salt e-liquid pairing juicy Japanese white peach and crisp Fuji apple with aromatic shiso leaf and a refreshing crushed-ice exhale.",
    details: [
      { label: "Volume", value: "10 ml" },
      { label: "Nicotine", value: "5 mg Nic Salt" },
      { label: "Flavour", value: "White Peach, Fuji Apple & Shiso" },
      { label: "Origin", value: "UK Made" },
    ],
    price: 4.99,
    image: "/vapes/image-2.jpg",
    badge: "New arrival",
  },
  {
    id: "momo-expod-pro-cola-gummy",
    name: "Momo ExPod Pro — Cola Gummy",
    category: "vapes",
    meta: "2 ml Prefilled Pod · 20 mg/ml Nicotine",
    description:
      "Ready-to-vape prefilled pod powered by ExPod Pro, packed with nostalgic sweet cola gummy flavour and smooth 20 mg/ml nicotine salts.",
    details: [
      { label: "Volume", value: "2 ml" },
      { label: "Nicotine", value: "20 mg/ml Nic Salt" },
      { label: "Flavour", value: "Cola Gummy" },
      { label: "Format", value: "Prefilled Pod" },
    ],
    price: 6.99,
    image: "/vapes/image-3.jpeg",
    badge: "Available",
  },
  {
    id: "blue-raspberry-rings",
    name: "Blue Raspberry Rings",
    category: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    description:
      "Chewy, sugar-dusted blue raspberry gummy rings infused for consistent, clearly measured 10 mg THC dosing in every piece.",
    details: [
      { label: "Potency", value: "10 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "100 mg" },
      { label: "Flavour", value: "Blue Raspberry" },
    ],
    price: 22.0,
    image: "/gummies/image-1.jpeg",
    badge: "New arrival",
  },
  {
    id: "wild-berry-bites",
    name: "Wild Berry Bites",
    category: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    description:
      "Soft, sugar-coated red berry gummy bites bursting with ripe strawberry and raspberry notes, accurately dosed at 10 mg THC per bite.",
    details: [
      { label: "Potency", value: "10 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "100 mg" },
      { label: "Flavour", value: "Wild Berry" },
    ],
    price: 22.0,
    image: "/gummies/image-2.jpeg",
    badge: "Featured",
  },
  {
    id: "sour-apple-cubes",
    name: "Sour Apple Cubes",
    category: "gummies",
    meta: "15 mg THC per piece · 10 pieces (150 mg)",
    description:
      "Tangy sour green apple gummy cubes with a crisp sugar coating and a stronger 15 mg THC dose per cube for experienced adults.",
    details: [
      { label: "Potency", value: "15 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "150 mg" },
      { label: "Flavour", value: "Sour Green Apple" },
    ],
    price: 26.0,
    image: "/gummies/image-3.webp",
    badge: "Limited stock",
  },
  {
    id: "og-kush-reserve",
    name: "OG Kush Reserve",
    category: "kush",
    meta: "3.5 g · Indica-Dominant · 24% THC",
    description:
      "Dense, frosty indica-dominant buds rich with earthy pine and citrus notes, hand-trimmed and sealed fresh in 3.5 g packs.",
    details: [
      { label: "Weight", value: "3.5 g" },
      { label: "Type", value: "Indica-Dominant" },
      { label: "Potency", value: "24% THC" },
      { label: "Aroma", value: "Earthy Pine & Citrus" },
    ],
    price: 35.0,
    image: "/kush/image-1.webp",
    badge: "Featured",
  },
  {
    id: "purple-kush",
    name: "Purple Kush",
    category: "kush",
    meta: "3.5 g · Indica · 26% THC",
    description:
      "Vibrant purple-hued indica flower coated in milky trichomes, delivering sweet berry and grape aromatics with 26% THC potency.",
    details: [
      { label: "Weight", value: "3.5 g" },
      { label: "Type", value: "Indica" },
      { label: "Potency", value: "26% THC" },
      { label: "Aroma", value: "Sweet Grape & Earth" },
    ],
    price: 38.0,
    image: "/kush/image-2.webp",
    badge: "New arrival",
  },
  {
    id: "lemon-kush",
    name: "Lemon Kush",
    category: "kush",
    meta: "7 g · Hybrid · 22% THC",
    description:
      "Bright citrus-forward hybrid flower packed in a generous 7 g pouch, balancing zesty lemon aroma with smooth, uplifting effects.",
    details: [
      { label: "Weight", value: "7 g" },
      { label: "Type", value: "Hybrid" },
      { label: "Potency", value: "22% THC" },
      { label: "Aroma", value: "Zesty Lemon & Herbal" },
    ],
    price: 60.0,
    image: "/kush/image-3.webp",
    badge: "Limited stock",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProduct(id: string): Product {
  const product = findProduct(id);
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
