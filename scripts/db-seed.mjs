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
