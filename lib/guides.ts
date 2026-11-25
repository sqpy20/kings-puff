import { MEDIA_IMAGES } from "./media";

export type GuideSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideFaq = {
  q: string;
  a: string;
};

export type BuyerGuide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string[];
  categorySlug: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  productIds: string[];
};

export const guides: BuyerGuide[] = [
  {
    slug: "shortfill-vs-nic-salts-uk-guide",
    title: "Shortfills vs Nic Salts: Choosing the Right UK E-Liquid",
    seoTitle: "Shortfills vs Nic Salts UK Guide (60ml Shortfill vs 10ml Nic Salt)",
    description:
      "Compare UK 60ml 0mg shortfills and 10ml 5mg–20mg nic salts. Learn VG/PG ratios, nicotine strength, pod vs sub-ohm coil matching, and flavour longevity.",
    keywords: [
      "shortfill vs nic salt UK",
      "60ml shortfill e-liquid",
      "10ml nic salts UK",
      "Momo Soda-lish",
      "Kuro Momo Fuji",
      "UK made e-liquid",
    ],
    categorySlug: "vapes",
    readingTime: "5 min read",
    publishedAt: "2026-11-10T09:00:00.000Z",
    updatedAt: "2026-11-25T09:00:00.000Z",
    image: MEDIA_IMAGES.vapes.sodaLish,
    productIds: ["momo-soda-lish", "kuro-momo-fuji"],
    sections: [
      {
        id: "key-differences",
        heading: "Key differences between shortfills and nic salts",
        paragraphs: [
          "UK vapers generally choose between two core bottle formats: larger 60 ml shortfill bottles crafted with zero nicotine and room for a 10 ml nic shot, or 10 ml TPD-compliant nicotine salt bottles ready to pour straight into refillable pods.",
          "While 60 ml shortfills like Momo Soda-lish focus on dense vapour and vibrant multi-layered fruit soda profiles at higher wattage, nic salts such as Kuro Momo Fuji are blended for rapid nicotine satisfaction and an ultra-smooth throat hit at low power.",
        ],
        bullets: [
          "Shortfills (60 ml): 0 mg base with space for customisation; ideal for sub-ohm kits and direct-lung (DTL) vaping.",
          "Nicotine salts (10 ml): Available in calibrated strengths (such as 5 mg/ml); built for MTL pod kits and starter devices.",
          "Both formats from Momo Eliquid list exact bottle volume, flavour notes, and UK manufacturing standards.",
        ],
      },
      {
        id: "flavour-and-coil-matching",
        heading: "Matching your e-liquid to coil resistance and airflow",
        paragraphs: [
          "Pairing the right viscosity with your coil prevents dry hits and muted flavour. High-VG shortfills wick best in sub-ohm tanks or high-output pod mods running 0.15 Ω to 0.4 Ω coils.",
          "Balanced 50/50 nic salt blends saturate compact 0.6 Ω to 1.2 Ω pod cartridges effortlessly, giving clean peach, apple, and shiso top notes even on compact pocket devices.",
        ],
      },
      {
        id: "uk-dispatch-and-storage",
        heading: "Fresh storage and same-day UK dispatch",
        paragraphs: [
          "Store e-liquid bottles upright away from direct sunlight to preserve terpene-bright fruit aromatics. Orders placed with Momo Eliquid before 2:00 PM UK time Monday to Friday ship the same working day, with free UK delivery over £50.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are Momo Eliquid bottles ready to vape straight out of the box?",
        a: "Yes. 10 ml nic salts and prefilled pods are ready immediately, and 60 ml shortfills can be vaped nicotine-free or mixed with a 10 ml nicotine booster.",
      },
      {
        q: "Which strength is best if I prefer a lighter throat hit?",
        a: "Look for a 5 mg nic salt such as Kuro Momo Fuji for gentle smoothness, or use a 0 mg shortfill like Momo Soda-lish.",
      },
    ],
  },
  {
    slug: "prefilled-vape-pods-uk-expod-pro",
    title: "Prefilled Vape Pods in the UK: Convenience Without Compromising Flavour",
    seoTitle: "Prefilled Vape Pods UK Guide: ExPod Pro 2ml Pods & Nic Salts",
    description:
      "Everything UK adult vapers need to know about 2ml prefilled pods like ExPod Pro Cola Gummy vs refillable nic salts, leak prevention, and puff consistency.",
    keywords: [
      "prefilled vape pods UK",
      "ExPod Pro Cola Gummy",
      "2ml prefilled pod 20mg",
      "UK vape pods",
      "Momo Eliquid pods",
    ],
    categorySlug: "vapes",
    readingTime: "4 min read",
    publishedAt: "2026-11-12T09:00:00.000Z",
    updatedAt: "2026-11-25T09:00:00.000Z",
    image: MEDIA_IMAGES.vapes.expodProCola,
    productIds: ["momo-expod-pro-cola-gummy", "kuro-momo-fuji"],
    sections: [
      {
        id: "why-prefilled-pods",
        heading: "Why UK vapers switch to 2 ml prefilled pods",
        paragraphs: [
          "Prefilled pod systems eliminate messy coil swaps and refilling while keeping waste far lower than single-use disposables. You simply click a fresh 2 ml cartridge into a rechargeable battery.",
          "With regulated 20 mg/ml nic salt formulations, pods like Momo ExPod Pro Cola Gummy deliver consistent flavour from the first draw to the last.",
        ],
        bullets: [
          "Zero refilling or priming delays — factory-sealed 2 ml liquid chamber.",
          "Rechargeable battery sustainability paired with pocket-friendly weight.",
          "Consistent ceramic or mesh heating tuned specifically to the liquid inside.",
        ],
      },
      {
        id: "when-to-keep-both",
        heading: "Combining prefilled pods and 10 ml bottled salts",
        paragraphs: [
          "Many UK customers keep ExPod Pro pods ready for commuting and nights out, while keeping 10 ml nic salt bottles at home for lower 5 mg sessions. Both stay clearly labelled with volume, strength, and flavour profile.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much nicotine is in Momo ExPod Pro Cola Gummy?",
        a: "Each 2 ml prefilled ExPod Pro pod contains 20 mg/ml nicotine salt for smooth, reliable satisfaction.",
      },
      {
        q: "How fast do vape pod orders arrive in the UK?",
        a: "Orders placed before 2:00 PM Monday to Friday dispatch the same day across England, Scotland, Wales, and Northern Ireland.",
      },
    ],
  },
  {
    slug: "thc-gummies-dosing-guide-uk",
    title: "THC Gummies Dosing Guide: Comparing 10 mg vs 15 mg Packs",
    seoTitle: "THC Gummies Dosing Guide UK: 10mg vs 15mg Edibles Breakdown",
    description:
      "Clear adult dosing breakdown for UK edible shoppers. Compare 10mg THC Blue Raspberry Rings & Wild Berry Bites with stronger 15mg Sour Apple Cubes.",
    keywords: [
      "THC gummies dosing guide",
      "10mg THC gummies",
      "15mg THC gummies",
      "Blue Raspberry Rings",
      "Sour Apple Cubes",
      "Wild Berry Bites",
    ],
    categorySlug: "gummies",
    readingTime: "5 min read",
    publishedAt: "2026-11-15T09:00:00.000Z",
    updatedAt: "2026-11-25T09:00:00.000Z",
    image: MEDIA_IMAGES.gummies.blueRaspberryRings,
    productIds: ["blue-raspberry-rings", "wild-berry-bites", "sour-apple-cubes"],
    sections: [
      {
        id: "reading-mg-per-piece",
        heading: "How to read potency per piece vs total pack THC",
        paragraphs: [
          "Always check two numbers before choosing edibles: milligrams per single piece and total milligrams across the pack. Consistent piece-by-piece dosing lets adults pace cleanly without guesswork.",
          "In the Momo Eliquid gummies range, Blue Raspberry Rings and Wild Berry Bites provide 10 mg THC per piece (100 mg per 10-piece pack), whereas Sour Apple Cubes step up to 15 mg THC per piece (150 mg total).",
        ],
        bullets: [
          "10 mg / piece (100 mg pack): Balanced starting strength; halves easily to 5 mg.",
          "15 mg / piece (150 mg pack): Tailored for experienced adults seeking stronger potency.",
          "Wait 60 to 120 minutes after your first piece before taking more.",
        ],
      },
      {
        id: "pacing-and-storage",
        heading: "Start low, pace slowly, and reseal tightly",
        paragraphs: [
          "Edibles digest differently from inhaled formats, taking longer to peak and lasting several hours. Store sugar-coated gummies in a cool, dark cupboard well out of reach of children and pets.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the difference between Blue Raspberry Rings and Sour Apple Cubes?",
        a: "Blue Raspberry Rings contain 10 mg THC per piece (100 mg total across 10 pieces), while Sour Apple Cubes provide 15 mg THC per piece (150 mg total).",
      },
      {
        q: "Are pack totals clearly printed on every Momo Eliquid edible?",
        a: "Yes. Every product page and pouch clearly specifies potency per piece, pack count, total THC, and flavour profile.",
      },
    ],
  },
  {
    slug: "indica-vs-hybrid-small-batch-kush-guide",
    title: "Indica vs Hybrid Kush: Strain Potency, Weights & Terpene Profiles",
    seoTitle: "Indica vs Hybrid Kush Guide UK: 3.5g vs 7g Flower & Terpenes",
    description:
      "Compare indica-dominant OG Kush Reserve (24% THC), Purple Kush (26% THC), and citrus Lemon Kush hybrid (7g, 22% THC) by aroma, potency, and pack weight.",
    keywords: [
      "Indica vs Hybrid Kush",
      "OG Kush Reserve 24% THC",
      "Purple Kush 26% THC",
      "Lemon Kush 7g Hybrid",
      "small-batch Kush UK",
    ],
    categorySlug: "kush",
    readingTime: "5 min read",
    publishedAt: "2026-11-18T09:00:00.000Z",
    updatedAt: "2026-11-25T09:00:00.000Z",
    image: MEDIA_IMAGES.kush.ogKushReserve,
    productIds: ["og-kush-reserve", "purple-kush", "lemon-kush"],
    sections: [
      {
        id: "strain-profiles",
        heading: "Comparing indica-leaning Kush against balanced hybrids",
        paragraphs: [
          "Classic Kush cultivars are prized for dense, trichome-coated flower and unmistakable pine, citrus, or berry aromatics. Choosing between them comes down to terpene character, THC percentage, and pack weight.",
          "Purple Kush leads on potency at 26% THC with sweet grape and earth notes, OG Kush Reserve balances 24% THC with earthy pine and citrus, and Lemon Kush offers an uplifting 22% THC hybrid in a generous 7 g pouch.",
        ],
        bullets: [
          "OG Kush Reserve (3.5 g): Indica-dominant · 24% THC · Earthy Pine & Citrus.",
          "Purple Kush (3.5 g): Indica · 26% THC · Sweet Grape & Earth.",
          "Lemon Kush (7 g): Hybrid · 22% THC · Zesty Lemon & Herbal.",
        ],
      },
      {
        id: "weights-and-freshness",
        heading: "Choosing 3.5 g vs 7 g sealed pouches",
        paragraphs: [
          "3.5 g pouches are ideal for sampling individual cultivars or rotating evening and weekend flower, while 7 g packs deliver better value when you already favour bright citrus-herbal hybrids like Lemon Kush.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which Momo Eliquid Kush strain has the highest THC potency?",
        a: "Purple Kush lists 26% THC in a 3.5 g pouch, closely followed by OG Kush Reserve at 24% THC.",
      },
      {
        q: "Do Kush packs qualify for free UK delivery?",
        a: "Yes — any single order or mixed basket reaching £50 or more qualifies for free UK standard delivery, including Lemon Kush 7 g (£60).",
      },
    ],
  },
];

export function findGuide(slug: string): BuyerGuide | undefined {
  return guides.find((g) => g.slug === slug);
}
