"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Pagination, { paginateItems } from "@/components/pagination";
import {
  BADGES,
  type Category,
  LOW_STOCK_THRESHOLD,
  type Product,
  type ProductDetailItem,
  bgClass,
  formatPrice,
} from "@/lib/catalog";

type ProductFormState = {
  id: string;
  name: string;
  category: string;
  price: string;
  stockQty: string;
  sortOrder: string;
  badge: string;
  image: string;
  meta: string;
  description: string;
  featured: boolean;
  active: boolean;
  details: ProductDetailItem[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeEmptyForm(defaultCategory: string, nextOrder: number): ProductFormState {
  return {
    id: "",
    name: "",
    category: defaultCategory,
    price: "14.99",
    stockQty: "25",
    sortOrder: String(nextOrder),
    badge: "",
    image: "",
    meta: "",
    description: "",
    featured: false,
    active: true,
    details: [{ label: "Flavour", value: "" }],
  };
}

export default function InventoryTab({
  catalogs,
  products,
  canWrite = true,
  onMutated,
  onFlash,
}: {
  catalogs: Category[];
  products: Product[];
  canWrite?: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "low">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idLockedToName, setIdLockedToName] = useState(true);
  const [form, setForm] = useState<ProductFormState>(() =>
    makeEmptyForm(catalogs[0]?.slug ?? "vapes", products.length + 1),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitPhase, setSubmitPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const saving = submitPhase !== "idle";
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSelectedFile() {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setFormError(null);
  }

  const catalogBySlug = useMemo(
    () => new Map(catalogs.map((c) => [c.slug, c])),
    [catalogs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "draft" && p.active) return false;
      if (statusFilter === "low" && p.stockQty > LOW_STOCK_THRESHOLD) {
        return false;
      }
      if (q) {
        const hay = `${p.name} ${p.id} ${p.meta}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const { items: paginatedProducts, safePage } = paginateItems(
    filtered,
    page,
    pageSize,
  );

  function openCreate() {
    const nextOrder =
      products.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;
    setEditingId(null);
    setIdLockedToName(true);
    clearSelectedFile();
    setForm(makeEmptyForm(catalogs[0]?.slug ?? "vapes", nextOrder));
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setIdLockedToName(false);
    clearSelectedFile();
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price.toFixed(2),
      stockQty: String(product.stockQty),
      sortOrder: String(product.sortOrder),
      badge: product.badge ?? "",
      image: product.image,
      meta: product.meta,
      description: product.description,
      featured: product.featured,
      active: product.active,
      details:
        product.details.length > 0
          ? product.details.map((d) => ({ ...d }))
          : [{ label: "", value: "" }],
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedFile && !form.image.trim()) {
      setFormError("Please select an image file to upload to Cloudinary.");
      return;
    }

    try {
      let imageUrl = form.image.trim();

      if (selectedFile) {
        setSubmitPhase("uploading");
        const uploadBody = new FormData();
        uploadBody.append("file", selectedFile);
        if (form.id.trim()) {
          uploadBody.append("publicId", form.id.trim());
        }

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "same-origin",
          body: uploadBody,
        });
        const uploadJson = (await uploadRes.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };

        if (!uploadRes.ok || !uploadJson.url) {
          setFormError(
            uploadJson.error || `Image upload failed (${uploadRes.status}).`,
          );
          return;
        }
        imageUrl = uploadJson.url;
      }

      setSubmitPhase("saving");

      const payload = {
        id: form.id.trim(),
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        stockQty: Number(form.stockQty),
        sortOrder: Number(form.sortOrder || 0),
        badge: form.badge || null,
        image: imageUrl,
        meta: form.meta.trim(),
        description: form.description.trim(),
        featured: form.featured,
        active: form.active,
        details: form.details.filter(
          (d) => d.label.trim().length > 0 || d.value.trim().length > 0,
        ),
      };

      const url = editingId
        ? `/api/admin/products/${encodeURIComponent(editingId)}`
        : "/api/admin/products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        product?: Product;
      };

      if (!res.ok) {
        setFormError(json.error || `Request failed (${res.status}).`);
        return;
      }

      clearSelectedFile();
      await onMutated();
      setFormOpen(false);
      setEditingId(null);
      onFlash(
        "success",
        editingId
          ? `Updated product "${json.product?.name ?? editingId}".`
          : `Created product "${json.product?.name ?? payload.name}".`,
      );
    } catch {
      setFormError("Network error saving product.");
    } finally {
      setSubmitPhase("idle");
    }
  }

  async function patchProductQuick(
    product: Product,
    patch: Record<string, unknown>,
    successMsg: string,
  ) {
    setBusyId(product.id);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Failed to update "${product.name}".`);
        return;
      }
      await onMutated();
      onFlash("success", successMsg);
    } catch {
      onFlash("error", "Network error updating inventory.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: Product) {
    setBusyId(product.id);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Could not delete "${product.name}".`);
        return;
      }
      setConfirmDelete(null);
      if (editingId === product.id) {
        setFormOpen(false);
        setEditingId(null);
      }
      await onMutated();
      onFlash("success", `Deleted "${product.name}".`);
    } catch {
      onFlash("error", "Network error deleting product.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Products &amp; inventory
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {!canWrite && (
            <span className="rounded-full border-2 border-ink bg-sand px-3.5 py-1 text-xs font-extrabold uppercase">
              Read-only
            </span>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={formOpen ? () => setFormOpen(false) : openCreate}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] transition hover:translate-y-[-1px]"
            >
              {formOpen ? "Close editor" : "+ Add product"}
            </button>
          )}
        </div>
      </div>

      {canWrite && formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border-2 border-ink bg-white p-4 shadow-[5px_5px_0_var(--color-ink)] sm:p-6"
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink/15 pb-4">
            <h3 className="text-lg font-extrabold">
              {editingId ? `Edit product: ${editingId}` : "Add new product"}
            </h3>
            {editingId && (
              <span className="rounded-full border border-ink bg-sand px-3 py-0.5 text-xs font-bold">
                ID locked
              </span>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#c8102e]"
            >
              {formError}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-bold">
              Product name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    ...(idLockedToName && !editingId ? { id: slugify(name) } : {}),
                  }));
                }}
                placeholder="e.g. Tropical Mango Pods"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Product ID (URL slug)
              <input
                type="text"
                required
                disabled={Boolean(editingId)}
                value={form.id}
                onChange={(e) => {
                  setIdLockedToName(false);
                  setForm((prev) => ({ ...prev, id: e.target.value }));
                }}
                placeholder="tropical-mango-pods"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 font-mono text-sm font-medium disabled:opacity-60"
              />
            </label>

            <label className="block text-sm font-bold">
              Catalog
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              >
                {catalogs.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Badge
              <select
                value={form.badge}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, badge: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              >
                <option value="">None</option>
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Price (GBP £)
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Stock quantity
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.stockQty}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stockQty: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Sort order
              <input
                type="number"
                step="1"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Summary line (meta)
              <input
                type="text"
                value={form.meta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, meta: e.target.value }))
                }
                placeholder="60 ml · Raspberry, Grapefruit & Lemon"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-normal"
              />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-ink bg-sand/60 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-white">
                {previewUrl || form.image ? (
                  <Image
                    src={previewUrl || form.image}
                    alt="Product image preview"
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-[11px] font-bold text-ink/45">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-sm font-bold">
                  Product image upload (uploads directly to Cloudinary on submit)
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    disabled={saving}
                    onChange={handleFileChange}
                    className="mt-1.5 block w-full cursor-pointer rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-1 file:text-xs file:font-bold file:text-white"
                  />
                </label>

                {selectedFile ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink/80">
                    <span>
                      Ready for direct upload on submit: {selectedFile.name} (
                      {Math.max(1, Math.round(selectedFile.size / 1024))} KB)
                    </span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="cursor-pointer underline underline-offset-2"
                    >
                      Clear file
                    </button>
                  </div>
                ) : editingId && form.image ? (
                  <p className="truncate font-mono text-xs text-ink/65">
                    Current Cloudinary asset: {form.image}
                  </p>
                ) : (
                  <p className="text-xs text-ink/65">
                    Supports JPEG, PNG, WebP, GIF, or AVIF up to 10 MB.
                  </p>
                )}
              </div>
            </div>
          </div>

          <label className="mt-4 block text-sm font-bold">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="mt-1.5 block w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 py-2.5 text-sm font-normal"
            />
          </label>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Specification rows</span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    details: [...prev.details, { label: "", value: "" }],
                  }))
                }
                className="cursor-pointer rounded-full border border-ink bg-sand px-3 py-1 text-xs font-bold hover:bg-lime"
              >
                + Add spec row
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.details.map((row, idx) => (
                <div key={idx} className="grid gap-2 sm:flex sm:flex-wrap">
                  <input
                    type="text"
                    placeholder="Label (e.g. Volume)"
                    value={row.label}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        details: prev.details.map((item, i) =>
                          i === idx ? { ...item, label: e.target.value } : item,
                        ),
                      }))
                    }
                    className="h-10 min-w-0 rounded-xl border-2 border-ink bg-cream/40 px-3 text-sm sm:min-w-[140px] sm:flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 60 ml)"
                    value={row.value}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        details: prev.details.map((item, i) =>
                          i === idx ? { ...item, value: e.target.value } : item,
                        ),
                      }))
                    }
                    className="h-10 min-w-0 rounded-xl border-2 border-ink bg-cream/40 px-3 text-sm sm:min-w-[180px] sm:flex-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        details: prev.details.filter((_, i) => i !== idx),
                      }))
                    }
                    className="h-10 cursor-pointer rounded-xl border-2 border-ink/30 px-3 text-xs font-bold text-[#c8102e]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-6 border-t border-ink/15 pt-4 text-sm font-bold">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="size-5 accent-ink"
              />
              Published on storefront
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, featured: e.target.checked }))
                }
                className="size-5 accent-ink"
              />
              Featured in homepage lineup
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-ink/15 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                clearSelectedFile();
                setFormOpen(false);
                setEditingId(null);
              }}
              className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-5 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitPhase === "uploading"
                ? "Uploading image…"
                : submitPhase === "saving"
                  ? "Saving product…"
                  : editingId
                    ? "Save product changes"
                    : "Create product"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-2.5 rounded-[20px] border-2 border-ink bg-sand p-3.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
        <input
          type="search"
          aria-label="Search products"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, ID, or specs…"
          className="h-10 w-full rounded-xl border-2 border-ink bg-white px-3.5 text-sm placeholder:text-ink/45 sm:min-w-[220px] sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
          <select
            aria-label="Filter by catalog"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold"
          >
            <option value="all">All catalogs</option>
            {catalogs.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "draft" | "low");
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold"
          >
            <option value="all">All statuses</option>
            <option value="active">Published only</option>
            <option value="draft">Draft / hidden</option>
            <option value="low">Low stock (&le; {LOW_STOCK_THRESHOLD})</option>
          </select>
        </div>
      </div>

      {/* Mobile product cards */}
      <div className="space-y-3 md:hidden">
        {paginatedProducts.map((product) => {
          const cat = catalogBySlug.get(product.category);
          const color = cat?.color ?? product.categoryColor ?? "pink";
          const isBusy = busyId === product.id;
          const isLow = product.stockQty <= LOW_STOCK_THRESHOLD;

          return (
            <article
              key={product.id}
              className="rounded-[22px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink ${bgClass[color]}`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="56px"
                    unoptimized={product.image.startsWith("http")}
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold leading-snug text-ink">
                      {product.name}
                    </p>
                    <span className="shrink-0 text-sm font-extrabold">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink/60">
                    {product.id}
                  </p>
                  {product.meta && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink/70">
                      {product.meta}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-bold ${bgClass[color]} ${color === "purple" || color === "ink"
                      ? "text-white"
                      : "text-ink"
                      }`}
                  >
                    {cat?.label ?? product.categoryLabel ?? product.category}
                  </span>
                  <button
                    type="button"
                    disabled={!canWrite || isBusy}
                    onClick={() =>
                      patchProductQuick(
                        product,
                        { active: !product.active },
                        `${product.active ? "Unpublished" : "Published"} "${product.name}".`,
                      )
                    }
                    className={`inline-flex h-7 cursor-pointer items-center rounded-full border border-ink px-2.5 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-70 ${product.active
                      ? "bg-teal text-ink"
                      : "bg-sand text-ink/70"
                      }`}
                  >
                    {product.active ? "Published" : "Draft"}
                  </button>
                  {product.featured && (
                    <span className="inline-flex h-7 items-center rounded-full border border-ink bg-lime px-2.5 text-[11px] font-bold">
                      Featured
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!canWrite || isBusy || product.stockQty <= 0}
                    aria-label={`Decrease stock for ${product.name}`}
                    onClick={() =>
                      patchProductQuick(
                        product,
                        { stockQty: Math.max(0, product.stockQty - 1) },
                        `Decreased stock for "${product.name}" to ${Math.max(0, product.stockQty - 1)}.`,
                      )
                    }
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border-2 border-ink bg-white font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span
                    className={`min-w-[44px] rounded-lg border border-ink px-2 py-0.5 text-center text-xs font-extrabold ${isLow ? "bg-pink text-ink" : "bg-white text-ink"
                      }`}
                  >
                    {product.stockQty}
                  </span>
                  <button
                    type="button"
                    disabled={!canWrite || isBusy}
                    aria-label={`Increase stock for ${product.name}`}
                    onClick={() =>
                      patchProductQuick(
                        product,
                        { stockQty: product.stockQty + 1 },
                        `Increased stock for "${product.name}" to ${product.stockQty + 1}.`,
                      )
                    }
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border-2 border-ink bg-white font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3.5 text-xs font-bold hover:bg-lime"
                  >
                    Edit
                  </button>
                )}
                {product.active && (
                  <a
                    href={`/products/${product.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-full border-2 border-ink bg-white px-3.5 text-xs font-bold hover:bg-sand"
                  >
                    View ↗
                  </a>
                )}
                {canWrite &&
                  (confirmDelete === product.id ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(product)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3.5 text-xs font-bold text-white"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(product.id)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3.5 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                    >
                      Delete
                    </button>
                  ))}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 ? (
          <div className="rounded-[22px] border-2 border-ink bg-white p-8 text-center text-sm text-ink/60">
            No products match the active filter criteria.
          </div>
        ) : (
          <div className="rounded-[20px] border-2 border-ink bg-white p-3.5 shadow-[4px_4px_0_var(--color-ink)]">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={filtered.length}
              itemLabel="products"
              pageSizeOptions={[10, 20, 50]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Desktop product table */}
      <div className="hidden rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Catalog</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Visibility</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {paginatedProducts.map((product) => {
                const cat = catalogBySlug.get(product.category);
                const color = cat?.color ?? product.categoryColor ?? "pink";
                const isBusy = busyId === product.id;
                const isLow = product.stockQty <= LOW_STOCK_THRESHOLD;

                return (
                  <tr key={product.id} className="hover:bg-cream/50">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative size-12 shrink-0 overflow-hidden rounded-xl border-2 border-ink ${bgClass[color]}`}
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="48px"
                            unoptimized={product.image.startsWith("http")}
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-ink/65">
                            <code>{product.id}</code>
                            {product.meta ? ` · ${product.meta}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex rounded-full border border-ink px-2.5 py-0.5 text-xs font-bold ${bgClass[color]} ${color === "purple" || color === "ink"
                          ? "text-white"
                          : "text-ink"
                          }`}
                      >
                        {cat?.label ?? product.categoryLabel ?? product.category}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!canWrite || isBusy || product.stockQty <= 0}
                          aria-label={`Decrease stock for ${product.name}`}
                          onClick={() =>
                            patchProductQuick(
                              product,
                              { stockQty: Math.max(0, product.stockQty - 1) },
                              `Decreased stock for "${product.name}" to ${Math.max(0, product.stockQty - 1)}.`,
                            )
                          }
                          className="grid size-7 cursor-pointer place-items-center rounded-lg border-2 border-ink bg-cream font-bold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>
                        <span
                          className={`min-w-[52px] rounded-lg border border-ink px-2 py-0.5 text-center text-xs font-extrabold ${isLow ? "bg-pink text-ink" : "bg-white text-ink"
                            }`}
                        >
                          {product.stockQty}
                        </span>
                        <button
                          type="button"
                          disabled={!canWrite || isBusy}
                          aria-label={`Increase stock for ${product.name}`}
                          onClick={() =>
                            patchProductQuick(
                              product,
                              { stockQty: product.stockQty + 1 },
                              `Increased stock for "${product.name}" to ${product.stockQty + 1}.`,
                            )
                          }
                          className="grid size-7 cursor-pointer place-items-center rounded-lg border-2 border-ink bg-cream font-bold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!canWrite || isBusy}
                          onClick={() =>
                            patchProductQuick(
                              product,
                              { active: !product.active },
                              `${product.active ? "Unpublished" : "Published"} "${product.name}".`,
                            )
                          }
                          className={`inline-flex h-7 cursor-pointer items-center rounded-full border border-ink px-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-70 ${product.active
                            ? "bg-teal text-ink"
                            : "bg-sand text-ink/70"
                            }`}
                        >
                          {product.active ? "Published" : "Draft"}
                        </button>
                        {product.featured && (
                          <span className="inline-flex h-7 items-center rounded-full border border-ink bg-lime px-2.5 text-xs font-bold">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3 text-xs font-bold hover:bg-lime"
                          >
                            Edit
                          </button>
                        )}
                        {product.active && (
                          <a
                            href={`/products/${product.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-sand"
                          >
                            View ↗
                          </a>
                        )}
                        {canWrite && (
                          confirmDelete === product.id ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(product)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3 text-xs font-bold text-white"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(product.id)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                            >
                              Delete
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink/60">
                    No products match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="mt-4 border-t border-ink/15 pt-4">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={filtered.length}
              itemLabel="products"
              pageSizeOptions={[10, 20, 50]}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
