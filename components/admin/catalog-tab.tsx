"use client";

import { type FormEvent, useState } from "react";
import Pagination, { paginateItems } from "@/components/pagination";
import {
  type Category,
  VALID_COLORS,
  bgClass,
} from "@/lib/catalog";

type CatalogFormState = {
  slug: string;
  label: string;
  short: string;
  description: string;
  color: Category["color"];
  sortOrder: string;
};

const EMPTY_FORM: CatalogFormState = {
  slug: "",
  label: "",
  short: "",
  description: "",
  color: "pink",
  sortOrder: "10",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CatalogTab({
  catalogs,
  canWrite = true,
  onMutated,
  onFlash,
}: {
  catalogs: Category[];
  canWrite?: boolean;
  onMutated: () => Promise<void>;
  onFlash: (kind: "success" | "error", text: string) => void;
}) {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [slugLockedToLabel, setSlugLockedToLabel] = useState(true);
  const [form, setForm] = useState<CatalogFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { items: paginatedCatalogs, safePage } = paginateItems(
    catalogs,
    page,
    pageSize,
  );

  function openCreate() {
    setEditingSlug(null);
    setSlugLockedToLabel(true);
    const nextOrder =
      catalogs.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1;
    setForm({ ...EMPTY_FORM, sortOrder: String(nextOrder) });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(catalog: Category) {
    setEditingSlug(catalog.slug);
    setSlugLockedToLabel(false);
    setForm({
      slug: catalog.slug,
      label: catalog.label,
      short: catalog.short,
      description: catalog.description,
      color: catalog.color,
      sortOrder: String(catalog.sortOrder),
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const payload = {
        slug: form.slug.trim(),
        label: form.label.trim(),
        short: form.short.trim() || form.label.trim(),
        description: form.description.trim(),
        color: form.color,
        sortOrder: Number(form.sortOrder || 0),
      };

      const url = editingSlug
        ? `/api/admin/catalogs/${encodeURIComponent(editingSlug)}`
        : "/api/admin/catalogs";
      const method = editingSlug ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        catalog?: Category;
      };

      if (!res.ok) {
        setFormError(json.error || `Request failed (${res.status}).`);
        return;
      }

      await onMutated();
      setFormOpen(false);
      setEditingSlug(null);
      onFlash(
        "success",
        editingSlug
          ? `Updated catalog "${json.catalog?.label ?? editingSlug}".`
          : `Created catalog "${json.catalog?.label ?? payload.label}".`,
      );
    } catch {
      setFormError("Network error saving catalog.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/admin/catalogs/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onFlash("error", json.error || `Could not delete "${slug}".`);
        setConfirmDelete(null);
        return;
      }
      setConfirmDelete(null);
      if (editingSlug === slug) {
        setFormOpen(false);
        setEditingSlug(null);
      }
      await onMutated();
      onFlash("success", `Deleted catalog "${slug}".`);
    } catch {
      onFlash("error", "Network error deleting catalog.");
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Catalogs &amp; collections
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Manage storefront categories stored in Postgres (<code>public.catalogs</code>).
          </p>
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
              {formOpen ? "Close editor" : "+ New catalog"}
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
              {editingSlug ? `Edit catalog: ${editingSlug}` : "Create new catalog"}
            </h3>
            {editingSlug && (
              <span className="rounded-full border border-ink bg-sand px-3 py-0.5 text-xs font-bold">
                Slug locked
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
              Label
              <input
                type="text"
                required
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    label,
                    ...(slugLockedToLabel && !editingSlug
                      ? { slug: slugify(label), short: prev.short || label }
                      : {}),
                  }));
                }}
                placeholder="e.g. Concentrates"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Slug
              <input
                type="text"
                required
                disabled={Boolean(editingSlug)}
                value={form.slug}
                onChange={(e) => {
                  setSlugLockedToLabel(false);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="concentrates"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 font-mono text-sm font-medium disabled:opacity-60"
              />
            </label>

            <label className="block text-sm font-bold">
              Short pill label
              <input
                type="text"
                required
                value={form.short}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, short: e.target.value }))
                }
                placeholder="Concentrates"
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>

            <label className="block text-sm font-bold">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                }
                className="mt-1.5 block h-11 w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 text-sm font-medium"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="block text-sm font-bold">
              Collection description
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe this catalog for collection pages and SEO..."
                className="mt-1.5 block w-full rounded-xl border-2 border-ink bg-cream/40 px-3.5 py-2.5 text-sm font-normal"
              />
            </label>

            <div>
              <span className="block text-sm font-bold">Accent colour</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {VALID_COLORS.map((c) => {
                  const selected = form.color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                      aria-label={`Color ${c}`}
                      aria-pressed={selected}
                      className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink px-3 text-xs font-bold capitalize ${
                        selected
                          ? "bg-ink text-white"
                          : "bg-white text-ink hover:bg-sand"
                      }`}
                    >
                      <span
                        className={`size-3.5 rounded-full border border-ink ${bgClass[c]}`}
                      />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-ink/15 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setFormOpen(false);
                setEditingSlug(null);
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
              {saving
                ? "Saving…"
                : editingSlug
                  ? "Save catalog changes"
                  : "Create catalog"}
            </button>
          </div>
        </form>
      )}

      {/* Mobile catalog cards */}
      <div className="space-y-3 md:hidden">
        {paginatedCatalogs.map((c) => {
          const isDeleting = deletingSlug === c.slug;
          return (
            <article
              key={c.slug}
              className="rounded-[22px] border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border border-ink px-3 py-0.5 text-xs font-bold ${bgClass[c.color]} ${
                      c.color === "purple" || c.color === "ink"
                        ? "text-white"
                        : "text-ink"
                    }`}
                  >
                    {c.label}
                  </span>
                  <code className="text-xs text-ink/65">/{c.slug}</code>
                </div>
                <span className="rounded-full border border-ink/20 bg-cream px-2.5 py-0.5 text-xs font-bold">
                  {c.productCount ?? 0} SKUs
                </span>
              </div>

              <p className="mt-2.5 text-sm leading-5 text-ink/80">
                {c.description}
              </p>

              <p className="mt-2 text-xs text-ink/60">
                Filter pill: <strong>{c.short}</strong> · Sort #{c.sortOrder}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3.5 text-xs font-bold hover:bg-lime"
                  >
                    Edit
                  </button>
                )}
                <a
                  href={`/shop/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-full border-2 border-ink bg-white px-3.5 text-xs font-bold hover:bg-sand"
                >
                  Store ↗
                </a>
                {canWrite &&
                  (confirmDelete === c.slug ? (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(c.slug)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting…" : "Confirm delete"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(c.slug)}
                      className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink/40 bg-white px-3.5 text-xs font-bold text-[#c8102e] hover:border-[#c8102e]"
                    >
                      Delete
                    </button>
                  ))}
              </div>
            </article>
          );
        })}
        {catalogs.length === 0 ? (
          <div className="rounded-[22px] border-2 border-ink bg-white p-8 text-center text-sm text-ink/60">
            No catalogs found in Lakebase Postgres.
          </div>
        ) : (
          <div className="rounded-[20px] border-2 border-ink bg-white p-3.5 shadow-[4px_4px_0_var(--color-ink)]">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={catalogs.length}
              itemLabel="catalogs"
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

      {/* Desktop catalog table */}
      <div className="hidden rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                <th className="py-3 pr-4">Catalog</th>
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4">Products</th>
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {paginatedCatalogs.map((c) => {
                const isDeleting = deletingSlug === c.slug;
                return (
                  <tr key={c.slug} className="align-top hover:bg-cream/50">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex rounded-full border border-ink px-3 py-0.5 text-xs font-bold ${bgClass[c.color]} ${
                            c.color === "purple" || c.color === "ink"
                              ? "text-white"
                              : "text-ink"
                          }`}
                        >
                          {c.label}
                        </span>
                        <code className="text-xs text-ink/65">/{c.slug}</code>
                      </div>
                      <p className="mt-1 text-xs text-ink/60">
                        Filter pill: {c.short}
                      </p>
                    </td>
                    <td className="max-w-md py-4 pr-4 leading-5 text-ink/80">
                      {c.description}
                    </td>
                    <td className="py-4 pr-4 font-bold">
                      {c.productCount ?? 0}
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs">
                      {c.sortOrder}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-cream px-3 text-xs font-bold hover:bg-lime"
                          >
                            Edit
                          </button>
                        )}
                        <a
                          href={`/shop/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-sand"
                        >
                          Store ↗
                        </a>
                        {canWrite && (
                          confirmDelete === c.slug ? (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(c.slug)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-[#c8102e] bg-[#c8102e] px-3 text-xs font-bold text-white disabled:opacity-60"
                            >
                              {isDeleting ? "Deleting…" : "Confirm delete"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(c.slug)}
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
              {catalogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink/60">
                    No catalogs found in Lakebase Postgres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {catalogs.length > 0 && (
          <div className="mt-4 border-t border-ink/15 pt-4">
            <Pagination
              variant="admin"
              page={safePage}
              pageSize={pageSize}
              totalItems={catalogs.length}
              itemLabel="catalogs"
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
