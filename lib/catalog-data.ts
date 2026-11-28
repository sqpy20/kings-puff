import { cacheLife, cacheTag, revalidatePath, revalidateTag } from "next/cache";
import "server-only";
import type { ColorName } from "@/components/illustrations";
import {
  BADGES,
  type Badge,
  type Category,
  type Product,
  type ProductDetailItem,
  VALID_COLORS,
} from "./catalog";
import { getPool } from "./db";

type CatalogRow = {
  slug: string;
  label: string;
  short: string;
  description: string;
  color: string;
  sort_order: number;
  product_count?: number | string;
};

type ProductRow = {
  id: string;
  name: string;
  category_slug: string;
  meta: string;
  description: string;
  details: unknown;
  price_pence: number;
  stock_qty: number;
  image: string;
  badge: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  category_color?: string | null;
  category_label?: string | null;
};

export class CatalogDataError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toColor(value: string | null | undefined): ColorName {
  if (value && (VALID_COLORS as readonly string[]).includes(value)) {
    return value as ColorName;
  }
  return "pink";
}

function toBadge(value: string | null | undefined): Badge | undefined {
  if (value && (BADGES as readonly string[]).includes(value)) {
    return value as Badge;
  }
  return undefined;
}

function toDetails(raw: unknown): ProductDetailItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ProductDetailItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { label?: unknown; value?: unknown };
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const value = typeof record.value === "string" ? record.value.trim() : "";
    if (label && value) {
      items.push({ label, value });
    }
  }
  return items;
}

function mapCatalogRow(row: CatalogRow): Category {
  return {
    slug: row.slug,
    label: row.label,
    short: row.short,
    description: row.description,
    color: toColor(row.color),
    sortOrder: Number(row.sort_order ?? 0),
    ...(row.product_count !== undefined
      ? { productCount: Number(row.product_count) }
      : {}),
  };
}

function mapProductRow(row: ProductRow): Product {
  const badge = toBadge(row.badge);
  return {
    id: row.id,
    name: row.name,
    category: row.category_slug,
    meta: row.meta,
    description: row.description,
    details: toDetails(row.details),
    price: Number((Number(row.price_pence) / 100).toFixed(2)),
    stockQty: Number(row.stock_qty ?? 0),
    image: row.image,
    ...(badge ? { badge } : {}),
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order ?? 0),
    ...(row.category_color ? { categoryColor: toColor(row.category_color) } : {}),
    ...(row.category_label ? { categoryLabel: row.category_label } : {}),
  };
}

const PRODUCT_SELECT = `
  SELECT
    p.id,
    p.name,
    p.category_slug,
    p.meta,
    p.description,
    p.details,
    p.price_pence,
    p.stock_qty,
    p.image,
    p.badge,
    p.featured,
    p.active,
    p.sort_order,
    c.color AS category_color,
    c.label AS category_label
  FROM public.products p
  LEFT JOIN public.catalogs c ON c.slug = p.category_slug
`;

/** Cached public read of all storefront catalogs ordered by sort priority. */
export async function getCatalogs(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogs");

  const db = getPool();
  const res = await db.query<CatalogRow>(`
    SELECT
      c.slug,
      c.label,
      c.short,
      c.description,
      c.color,
      c.sort_order,
      COUNT(p.id) FILTER (WHERE p.active)::int AS product_count
    FROM public.catalogs c
    LEFT JOIN public.products p ON p.category_slug = c.slug
    GROUP BY c.slug
    ORDER BY c.sort_order ASC, c.label ASC
  `);
  return res.rows.map(mapCatalogRow);
}

/** Cached public read of a single catalog by slug. */
export async function getCatalogBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogs", `catalog:${slug}`);

  const db = getPool();
  const res = await db.query<CatalogRow>(
    `SELECT
       c.slug,
       c.label,
       c.short,
       c.description,
       c.color,
       c.sort_order,
       COUNT(p.id) FILTER (WHERE p.active)::int AS product_count
     FROM public.catalogs c
     LEFT JOIN public.products p ON p.category_slug = c.slug
     WHERE c.slug = $1
     GROUP BY c.slug`,
    [slug],
  );
  return res.rows[0] ? mapCatalogRow(res.rows[0]) : null;
}

