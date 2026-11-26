import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadLocalEnv() {
  const cwd = process.cwd();
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(cwd, filename);
    if (!fs.existsSync(filePath)) continue;

    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(filePath);
    } else {
      const content = fs.readFileSync(filePath, "utf8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIndex = line.indexOf("=");
        if (eqIndex <= 0) continue;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    }
    break;
  }
}

const SEED_CATALOGS = [
  {
    slug: "vapes",
    label: "Vapes",
    short: "Vapes",
    description:
      "Smooth, flavour-forward and ready to go. Every device lists strain, potency and size.",
    color: "purple",
    sort_order: 1,
  },
  {
    slug: "gummies",
    label: "Gummies",
    short: "Gummies",
    description:
      "Chewy, fruity and clearly dosed. Every pack lists THC per piece and per pack.",
    color: "pink",
    sort_order: 2,
  },
  {
    slug: "kush",
    label: "Kush",
    short: "Kush",
    description:
      "Aromatic, top-shelf flower in bold packs. Every pouch lists strain, potency and weight.",
    color: "lime",
    sort_order: 3,
  },
];

const SEED_PRODUCTS = [
  {
    id: "momo-soda-lish",
    name: "Momo Soda-lish",
    category_slug: "vapes",
    meta: "60 ml · Raspberry, Grapefruit & Lemon",
    description:
      "Our iconic fruity soda shortfill blending tart raspberry, zesty pink grapefruit, and crisp lemon over a sparkling finish. Crafted in a 60 ml bottle for bold all-day flavour.",
    details: [
      { label: "Volume", value: "60 ml" },
      { label: "Nicotine", value: "0 mg (Shortfill)" },
      { label: "Flavour", value: "Raspberry, Grapefruit & Lemon" },
      { label: "Format", value: "Dropper Bottle" },
    ],
    price_pence: 1499,
    stock_qty: 38,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584272/momo-eliquid/vapes/image-1.png",
    badge: "Featured",
    featured: true,
    active: true,
    sort_order: 1,
  },
  {
    id: "kuro-momo-fuji",
    name: "Kuro Momo Fuji",
    category_slug: "vapes",
    meta: "10 ml · 5 mg Nicotine · White Peach & Fuji Apple",
    description:
      "UK-made nicotine salt e-liquid pairing juicy Japanese white peach and crisp Fuji apple with aromatic shiso leaf and a refreshing crushed-ice exhale.",
    details: [
      { label: "Volume", value: "10 ml" },
      { label: "Nicotine", value: "5 mg Nic Salt" },
      { label: "Flavour", value: "White Peach, Fuji Apple & Shiso" },
      { label: "Origin", value: "UK Made" },
    ],
    price_pence: 499,
    stock_qty: 42,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584282/momo-eliquid/vapes/image-2.jpg",
    badge: "New arrival",
    featured: true,
    active: true,
    sort_order: 2,
  },
  {
    id: "momo-expod-pro-cola-gummy",
    name: "Momo ExPod Pro — Cola Gummy",
    category_slug: "vapes",
    meta: "2 ml Prefilled Pod · 20 mg/ml Nicotine",
    description:
      "Ready-to-vape prefilled pod powered by ExPod Pro, packed with nostalgic sweet cola gummy flavour and smooth 20 mg/ml nicotine salts.",
    details: [
      { label: "Volume", value: "2 ml" },
      { label: "Nicotine", value: "20 mg/ml Nic Salt" },
      { label: "Flavour", value: "Cola Gummy" },
      { label: "Format", value: "Prefilled Pod" },
    ],
    price_pence: 699,
    stock_qty: 45,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584286/momo-eliquid/vapes/image-3.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 3,
  },
  {
    id: "blue-raspberry-rings",
    name: "Blue Raspberry Rings",
    category_slug: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    description:
      "Chewy, sugar-dusted blue raspberry gummy rings infused for consistent, clearly measured 10 mg THC dosing in every piece.",
    details: [
      { label: "Potency", value: "10 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "100 mg" },
      { label: "Flavour", value: "Blue Raspberry" },
    ],
    price_pence: 2200,
    stock_qty: 30,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584289/momo-eliquid/gummies/image-1.jpg",
    badge: "New arrival",
    featured: true,
    active: true,
    sort_order: 4,
  },
  {
    id: "wild-berry-bites",
    name: "Wild Berry Bites",
    category_slug: "gummies",
    meta: "10 mg THC per piece · 10 pieces (100 mg)",
    description:
      "Soft, sugar-coated red berry gummy bites bursting with ripe strawberry and raspberry notes, accurately dosed at 10 mg THC per bite.",
    details: [
      { label: "Potency", value: "10 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "100 mg" },
      { label: "Flavour", value: "Wild Berry" },
    ],
    price_pence: 2200,
    stock_qty: 28,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584290/momo-eliquid/gummies/image-2.jpg",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 5,
  },
  {
    id: "sour-apple-cubes",
    name: "Sour Apple Cubes",
    category_slug: "gummies",
    meta: "15 mg THC per piece · 10 pieces (150 mg)",
    description:
      "Tangy sour green apple gummy cubes with a crisp sugar coating and a stronger 15 mg THC dose per cube for experienced adults.",
    details: [
      { label: "Potency", value: "15 mg THC / piece" },
      { label: "Pack Size", value: "10 pieces" },
      { label: "Total THC", value: "150 mg" },
      { label: "Flavour", value: "Sour Green Apple" },
    ],
    price_pence: 2600,
    stock_qty: 8,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584292/momo-eliquid/gummies/image-3.webp",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 6,
  },
  {
    id: "og-kush-reserve",
    name: "OG Kush Reserve",
    category_slug: "kush",
    meta: "3.5 g · Indica-Dominant · 24% THC",
    description:
      "Dense, frosty indica-dominant buds rich with earthy pine and citrus notes, hand-trimmed and sealed fresh in 3.5 g packs.",
    details: [
      { label: "Weight", value: "3.5 g" },
      { label: "Type", value: "Indica-Dominant" },
      { label: "Potency", value: "24% THC" },
      { label: "Aroma", value: "Earthy Pine & Citrus" },
    ],
    price_pence: 3500,
    stock_qty: 24,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584293/momo-eliquid/kush/image-1.webp",
    badge: "Featured",
    featured: true,
    active: true,
    sort_order: 7,
  },
  {
    id: "purple-kush",
    name: "Purple Kush",
    category_slug: "kush",
    meta: "3.5 g · Indica · 26% THC",
    description:
      "Vibrant purple-hued indica flower coated in milky trichomes, delivering sweet berry and grape aromatics with 26% THC potency.",
    details: [
      { label: "Weight", value: "3.5 g" },
      { label: "Type", value: "Indica" },
      { label: "Potency", value: "26% THC" },
      { label: "Aroma", value: "Sweet Grape & Earth" },
    ],
    price_pence: 3800,
    stock_qty: 26,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584296/momo-eliquid/kush/image-2.webp",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 8,
  },
  {
    id: "lemon-kush",
    name: "Lemon Kush",
    category_slug: "kush",
    meta: "7 g · Hybrid · 22% THC",
    description:
      "Bright citrus-forward hybrid flower packed in a generous 7 g pouch, balancing zesty lemon aroma with smooth, uplifting effects.",
    details: [
      { label: "Weight", value: "7 g" },
      { label: "Type", value: "Hybrid" },
      { label: "Potency", value: "22% THC" },
      { label: "Aroma", value: "Zesty Lemon & Herbal" },
    ],
    price_pence: 6000,
    stock_qty: 8,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584297/momo-eliquid/kush/image-3.webp",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 9,
  },
  {
    id: "momo-live-rosin-duo-red",
    name: "Momo Live Rosin Digital Vape & Infused Joint Duo",
    category_slug: "vapes",
    meta: "888-Puff Digital Vape + Live Rosin Infused Joint",
    description:
      "Limited metallic red digital smart-puff disposable paired with a live rosin infused pre-roll in holographic collector sleeves.",
    details: [
      { label: "Format", value: "Digital Disposable + Infused Joint" },
      { label: "Extract", value: "Live Rosin" },
      { label: "Display", value: "LED Puff & Battery Meter" },
      { label: "Origin", value: "Small-Batch Release" },
    ],
    price_pence: 4800,
    stock_qty: 24,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689132/momo-eliquid/vapes/momo-live-rosin-duo-red.jpg",
    badge: "New arrival",
    featured: true,
    active: true,
    sort_order: 10,
  },
  {
    id: "momo-liquid-diamonds-yellow",
    name: "Momo Liquid Diamonds & Live Resin 2g — Yellow Edition",
    category_slug: "vapes",
    meta: "2 g All-in-One · Liquid Diamonds & Live Resin",
    description:
      "Sleek matte yellow 2 g all-in-one vape loaded with pure liquid diamonds and strain-specific live resin terpenes across Indica, Sativa, and Hybrid profiles.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Extract", value: "Liquid Diamonds & Live Resin" },
      { label: "Strains", value: "Blue Dream, Orange Creamsicle, Sugar Mami" },
      { label: "Format", value: "All-in-One Rechargeable" },
    ],
    price_pence: 4500,
    stock_qty: 30,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689144/momo-eliquid/vapes/momo-liquid-diamonds-yellow.png",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 11,
  },
  {
    id: "momo-live-diamond-pod-cobalt",
    name: "Momo Liquid Live Diamond All-in-One — Cobalt Blue",
    category_slug: "vapes",
    meta: "2 g All-in-One · Wide Oil Viewing Window",
    description:
      "Compact cobalt-blue soft-touch all-in-one pod engineered with a crystal oil window and high-terpene liquid live diamond formulation.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Extract", value: "Liquid Live Diamonds" },
      { label: "Hardware", value: "Cobalt Soft-Touch Chassis" },
      { label: "Rechargeable", value: "USB-C" },
    ],
    price_pence: 4400,
    stock_qty: 28,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689141/momo-eliquid/vapes/momo-live-diamond-pod-cobalt.png",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 12,
  },
  {
    id: "momo-sativa-smart-screen-ice",
    name: "Momo Sativa Smart Screen Vape — Ice Blue",
    category_slug: "vapes",
    meta: "2 g Sativa · Smart OLED Screen Disposable",
    description:
      "Uplifting Sativa Edition disposable in frosted ice-blue finish with an integrated smart screen and bold dessert and citrus genetics.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Strain Type", value: "Sativa" },
      { label: "Extract", value: "Liquid Diamonds" },
      { label: "Hardware", value: "Smart Screen AIO" },
    ],
    price_pence: 4200,
    stock_qty: 26,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689145/momo-eliquid/vapes/momo-sativa-smart-screen-ice.png",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 13,
  },
  {
    id: "momo-peach-mango-gold-tip",
    name: "Momo Peach Mango Gold-Tip 2g Disposable",
    category_slug: "vapes",
    meta: "2 g Hybrid · Peach Mango · Gold Mouthpiece",
    description:
      "Signature stealth-black Momo body crowned with a brushed gold mouthpiece and oil sight window, prefilled with lush Peach Mango extract.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Flavour", value: "Peach Mango" },
      { label: "Hardware", value: "Gold-Tip Precision Coil" },
      { label: "Series", value: "Dark Circuit Edition" },
    ],
    price_pence: 4500,
    stock_qty: 32,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689144/momo-eliquid/vapes/momo-peach-mango-gold-tip.png",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 14,
  },
  {
    id: "momo-rose-pink-reserve-duo",
    name: "Momo Rose Pink 2g Vape & Travel Tube",
    category_slug: "vapes",
    meta: "2 g Reserve Extract + Matching Travel Tube",
    description:
      "Anodised rose-pink slimline 2 g disposable bundled with an airtight Momo protective carry tube for crisp strain flavour on the move.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Includes", value: "Vape Device & Sealed Carry Tube" },
      { label: "Finish", value: "Brushed Rose Pink" },
      { label: "Terpenes", value: "Kush Mints / Passion Orange / Wild Cherry" },
    ],
    price_pence: 4600,
    stock_qty: 22,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689170/momo-eliquid/vapes/momo-rose-pink-reserve-duo.png",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 15,
  },
  {
    id: "momo-watermelon-lime-agua-fresca",
    name: "Momo Watermelon Lime Agua Fresca — 2g Liquid Diamonds",
    category_slug: "vapes",
    meta: "2 g Sativa · Watermelon Lime Agua Fresca",
    description:
      "Collector-edition lime-green chassis with diamond-and-football artwork, prefilled with crisp Sativa Watermelon Lime Agua Fresca liquid diamonds.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Strain Type", value: "Sativa" },
      { label: "Flavour", value: "Watermelon & Zesty Lime" },
      { label: "Extract", value: "Liquid Diamonds" },
    ],
    price_pence: 4800,
    stock_qty: 20,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689175/momo-eliquid/vapes/momo-watermelon-lime-agua-fresca.png",
    badge: "Limited stock",
    featured: true,
    active: true,
    sort_order: 16,
  },
  {
    id: "momo-gold-bullet-peach-mango",
    name: "Momo 24K Gold Bullet — Peach Mango 2g",
    category_slug: "vapes",
    meta: "2 g Live Resin & Liquid Diamonds · Gold Bullet Tube",
    description:
      "Showpiece 24K mirror-gold bullet hardware housed in an embossed black display tube, delivering rich Peach Mango live resin and liquid diamonds.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Flavour", value: "Peach Mango" },
      { label: "Extract", value: "Live Resin & Liquid Diamonds" },
      { label: "Packaging", value: "QR-Verified Gold Tube" },
    ],
    price_pence: 5200,
    stock_qty: 16,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689176/momo-eliquid/vapes/momo-gold-bullet-peach-mango.png",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 17,
  },
  {
    id: "momo-ceramic-cartridge-peach-mango",
    name: "Momo Refined 510 Cartridge — Peach Mango 1g",
    category_slug: "vapes",
    meta: "1 g 510-Thread Ceramic Cart · Peach Mango Hybrid",
    description:
      "Clean ceramic-core 1 g 510 cartridge filled with golden Peach Mango hybrid oil for standard screw-on vape batteries.",
    details: [
      { label: "Weight", value: "1 g" },
      { label: "Thread", value: "Universal 510" },
      { label: "Flavour", value: "Peach Mango Hybrid" },
      { label: "Core", value: "Ceramic Atomiser" },
    ],
    price_pence: 3400,
    stock_qty: 36,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689177/momo-eliquid/vapes/momo-ceramic-cartridge-peach-mango.png",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 18,
  },
  {
    id: "momo-dual-mode-switch-vape",
    name: "Momo Dual-Mode Flavour Switch — Red & Blue",
    category_slug: "vapes",
    meta: "2 g Dual-Mode Select Switch · Live Resin Slush",
    description:
      "Dual-tank digital disposable with bottom SELECT button — tap twice to switch sides or five times to blend both flavours at once.",
    details: [
      { label: "Weight", value: "2 g (Dual Tank)" },
      { label: "Controls", value: "2x Switch · 5x Dual Blend" },
      { label: "Lineup", value: "Mango Haze, Pink Lemonade, Crunch Berries" },
      { label: "Display", value: "Full-Front Status Screen" },
    ],
    price_pence: 4600,
    stock_qty: 25,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689174/momo-eliquid/vapes/momo-dual-mode-switch-vape.png",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 19,
  },
  {
    id: "momo-pulse-25k-white-gummy-ice",
    name: "Momo Pulse 25K — White Gummy Ice",
    category_slug: "vapes",
    meta: "25,000 Puffs Regular / 15K Pulse · White Gummy Ice",
    description:
      "High-capacity metallic blue Momo Pulse disposable featuring curved side telemetry screen, boost mode, and frosty sweet pineapple-gummy clouds.",
    details: [
      { label: "Capacity", value: "25K Regular / 15K Pulse" },
      { label: "Flavour", value: "White Gummy Ice" },
      { label: "Display", value: "Side LED Liquid & Battery Screen" },
      { label: "Charging", value: "USB-C Fast Charge" },
    ],
    price_pence: 2800,
    stock_qty: 40,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689190/momo-eliquid/vapes/momo-pulse-25k-white-gummy-ice.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 20,
  },
  {
    id: "momo-blinker-tamarindo-3-flavors",
    name: "Momo Blinker 3-Flavour Switch — Tamarindo Indica",
    category_slug: "vapes",
    meta: "2 g Indica · 3-Flavour Blinker OLED Device",
    description:
      "Matte stealth-black Blinker 2 g device featuring a live blink counter, battery bar, and 3-in-1 indica Tamarindo terpene profile.",
    details: [
      { label: "Weight", value: "2 g (0.071 oz)" },
      { label: "Strain Type", value: "Indica (3 Flavours)" },
      { label: "Edition", value: "Tamarindo Blinker" },
      { label: "Display", value: "Blinker Telemetry Screen" },
    ],
    price_pence: 4800,
    stock_qty: 21,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689187/momo-eliquid/vapes/momo-blinker-tamarindo-3-flavors.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 21,
  },
  {
    id: "momo-matte-gold-watermelon-og",
    name: "Momo Matte Gold 2g — Watermelon OG",
    category_slug: "vapes",
    meta: "2 g Slim Gold Bar · Watermelon OG",
    description:
      "Brushed satin-gold slimline Momo disposable featuring a deep oil viewing window, digital display base, and juicy Watermelon OG resin.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Finish", value: "Brushed Matte Gold" },
      { label: "Flavours", value: "Watermelon OG, Jelly Belly, Wild Cherry" },
      { label: "Battery", value: "Rechargeable Smart Base" },
    ],
    price_pence: 4500,
    stock_qty: 27,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689192/momo-eliquid/vapes/momo-matte-gold-watermelon-og.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 22,
  },
  {
    id: "momo-gold-reserve-passion-orange-guava",
    name: "Momo Gold Reserve 2g — Passion Orange Guava",
    category_slug: "vapes",
    meta: "2 g Tropical Blend · Passion Orange Guava",
    description:
      "Laser-etched satin gold 2 g vape engraved with Passion Orange Guava and paired with tropical punch, creamsicle, and melon reserves.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Flavour", value: "Passion Orange Guava" },
      { label: "Finish", value: "Etched Satin Gold" },
      { label: "Format", value: "All-in-One Rechargeable" },
    ],
    price_pence: 4500,
    stock_qty: 24,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689193/momo-eliquid/vapes/momo-gold-reserve-passion-orange-guava.jpg",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 23,
  },
  {
    id: "momo-fruity-pebbles-liquid-diamonds",
    name: "Momo Fruity Pebbles — 2g Liquid Diamonds",
    category_slug: "vapes",
    meta: "2 g All-in-One · Fruity Pebbles Liquid Diamonds",
    description:
      "Crimson-red all-in-one diamond pod boxed in vivid collector packaging, blending nostalgic Fruity Pebbles sweetness with clean 2 g diamonds.",
    details: [
      { label: "Weight", value: "2 g" },
      { label: "Flavour", value: "Fruity Pebbles" },
      { label: "Extract", value: "Liquid Diamonds" },
      { label: "Hardware", value: "Crimson Metallic Body" },
    ],
    price_pence: 4800,
    stock_qty: 29,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689186/momo-eliquid/vapes/momo-fruity-pebbles-liquid-diamonds.jpg",
    badge: "New arrival",
    featured: true,
    active: true,
    sort_order: 24,
  },
  {
    id: "momo-pulse-25k-sky-blue",
    name: "Momo Pulse 25K — Sky Blue Edition",
    category_slug: "vapes",
    meta: "25,000 Puffs Regular / 15K Pulse · Dual Mesh",
    description:
      "Gloss sky-blue curved Pulse edition engineered for ultra-smooth iced fruit draws with full transparent liquid tank and smart power display.",
    details: [
      { label: "Capacity", value: "25,000 Puffs" },
      { label: "Coil", value: "Dual Mesh Core" },
      { label: "Edition", value: "Sky Blue Metallic" },
      { label: "Charging", value: "USB-C" },
    ],
    price_pence: 2800,
    stock_qty: 34,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689200/momo-eliquid/vapes/momo-pulse-25k-sky-blue.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 25,
  },
  {
    id: "momo-dual-chamber-tiramisu-mimosa",
    name: "Momo Sunset Dual-Chamber — Tiramisu & Mimosa",
    category_slug: "vapes",
    meta: "99% Pure Extract · Dual Flavour Gradient AIO",
    description:
      "Vibrant sunset yellow-to-pink dual-chamber Momo device delivering rich Tiramisu Glazed Donut and bright Tropicana Mimosa in one pocket kit.",
    details: [
      { label: "Purity", value: "99% Lab-Tested Extract" },
      { label: "Flavours", value: "Tiramisu & Mimosa" },
      { label: "Finish", value: "Sunset Yellow / Hot Pink" },
      { label: "Format", value: "Dual-Tank AIO" },
    ],
    price_pence: 5000,
    stock_qty: 19,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689201/momo-eliquid/vapes/momo-dual-chamber-tiramisu-mimosa.jpg",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 26,
  },
  {
    id: "momo-blue-razz-100mg-gummy",
    name: "Momo Blue Razz 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Dual-Tone Blue Raspberry Sachet",
    description:
      "Individually foil-sealed dual-tone Blue Razz sugar-dusted giant gummy medallion dosed cleanly at 100 mg THC.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Blue Raspberry" },
      { label: "Coating", value: "Fine Sour Sugar" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 45,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689196/momo-eliquid/gummies/momo-blue-razz-100mg-gummy.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 27,
  },
  {
    id: "momo-watermelon-100mg-gummy",
    name: "Momo Watermelon 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Sweet Watermelon Sachet",
    description:
      "Two-tone pink and green sugar-coated watermelon infused gummy sealed fresh in a Momo collector sachet at 100 mg THC.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Classic Watermelon" },
      { label: "Coating", value: "Cane Sugar Finish" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 42,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689199/momo-eliquid/gummies/momo-watermelon-100mg-gummy.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 28,
  },
  {
    id: "momo-peach-mango-100mg-gummy",
    name: "Momo Peach Mango 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Tropical Peach & Mango Sachet",
    description:
      "Bright split-colour golden peach and ruby mango 100 mg THC gummy crafted for juicy tropical sweetness and consistent dosing.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Peach & Alphonso Mango" },
      { label: "Coating", value: "Light Sugar Dusting" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 38,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689199/momo-eliquid/gummies/momo-peach-mango-100mg-gummy.jpg",
    badge: "Featured",
    featured: false,
    active: true,
    sort_order: 29,
  },
  {
    id: "momo-sour-watermelon-100mg-gummy",
    name: "Momo Sour Watermelon 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Tangy Pink-Label Watermelon Sachet",
    description:
      "Extra-tangy watermelon gummy in pink-logo collector wrap, combining bright green-rind tartness with 100 mg calibrated THC.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Sour Watermelon" },
      { label: "Edition", value: "Pink Sachet Release" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 36,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689204/momo-eliquid/gummies/momo-sour-watermelon-100mg-gummy.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 30,
  },
  {
    id: "momo-grape-berry-100mg-gummy",
    name: "Momo Grape Berry 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Concord Grape & Dark Berry Sachet",
    description:
      "Deep violet sugar-crystal Grape Berry gummy infused with 100 mg THC for rich dark-fruit flavour and steady evening relaxation.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Grape & Wild Berry" },
      { label: "Coating", value: "Purple Sugar Crystal" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 35,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689206/momo-eliquid/gummies/momo-grape-berry-100mg-gummy.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 31,
  },
  {
    id: "momo-sour-apple-100mg-gummy",
    name: "Momo Sour Apple 100mg Mega Gummy",
    category_slug: "gummies",
    meta: "100 mg THC · Sharp Sour Apple & Berry Sachet",
    description:
      "Zingy yellow-and-red Sour Apple 100 mg THC gummy sealed in a bright yellow Momo sachet for crisp orchard sourness.",
    details: [
      { label: "Potency", value: "100 mg THC / sachet" },
      { label: "Flavour", value: "Sour Apple" },
      { label: "Coating", value: "Citric Sugar Coat" },
      { label: "Packaging", value: "Single Sealed Sachet" },
    ],
    price_pence: 2000,
    stock_qty: 40,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689204/momo-eliquid/gummies/momo-sour-apple-100mg-gummy.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 32,
  },
  {
    id: "momo-sour-belts-3000mg",
    name: "Momo Sour Belts — 3000mg Pack",
    category_slug: "gummies",
    meta: "3,000 mg THC per pack · 10 Infused Sour Belts",
    description:
      "High-potency cannabis-infused Sour Belts available in Green Apple and Watermelon — 10 heavy-hitting 300 mg belts (3,000 mg total per pouch).",
    details: [
      { label: "Total Potency", value: "3,000 mg THC" },
      { label: "Pack Size", value: "10 Sour Belts (300 mg each)" },
      { label: "Flavours", value: "Watermelon & Green Apple" },
      { label: "Strength", value: "Experienced Adults Only" },
    ],
    price_pence: 6500,
    stock_qty: 18,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689213/momo-eliquid/gummies/momo-sour-belts-3000mg.jpg",
    badge: "Featured",
    featured: true,
    active: true,
    sort_order: 33,
  },
  {
    id: "momo-kush-500g-mylar-pack",
    name: "Momo Kush Reserve — 500g Sealed Pack",
    category_slug: "kush",
    meta: "500 g Bulk Mylar · Dense Hand-Trimmed Flower",
    description:
      "Half-kilo clear-front heat-sealed Momo reserve pouch filled with dense, resinous indica-leaning buds trimmed and cured for wholesale freshness.",
    details: [
      { label: "Net Weight", value: "500 g" },
      { label: "Packaging", value: "Heat-Sealed Clear Mylar" },
      { label: "Potency", value: "25%–27% THC" },
      { label: "Grade", value: "Reserve Wholesale" },
    ],
    price_pence: 120000,
    stock_qty: 12,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689209/momo-eliquid/kush/momo-kush-500g-mylar-pack.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 34,
  },
  {
    id: "momo-kush-250g-mylar-pack",
    name: "Momo Kush Reserve — 250g Sealed Pack",
    category_slug: "kush",
    meta: "250 g Quarter-Kilo Mylar · Frosty Craft Buds",
    description:
      "Quarter-kilo heat-sealed Momo mylar pack bursting with aromatic, tightly manicured kush flower ideal for multi-ounce stockups.",
    details: [
      { label: "Net Weight", value: "250 g" },
      { label: "Packaging", value: "Heat-Sealed Clear Mylar" },
      { label: "Potency", value: "25%–27% THC" },
      { label: "Grade", value: "Reserve Quarter-Kilo" },
    ],
    price_pence: 65000,
    stock_qty: 15,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689220/momo-eliquid/kush/momo-kush-250g-mylar-pack.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 35,
  },
  {
    id: "momo-express-small-batch-28g",
    name: "Momo Express Small-Batch Kush — 28g",
    category_slug: "kush",
    meta: "28 g (1 oz) · Hybrid-Indica · Sticky Gas & Citrus",
    description:
      "Full ounce of dense, olive-and-amber small-batch buds cured with sharp petrol, pine, and sweet citrus aromatics.",
    details: [
      { label: "Weight", value: "28 g (1 oz)" },
      { label: "Type", value: "Indica-Hybrid" },
      { label: "Potency", value: "26% THC" },
      { label: "Aroma", value: "Diesel, Pine & Zesty Citrus" },
    ],
    price_pence: 21000,
    stock_qty: 20,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689223/momo-eliquid/kush/momo-express-small-batch-28g.jpg",
    badge: "Featured",
    featured: true,
    active: true,
    sort_order: 36,
  },
  {
    id: "momo-purple-frost-indica-14g",
    name: "Momo Purple Frost Indica — 14g",
    category_slug: "kush",
    meta: "14 g (Half Oz) · Exotic Purple-Frost Indica · 28% THC",
    description:
      "Close-trimmed purple-hued top-shelf flower blanketed in milky silver trichomes with rich berry-cream gas notes.",
    details: [
      { label: "Weight", value: "14 g (1/2 oz)" },
      { label: "Type", value: "Exotic Indica" },
      { label: "Potency", value: "28% THC" },
      { label: "Aroma", value: "Sweet Berry Cream & Earth" },
    ],
    price_pence: 11500,
    stock_qty: 18,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689229/momo-eliquid/kush/momo-purple-frost-indica-14g.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 37,
  },
  {
    id: "momo-kush-750g-wholesale-pack",
    name: "Momo Kush Reserve — 750g Wholesale Pack",
    category_slug: "kush",
    meta: "750 g Sealed Pack · Master Batch Flower",
    description:
      "Heavyweight 750 g heat-sealed collector pack weighing out large, uniform emerald buds from Momo's top harvest lots.",
    details: [
      { label: "Net Weight", value: "750 g" },
      { label: "Packaging", value: "Heavy-Duty Sealed Pouch" },
      { label: "Potency", value: "26% THC" },
      { label: "Grade", value: "Master Wholesale Lot" },
    ],
    price_pence: 165000,
    stock_qty: 8,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689222/momo-eliquid/kush/momo-kush-750g-wholesale-pack.jpg",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 38,
  },
  {
    id: "momo-silver-tin-kush-50g",
    name: "Momo Silver Tin Reserve — 50g",
    category_slug: "kush",
    meta: "50 g Pull-Tab Nitrogen Tin · Cured Top-Shelf Buds",
    description:
      "Nitrogen-sealed pull-tab brushed silver Momo tin containing 50 g of fragrant, slow-cured flower locked at peak moisture and terpene density.",
    details: [
      { label: "Net Weight", value: "50 g" },
      { label: "Packaging", value: "Hermetic Pull-Tab Silver Tin" },
      { label: "Potency", value: "26% THC" },
      { label: "Cure", value: "Slow Cold-Cured" },
    ],
    price_pence: 24000,
    stock_qty: 14,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689228/momo-eliquid/kush/momo-silver-tin-kush-50g.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 39,
  },
  {
    id: "momo-silver-tin-kush-100g",
    name: "Momo Silver Tin Reserve — 100g",
    category_slug: "kush",
    meta: "100 g Pull-Tab Nitrogen Tin · Indica-Dominant",
    description:
      "Generous 100 g brushed silver pull-tab Momo tin housing heavy, frosty kush nugs sealed to preserve full pine-and-sweet-earth aroma.",
    details: [
      { label: "Net Weight", value: "100 g" },
      { label: "Packaging", value: "Hermetic Pull-Tab Silver Tin" },
      { label: "Potency", value: "26% THC" },
      { label: "Grade", value: "Select Craft Reserve" },
    ],
    price_pence: 42000,
    stock_qty: 12,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689250/momo-eliquid/kush/momo-silver-tin-kush-100g.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 40,
  },
  {
    id: "momo-cobalt-tin-kush-150g",
    name: "Momo Cobalt Tin Reserve — 150g",
    category_slug: "kush",
    meta: "150 g Collector Blue Tin · High-Potency Exotic",
    description:
      "Signature deep cobalt-blue metal collector tin filled with 150 g of dense, hand-selected exotic kush buds.",
    details: [
      { label: "Net Weight", value: "150 g" },
      { label: "Packaging", value: "Cobalt Blue Collector Tin" },
      { label: "Potency", value: "27% THC" },
      { label: "Grade", value: "Exotic Small-Batch" },
    ],
    price_pence: 56000,
    stock_qty: 10,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689240/momo-eliquid/kush/momo-cobalt-tin-kush-150g.jpg",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 41,
  },
  {
    id: "momo-cobalt-tin-kush-200g",
    name: "Momo Cobalt Tin Reserve — 200g",
    category_slug: "kush",
    meta: "200 g Collector Blue Tin · Vault Batch",
    description:
      "200 g cobalt-blue vault tin overflowing with trichome-rich top colas, sealed tight to protect crisp terpenes until opened.",
    details: [
      { label: "Net Weight", value: "200 g" },
      { label: "Packaging", value: "Cobalt Blue Collector Tin" },
      { label: "Potency", value: "27% THC" },
      { label: "Grade", value: "Vault Batch" },
    ],
    price_pence: 70000,
    stock_qty: 9,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689272/momo-eliquid/kush/momo-cobalt-tin-kush-200g.jpg",
    badge: "Limited stock",
    featured: false,
    active: true,
    sort_order: 42,
  },
  {
    id: "momo-cobalt-tin-kush-100g",
    name: "Momo Cobalt Tin Reserve — 100g",
    category_slug: "kush",
    meta: "100 g Collector Blue Tin · Cold-Cured Kush",
    description:
      "100 g collector edition in metallic cobalt tin, packed with tight frosty nugs balancing sweet Kush gas with earthy pine depth.",
    details: [
      { label: "Net Weight", value: "100 g" },
      { label: "Packaging", value: "Cobalt Blue Collector Tin" },
      { label: "Potency", value: "27% THC" },
      { label: "Cure", value: "Cold-Cured Exotic" },
    ],
    price_pence: 44000,
    stock_qty: 13,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689261/momo-eliquid/kush/momo-cobalt-tin-kush-100g.jpg",
    badge: "New arrival",
    featured: false,
    active: true,
    sort_order: 43,
  },
  {
    id: "momo-cobalt-tin-kush-50g",
    name: "Momo Cobalt Tin Reserve — 50g",
    category_slug: "kush",
    meta: "50 g Collector Blue Tin · Hand-Trimmed Flower",
    description:
      "Compact 50 g cobalt-blue collector tin packed with fresh-cured crystal-coated buds ready for UK tracked dispatch.",
    details: [
      { label: "Net Weight", value: "50 g" },
      { label: "Packaging", value: "Cobalt Blue Collector Tin" },
      { label: "Potency", value: "27% THC" },
      { label: "Grade", value: "Exotic Craft Flower" },
    ],
    price_pence: 25000,
    stock_qty: 16,
    image:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795689263/momo-eliquid/kush/momo-cobalt-tin-kush-50g.jpg",
    badge: "Available",
    featured: false,
    active: true,
    sort_order: 44,
  },
];

