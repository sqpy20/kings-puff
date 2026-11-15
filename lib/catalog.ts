import type { ColorName } from "@/components/illustrations";

export type CategorySlug =
  | "thc-gummies"
  | "vapes"
  | "rosin-syrup"
  | "backwood-wraps"
  | "accessories";

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
  note: string;
  badge?: Badge;
  /** Colours for the illustration; meaning depends on the category. */
  palette: ColorName[];
};

export const categories: Category[] = [
  {
    slug: "thc-gummies",
    label: "THC Gummies",
    short: "Gummies",
    description:
      "Chewy, fruity and clearly dosed. Every pack lists THC per piece and per pack.",
    color: "pink",
  },
  {
    slug: "vapes",
    label: "Vapes",
    short: "Vapes",
    description:
      "Smooth, flavour-forward and ready to go. Every device lists strain, potency and size.",
    color: "purple",
  },
  {
    slug: "rosin-syrup",
    label: "Rosin Syrup",
    short: "Rosin Syrup",
    description:
      "Rich rosin syrup in bold flavours, with THC per serving and per bottle on every label.",
    color: "orange",
  },
  {
    slug: "backwood-wraps",
    label: "Backwood Wraps",
    short: "Backwood Wraps",
    description:
      "Slow-burning wraps in classic and flavoured packs. Tobacco product, 21+ only.",
    color: "lime",
  },
  {
    slug: "accessories",
    label: "Accessories",
    short: "Accessories",
    description:
      "The extras that complete the ritual, in colours as loud as the rest of the lineup.",
    color: "teal",
  },
];

const THC_NOTE = "21+ · Contains THC · Available in select states";
const TOBACCO_NOTE = "21+ · Tobacco product · Available in select states";
const PLAIN_NOTE = "21+ · Available in select states";

const GUMMY_META = "[XX] mg THC per piece · [count] pieces";
const VAPE_META = "[X] g · [strain / flavour]";
const SYRUP_META = "[XX] mg THC · [XX] ml";
const WRAP_META = "[count] per pack · [flavours]";
const ACCESSORY_META = "[material] · [size]";

// Placeholder catalogue: names, specs and prices are stand-ins until real
// product data is connected.
export const products: Product[] = [
  { id: "rainbow-crown-gummies", name: "Rainbow Crown Gummies", category: "thc-gummies", meta: GUMMY_META, note: THC_NOTE, badge: "New arrival", palette: ["lime", "purple", "orange"] },
  { id: "sour-sunburst-bites", name: "Sour Sunburst Bites", category: "thc-gummies", meta: GUMMY_META, note: THC_NOTE, badge: "Featured", palette: ["orange", "lime", "teal"] },
  { id: "mango-tie-dye-chews", name: "Mango Tie-Dye Chews", category: "thc-gummies", meta: GUMMY_META, note: THC_NOTE, palette: ["teal", "orange", "purple"] },
  { id: "berry-royale-gummies", name: "Berry Royale Gummies", category: "thc-gummies", meta: GUMMY_META, note: THC_NOTE, badge: "Limited stock", palette: ["purple", "pink", "lime"] },

  { id: "purple-reign-disposable", name: "Purple Reign Disposable", category: "vapes", meta: VAPE_META, note: THC_NOTE, badge: "Featured", palette: ["teal"] },
  { id: "pink-crown-disposable", name: "Pink Crown Disposable", category: "vapes", meta: VAPE_META, note: THC_NOTE, badge: "New arrival", palette: ["pink"] },
  { id: "electric-lime-disposable", name: "Electric Lime Disposable", category: "vapes", meta: VAPE_META, note: THC_NOTE, palette: ["lime"] },

  { id: "golden-hour-rosin-syrup", name: "Golden Hour Rosin Syrup", category: "rosin-syrup", meta: SYRUP_META, note: THC_NOTE, badge: "Limited stock", palette: ["pink"] },
  { id: "berry-bliss-rosin-syrup", name: "Berry Bliss Rosin Syrup", category: "rosin-syrup", meta: SYRUP_META, note: THC_NOTE, palette: ["purple"] },
  { id: "citrus-crown-rosin-syrup", name: "Citrus Crown Rosin Syrup", category: "rosin-syrup", meta: SYRUP_META, note: THC_NOTE, badge: "New arrival", palette: ["lime"] },

  { id: "backwood-wraps-variety", name: "Backwood Wraps — Variety", category: "backwood-wraps", meta: WRAP_META, note: TOBACCO_NOTE, badge: "Available", palette: ["purple"] },
  { id: "backwood-wraps-honey", name: "Backwood Wraps — Honey", category: "backwood-wraps", meta: WRAP_META, note: TOBACCO_NOTE, palette: ["pink"] },

  { id: "royal-grinder", name: "Royal Grinder", category: "accessories", meta: ACCESSORY_META, note: PLAIN_NOTE, badge: "Featured", palette: ["pink"] },
  { id: "crown-rolling-tray", name: "Crown Rolling Tray", category: "accessories", meta: ACCESSORY_META, note: PLAIN_NOTE, palette: ["purple"] },
  { id: "kings-puff-battery", name: "Kings Puff Battery", category: "accessories", meta: ACCESSORY_META, note: PLAIN_NOTE, palette: ["orange"] },
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