/** Cached public read of active storefront products, optionally filtered by category slug. */
export async function getProducts(categorySlug?: string): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  if (categorySlug) {
    cacheTag(`catalog:${categorySlug}`);
  }

  const db = getPool();
  const res = categorySlug
    ? await db.query<ProductRow>(
        `${PRODUCT_SELECT}
         WHERE p.active = true AND p.category_slug = $1
         ORDER BY p.sort_order ASC, p.created_at ASC`,
        [categorySlug],
      )
    : await db.query<ProductRow>(
        `${PRODUCT_SELECT}
         WHERE p.active = true
         ORDER BY p.sort_order ASC, p.created_at ASC`,
      );

  return res.rows.map(mapProductRow);
}

/** Cached public read of an active storefront product by ID. */
export async function getProductById(id: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${id}`);

  const db = getPool();
  const res = await db.query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.id = $1 AND p.active = true`,
    [id],
  );
  return res.rows[0] ? mapProductRow(res.rows[0]) : null;
}

/** Cached public read of featured active storefront products. */
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const safeLimit = Math.max(1, Math.min(24, Math.trunc(limit)));
  const db = getPool();
  const res = await db.query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.active = true
     ORDER BY p.featured DESC, p.sort_order ASC, p.created_at ASC
     LIMIT $1`,
    [safeLimit],
  );
  return res.rows.map(mapProductRow);
}

/** Invalidates Next.js cache tags and storefront routes after catalog/product mutations. */
export function revalidateCatalogCache(target?: {
  catalogSlug?: string;
  productId?: string;
}) {
  revalidateTag("catalogs", { expire: 0 });
  revalidateTag("products", { expire: 0 });
  if (target?.catalogSlug) {
    revalidateTag(`catalog:${target.catalogSlug}`, { expire: 0 });
  }
  if (target?.productId) {
    revalidateTag(`product:${target.productId}`, { expire: 0 });
  }
  revalidatePath("/", "layout");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
}

/** Fresh uncached read of all catalogs (including inactive product counts) for admin UI. */
export async function listAdminCatalogs(): Promise<Category[]> {
  const db = getPool();
  const res = await db.query<CatalogRow>(`
    SELECT
      c.slug,
      c.label,
      c.short,
      c.description,
      c.color,
      c.sort_order,
      COUNT(p.id)::int AS product_count
    FROM public.catalogs c
    LEFT JOIN public.products p ON p.category_slug = c.slug
    GROUP BY c.slug
    ORDER BY c.sort_order ASC, c.label ASC
  `);
  return res.rows.map(mapCatalogRow);
}

/** Fresh uncached read of all products (including drafts) for admin inventory UI. */
export async function listAdminProducts(filters?: {
  category?: string;
  search?: string;
}): Promise<Product[]> {
  const db = getPool();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.category && filters.category.trim()) {
    params.push(filters.category.trim());
    clauses.push(`p.category_slug = $${params.length}`);
  }
  if (filters?.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    clauses.push(
      `(p.name ILIKE $${params.length} OR p.id ILIKE $${params.length} OR p.meta ILIKE $${params.length})`,
    );
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const res = await db.query<ProductRow>(
    `${PRODUCT_SELECT}
     ${where}
     ORDER BY p.sort_order ASC, p.created_at ASC`,
    params,
  );
  return res.rows.map(mapProductRow);
}

function validateSlug(raw: unknown, label: string): string {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!value || value.length > 80 || !SLUG_RE.test(value)) {
    throw new CatalogDataError(
      400,
      `${label} must use lowercase letters, numbers, and hyphens only (e.g. "nic-salts").`,
    );
  }
  return value;
}

function validateText(
  raw: unknown,
  label: string,
  { required = true, max = 200 } = {},
): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (required && !value) {
    throw new CatalogDataError(400, `${label} is required.`);
  }
  if (value.length > max) {
    throw new CatalogDataError(
      400,
      `${label} must be at most ${max} characters.`,
    );
  }
  return value;
}

function validateColor(raw: unknown): ColorName {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!(VALID_COLORS as readonly string[]).includes(value)) {
    throw new CatalogDataError(
      400,
      `Color must be one of: ${VALID_COLORS.join(", ")}.`,
    );
  }
  return value as ColorName;
}

function validateInt(
  raw: unknown,
  label: string,
  { min = 0, max = 100_000, fallback = 0 } = {},
): number {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new CatalogDataError(
      400,
      `${label} must be a whole number between ${min} and ${max}.`,
    );
  }
  return num;
}

function validatePricePence(raw: unknown): number {
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num) || num < 0 || num > 100_000) {
    throw new CatalogDataError(
      400,
      "Price must be a valid amount between £0.00 and £100,000.00.",
    );
  }
  return Math.round(num * 100);
}

function validateImage(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || (!value.startsWith("/") && !value.startsWith("https://"))) {
    throw new CatalogDataError(
      400,
      'Image must be a local path (starting with "/") or HTTPS URL.',
    );
  }
  return value;
}

function validateBadge(raw: unknown): Badge | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (!(BADGES as readonly string[]).includes(value)) {
    throw new CatalogDataError(
      400,
      `Badge must be empty or one of: ${BADGES.join(", ")}.`,
    );
  }
  return value as Badge;
}

function validateProductDetails(raw: unknown): ProductDetailItem[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new CatalogDataError(400, "Details must be a list of label/value specs.");
  }
  const parsed: ProductDetailItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as { label?: unknown; value?: unknown };
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const value = typeof record.value === "string" ? record.value.trim() : "";
    if (!label && !value) continue;
    if (!label || !value) {
      throw new CatalogDataError(
        400,
        "Each spec row must include both a label and a value.",
      );
    }
    parsed.push({ label, value });
  }
  return parsed;
}

function pgCode(err: unknown): string | undefined {
  return err && typeof err === "object" && "code" in err
    ? String((err as { code?: unknown }).code)
    : undefined;
}

export async function createCatalog(input: Record<string, unknown>): Promise<Category> {
  const slug = validateSlug(input.slug, "Catalog slug");
  const label = validateText(input.label, "Label", { max: 80 });
  const short = validateText(input.short ?? label, "Short label", { max: 40 });
  const description = validateText(input.description, "Description", { max: 500 });
  const color = input.color === undefined ? "pink" : validateColor(input.color);
  const sortOrder = validateInt(input.sortOrder, "Sort order", {
    min: -999,
    max: 9999,
    fallback: 0,
  });

  const db = getPool();
  try {
    const res = await db.query<CatalogRow>(
      `INSERT INTO public.catalogs (slug, label, short, description, color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING slug, label, short, description, color, sort_order`,
      [slug, label, short, description, color, sortOrder],
    );
    revalidateCatalogCache({ catalogSlug: slug });
    return { ...mapCatalogRow(res.rows[0]), productCount: 0 };
  } catch (err) {
    if (pgCode(err) === "23505") {
      throw new CatalogDataError(409, `Catalog "${slug}" already exists.`);
    }
    throw err;
  }
}

export async function updateCatalog(
  slugParam: string,
  input: Record<string, unknown>,
): Promise<Category> {
  const slug = validateSlug(slugParam, "Catalog slug");
  const db = getPool();
  const existing = await db.query<CatalogRow>(
    "SELECT slug, label, short, description, color, sort_order FROM public.catalogs WHERE slug = $1",
    [slug],
  );
  if (!existing.rows[0]) {
    throw new CatalogDataError(404, `Catalog "${slug}" not found.`);
  }
  const current = existing.rows[0];

  const label =
    input.label !== undefined
      ? validateText(input.label, "Label", { max: 80 })
      : current.label;
  const short =
    input.short !== undefined
      ? validateText(input.short, "Short label", { max: 40 })
      : current.short;
  const description =
    input.description !== undefined
      ? validateText(input.description, "Description", { max: 500 })
      : current.description;
  const color =
    input.color !== undefined ? validateColor(input.color) : toColor(current.color);
  const sortOrder =
    input.sortOrder !== undefined
      ? validateInt(input.sortOrder, "Sort order", {
          min: -999,
          max: 9999,
          fallback: current.sort_order,
        })
      : current.sort_order;

  await db.query(
    `UPDATE public.catalogs
     SET label = $2, short = $3, description = $4, color = $5, sort_order = $6, updated_at = NOW()
     WHERE slug = $1`,
    [slug, label, short, description, color, sortOrder],
  );

  revalidateCatalogCache({ catalogSlug: slug });
  const refreshed = await listAdminCatalogs();
  const updated = refreshed.find((c) => c.slug === slug);
  if (!updated) {
    throw new CatalogDataError(404, `Catalog "${slug}" not found.`);
  }
  return updated;
}

export async function deleteCatalog(slugParam: string): Promise<{ deleted: string }> {
  const slug = validateSlug(slugParam, "Catalog slug");
  const db = getPool();
  try {
    const res = await db.query(
      "DELETE FROM public.catalogs WHERE slug = $1 RETURNING slug",
      [slug],
    );
    if (res.rowCount === 0) {
      throw new CatalogDataError(404, `Catalog "${slug}" not found.`);
    }
    revalidateCatalogCache({ catalogSlug: slug });
    return { deleted: slug };
  } catch (err) {
    const code = pgCode(err);
    if (code === "23503" || code === "23001") {
      throw new CatalogDataError(
        409,
        "Cannot delete catalog while products are assigned to it. Reassign or remove its products first.",
      );
    }
    throw err;
  }
}

export async function createProduct(input: Record<string, unknown>): Promise<Product> {
  const id = validateSlug(input.id, "Product ID");
  const name = validateText(input.name, "Product name", { max: 140 });
  const category = validateSlug(input.category, "Category");
  const meta = validateText(input.meta ?? "", "Summary metadata", {
    required: false,
    max: 240,
  });
  const description = validateText(input.description ?? "", "Description", {
    required: false,
    max: 2000,
  });
  const details = validateProductDetails(input.details);
  const pricePence = validatePricePence(input.price);
  const stockQty = validateInt(input.stockQty, "Stock quantity", {
    min: 0,
    max: 100_000,
    fallback: 25,
  });
  const image = validateImage(input.image);
  const badge = validateBadge(input.badge);
  const featured = Boolean(input.featured);
  const active = input.active === undefined ? true : Boolean(input.active);
  const sortOrder = validateInt(input.sortOrder, "Sort order", {
    min: -999,
    max: 9999,
    fallback: 0,
  });

  const db = getPool();
  try {
    await db.query(
      `INSERT INTO public.products (
         id, name, category_slug, meta, description, details,
         price_pence, stock_qty, image, badge, featured, active, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        name,
        category,
        meta,
        description,
        JSON.stringify(details),
        pricePence,
        stockQty,
        image,
        badge,
        featured,
        active,
        sortOrder,
      ],
    );
    revalidateCatalogCache({ catalogSlug: category, productId: id });
    const rows = await db.query<ProductRow>(
      `${PRODUCT_SELECT} WHERE p.id = $1`,
      [id],
    );
    return mapProductRow(rows.rows[0]);
  } catch (err) {
    if (pgCode(err) === "23505") {
      throw new CatalogDataError(409, `Product "${id}" already exists.`);
    }
    if (pgCode(err) === "23503") {
      throw new CatalogDataError(400, `Catalog "${category}" does not exist.`);
    }
    throw err;
  }
}