const SEED_ROLES = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description:
      "Full unrestricted access across store overview, catalogs, inventory, roles & permissions, and infrastructure configuration.",
    permissions: [
      "overview.view",
      "orders.read",
      "orders.write",
      "payments.read",
      "payments.write",
      "catalog.read",
      "catalog.write",
      "inventory.read",
      "inventory.write",
      "users.read",
      "users.write",
      "roles.read",
      "roles.write",
      "config.view",
    ],
    is_system: true,
  },
  {
    slug: "admin",
    name: "Admin",
    description:
      "Standard admin account. Permissions must be explicitly granted by a Super Admin.",
    permissions: [],
    is_system: true,
  },
];

const INITIAL_USER_ROLE_MAP = [
  { email: "admin@momoeliquidz.co.uk", role_slug: "super_admin" },
  { email: "manager@momoeliquidz.co.uk", role_slug: "admin" },
];

async function main() {
  loadLocalEnv();

  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "Error: DATABASE_URL_UNPOOLED or DATABASE_URL is missing in .env.local.",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.catalogs (
        slug TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        short TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'pink',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_slug TEXT NOT NULL REFERENCES public.catalogs(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
        meta TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        details JSONB NOT NULL DEFAULT '[]'::jsonb,
        price_pence INTEGER NOT NULL CHECK (price_pence >= 0),
        stock_qty INTEGER NOT NULL DEFAULT 25 CHECK (stock_qty >= 0),
        image TEXT NOT NULL,
        badge TEXT,
        featured BOOLEAN NOT NULL DEFAULT false,
        active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_slug
        ON public.products (category_slug);
      CREATE INDEX IF NOT EXISTS idx_products_active_sort
        ON public.products (active, sort_order, created_at);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_roles (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_user_roles (
        user_id UUID PRIMARY KEY,
        role_slug TEXT NOT NULL REFERENCES public.admin_roles(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
        assigned_by UUID,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS public.orders_number_seq START WITH 1001;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id BIGSERIAL PRIMARY KEY,
        order_number INTEGER NOT NULL UNIQUE DEFAULT nextval('public.orders_number_seq'),
        access_token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending_payment',
        payment_method TEXT NOT NULL,
        shipping_method TEXT NOT NULL,
        shipping_label TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        shipping_address JSONB NOT NULL,
        billing_address JSONB NOT NULL,
        same_billing BOOLEAN NOT NULL DEFAULT true,
        items JSONB NOT NULL,
        subtotal_pence INTEGER NOT NULL,
        shipping_pence INTEGER NOT NULL,
        total_pence INTEGER NOT NULL,
        order_note TEXT NOT NULL DEFAULT '',
        crypto_currency TEXT,
        crypto_amount TEXT,
        crypto_address TEXT,
        crypto_rate_gbp NUMERIC(18, 6),
        crypto_expires_at TIMESTAMPTZ,
        attribution JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at
        ON public.orders (created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payment_settings (
        id TEXT PRIMARY KEY,
        support_email TEXT NOT NULL DEFAULT 'support@momoeliquidz.co.uk',
        btc_address TEXT NOT NULL DEFAULT '',
        eth_address TEXT NOT NULL DEFAULT '',
        sol_address TEXT NOT NULL DEFAULT '',
        usdt_address TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE public.payment_settings
        ADD COLUMN IF NOT EXISTS order_received_subtitle TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gift_card_title TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gift_card_checkout_hint TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gift_card_intro TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gift_card_accepted_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS gift_card_instructions TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS gift_card_closing TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_title TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_checkout_hint TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_instructions TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_account_name TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_sort_code TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS bank_account_number TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS crypto_title TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS crypto_subtitle TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS crypto_important_notice TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS crypto_expiry_minutes INTEGER NOT NULL DEFAULT 120;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_notifications (
        id BIGSERIAL PRIMARY KEY,
        order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
        order_number INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'new_order',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        total_pence INTEGER NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT '',
        read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
        ON public.admin_notifications (created_at DESC);
    `);

    for (const c of SEED_CATALOGS) {
      await client.query(
        `INSERT INTO public.catalogs (slug, label, short, description, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO NOTHING`,
        [c.slug, c.label, c.short, c.description, c.color, c.sort_order],
      );
    }

    for (const p of SEED_PRODUCTS) {
      await client.query(
        `INSERT INTO public.products (
           id, name, category_slug, meta, description, details,
           price_pence, stock_qty, image, badge, featured, active, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.name,
          p.category_slug,
          p.meta,
          p.description,
          JSON.stringify(p.details),
          p.price_pence,
          p.stock_qty,
          p.image,
          p.badge,
          p.featured,
          p.active,
          p.sort_order,
        ],
      );
    }

    for (const role of SEED_ROLES) {
      if (role.slug === "super_admin") {
        await client.query(
          `INSERT INTO public.admin_roles (slug, name, description, permissions, is_system)
           VALUES ($1, $2, $3, $4::jsonb, $5)
           ON CONFLICT (slug) DO UPDATE SET
             permissions = EXCLUDED.permissions,
             is_system = true`,
          [
            role.slug,
            role.name,
            role.description,
            JSON.stringify(role.permissions),
            role.is_system,
          ],
        );
      } else {
        await client.query(
          `INSERT INTO public.admin_roles (slug, name, description, permissions, is_system)
           VALUES ($1, $2, $3, $4::jsonb, $5)
           ON CONFLICT (slug) DO NOTHING`,
          [
            role.slug,
            role.name,
            role.description,
            JSON.stringify(role.permissions),
            role.is_system,
          ],
        );
      }
    }

    for (const mapping of INITIAL_USER_ROLE_MAP) {
      await client.query(
        `INSERT INTO public.admin_user_roles (user_id, role_slug)
         SELECT id, $2
         FROM neon_auth."user"
         WHERE lower(email) = lower($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [mapping.email, mapping.role_slug],
      );
    }

    await client.query("COMMIT");

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM public.catalogs) AS catalog_count,
        (SELECT COUNT(*)::int FROM public.products) AS product_count,
        (SELECT COUNT(*)::int FROM public.admin_roles) AS role_count,
        (SELECT COUNT(*)::int FROM public.admin_user_roles) AS user_role_count
    `);
    console.log("Database schema & seed ready:", counts.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(
    "Fatal error seeding database:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