export async function updateProduct(
  idParam: string,
  input: Record<string, unknown>,
): Promise<Product> {
  const id = validateSlug(idParam, "Product ID");
  const db = getPool();
  const existingRes = await db.query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.id = $1`,
    [id],
  );
  if (!existingRes.rows[0]) {
    throw new CatalogDataError(404, `Product "${id}" not found.`);
  }
  const current = existingRes.rows[0];

  const name =
    input.name !== undefined
      ? validateText(input.name, "Product name", { max: 140 })
      : current.name;
  const category =
    input.category !== undefined
      ? validateSlug(input.category, "Category")
      : current.category_slug;
  const meta =
    input.meta !== undefined
      ? validateText(input.meta, "Summary metadata", {
          required: false,
          max: 240,
        })
      : current.meta;
  const description =
    input.description !== undefined
      ? validateText(input.description, "Description", {
          required: false,
          max: 2000,
        })
      : current.description;
  const details =
    input.details !== undefined
      ? validateProductDetails(input.details)
      : toDetails(current.details);
  const pricePence =
    input.price !== undefined
      ? validatePricePence(input.price)
      : current.price_pence;
  const stockQty =
    input.stockQty !== undefined
      ? validateInt(input.stockQty, "Stock quantity", {
          min: 0,
          max: 100_000,
          fallback: current.stock_qty,
        })
      : current.stock_qty;
  const image =
    input.image !== undefined ? validateImage(input.image) : current.image;
  const badge =
    input.badge !== undefined ? validateBadge(input.badge) : toBadge(current.badge) ?? null;
  const featured =
    input.featured !== undefined ? Boolean(input.featured) : current.featured;
  const active =
    input.active !== undefined ? Boolean(input.active) : current.active;
  const sortOrder =
    input.sortOrder !== undefined
      ? validateInt(input.sortOrder, "Sort order", {
          min: -999,
          max: 9999,
          fallback: current.sort_order,
        })
      : current.sort_order;

  try {
    await db.query(
      `UPDATE public.products
       SET name = $2,
           category_slug = $3,
           meta = $4,
           description = $5,
           details = $6::jsonb,
           price_pence = $7,
           stock_qty = $8,
           image = $9,
           badge = $10,
           featured = $11,
           active = $12,
           sort_order = $13,
           updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        name,
        category,
        meta,
        description,
        JSON.stringify(details),
        pricePence,
        stockQty,
        image,
        badge,
        featured,
        active,
        sortOrder,
      ],
    );
    revalidateCatalogCache({ catalogSlug: category, productId: id });
    if (category !== current.category_slug) {
      revalidateCatalogCache({ catalogSlug: current.category_slug, productId: id });
    }
    const updatedRes = await db.query<ProductRow>(
      `${PRODUCT_SELECT} WHERE p.id = $1`,
      [id],
    );
    return mapProductRow(updatedRes.rows[0]);
  } catch (err) {
    if (pgCode(err) === "23503") {
      throw new CatalogDataError(400, `Catalog "${category}" does not exist.`);
    }
    throw err;
  }
}

export async function deleteProduct(idParam: string): Promise<{ deleted: string }> {
  const id = validateSlug(idParam, "Product ID");
  const db = getPool();
  const res = await db.query<{ id: string; category_slug: string }>(
    "DELETE FROM public.products WHERE id = $1 RETURNING id, category_slug",
    [id],
  );
  if (res.rowCount === 0) {
    throw new CatalogDataError(404, `Product "${id}" not found.`);
  }
  revalidateCatalogCache({
    catalogSlug: res.rows[0].category_slug,
    productId: id,
  });
  return { deleted: id };
}

/** Parses a JSON request body object or throws a 400 CatalogDataError. */
export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new CatalogDataError(400, "Invalid JSON request body.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CatalogDataError(400, "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

/** Converts catalog/product domain errors into safe JSON HTTP responses. */
export function catalogErrorResponse(err: unknown): Response {
  if (err instanceof CatalogDataError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
