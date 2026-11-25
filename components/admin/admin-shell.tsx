"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSignOutButton from "@/components/admin-sign-out-button";
import { ArrowIcon } from "@/components/illustrations";
import type { AdminUser } from "@/lib/auth/admin";
import {
  type Category,
  LOW_STOCK_THRESHOLD,
  type Product,
  bgClass,
  formatPrice,
} from "@/lib/catalog";
import {
  type AdminRole,
  type AdminUserRecord,
  hasAnyPermission,
  hasPermission,
} from "@/lib/rbac";
import CatalogTab from "./catalog-tab";
import ConfigTab, { type AdminConfigPayload } from "./config-tab";
import InventoryTab from "./inventory-tab";
import RolesTab from "./roles-tab";

export type AdminTabId =
  | "overview"
  | "catalog"
  | "inventory"
  | "roles"
  | "config";

const TABS: { id: AdminTabId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Store KPIs & alerts" },
  { id: "catalog", label: "Catalog", hint: "Collections & taxonomy" },
  { id: "inventory", label: "Inventory", hint: "Products, pricing & stock" },
  { id: "roles", label: "Roles & Access", hint: "Roles, users & permissions" },
  { id: "config", label: "Config", hint: "Database, auth & infra" },
];

function TabIcon({ id }: { id: AdminTabId }) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "overview":
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "catalog":
      return (
        <svg {...shared}>
          <path d="M4 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...shared}>
          <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
          <path d="M3 7.5 12 12l9-4.5M12 12v9" />
        </svg>
      );
    case "roles":
      return (
        <svg {...shared}>
          <path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3Z" />
          <path d="m9.5 12 1.7 1.7L15 9.8" />
        </svg>
      );
    case "config":
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 7h.01M7 17h.01" />
        </svg>
      );
  }
}

export default function AdminShell({
  user,
  initialTab,
}: {
  user: AdminUser;
  initialTab: AdminTabId;
}) {
  const allowedTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        switch (tab.id) {
          case "overview":
            return hasPermission(
              user.permissions,
              "overview.view",
              user.isSuperAdmin,
            );
          case "catalog":
            return hasAnyPermission(
              user.permissions,
              ["catalog.read", "catalog.write"],
              user.isSuperAdmin,
            );
          case "inventory":
            return hasAnyPermission(
              user.permissions,
              ["inventory.read", "inventory.write"],
              user.isSuperAdmin,
            );
          case "roles":
            return hasAnyPermission(
              user.permissions,
              ["roles.read", "roles.write"],
              user.isSuperAdmin,
            );
          case "config":
            return hasPermission(
              user.permissions,
              "config.view",
              user.isSuperAdmin,
            );
        }
      }),
    [user.permissions, user.isSuperAdmin],
  );

  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);
  const [catalogs, setCatalogs] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [config, setConfig] = useState<AdminConfigPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const effectiveTab: AdminTabId | null = useMemo(() => {
    if (allowedTabs.length === 0) return null;
    return allowedTabs.some((t) => t.id === activeTab)
      ? activeTab
      : allowedTabs[0].id;
  }, [allowedTabs, activeTab]);

  const canFetchCatalogs = hasAnyPermission(
    user.permissions,
    ["catalog.read", "inventory.read", "overview.view"],
    user.isSuperAdmin,
  );
  const canFetchProducts = hasAnyPermission(
    user.permissions,
    ["inventory.read", "overview.view"],
    user.isSuperAdmin,
  );
  const canFetchRolesAndUsers = hasPermission(
    user.permissions,
    "roles.read",
    user.isSuperAdmin,
  );
  const canFetchConfig = hasPermission(
    user.permissions,
    "config.view",
    user.isSuperAdmin,
  );

  const canWriteCatalog = hasPermission(
    user.permissions,
    "catalog.write",
    user.isSuperAdmin,
  );
  const canWriteInventory = hasPermission(
    user.permissions,
    "inventory.write",
    user.isSuperAdmin,
  );
  const canWriteRoles = hasPermission(
    user.permissions,
    "roles.write",
    user.isSuperAdmin,
  );

  const onFlash = useCallback((kind: "success" | "error", text: string) => {
    setFlash({ kind, text });
  }, []);

  const loadAll = useCallback(async () => {
    if (
      !canFetchCatalogs &&
      !canFetchProducts &&
      !canFetchRolesAndUsers &&
      !canFetchConfig
    ) {
      return {
        catalogs: [] as Category[],
        products: [] as Product[],
        roles: [] as AdminRole[],
        users: [] as AdminUserRecord[],
        config: null as AdminConfigPayload | null,
      };
    }

    const fetchJson = async (url: string) => {
      const res = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return null;
      return res.json();
    };

    const [catJson, prodJson, rolesJson, usersJson, cfgJson] =
      await Promise.all([
        canFetchCatalogs
          ? (fetchJson("/api/admin/catalogs") as Promise<{
              catalogs?: Category[];
            } | null>)
          : Promise.resolve(null),
        canFetchProducts
          ? (fetchJson("/api/admin/products") as Promise<{
              products?: Product[];
            } | null>)
          : Promise.resolve(null),
        canFetchRolesAndUsers
          ? (fetchJson("/api/admin/roles") as Promise<{
              roles?: AdminRole[];
            } | null>)
          : Promise.resolve(null),
        canFetchRolesAndUsers
          ? (fetchJson("/api/admin/users") as Promise<{
              users?: AdminUserRecord[];
            } | null>)
          : Promise.resolve(null),
        canFetchConfig
          ? (fetchJson("/api/admin/config") as Promise<AdminConfigPayload | null>)
          : Promise.resolve(null),
      ]);

    if (
      (canFetchCatalogs && !catJson) ||
      (canFetchProducts && !prodJson) ||
      (canFetchRolesAndUsers && (!rolesJson || !usersJson)) ||
      (canFetchConfig && !cfgJson)
    ) {
      return null;
    }

    return {
      catalogs: Array.isArray(catJson?.catalogs) ? catJson.catalogs : [],
      products: Array.isArray(prodJson?.products) ? prodJson.products : [],
      roles: Array.isArray(rolesJson?.roles) ? rolesJson.roles : [],
      users: Array.isArray(usersJson?.users) ? usersJson.users : [],
      config: cfgJson,
    };
  }, [
    canFetchCatalogs,
    canFetchProducts,
    canFetchRolesAndUsers,
    canFetchConfig,
  ]);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await loadAll();
      if (!data) {
        onFlash("error", "Unable to refresh one or more admin API endpoints.");
        return;
      }
      setCatalogs(data.catalogs);
      setProducts(data.products);
      setRoles(data.roles);
      setUsers(data.users);
      setConfig(data.config);
    } catch {
      onFlash("error", "Network error loading admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAll, onFlash]);

  useEffect(() => {
    let active = true;
    loadAll()
      .then((data) => {
        if (!active) return;
        if (!data) {
          onFlash("error", "Unable to load one or more admin API endpoints.");
          return;
        }
        setCatalogs(data.catalogs);
        setProducts(data.products);
        setRoles(data.roles);
        setUsers(data.users);
        setConfig(data.config);
      })
      .catch(() => {
        if (active) onFlash("error", "Network error loading admin data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAll, onFlash]);

  function selectTab(tab: AdminTabId) {
    setActiveTab(tab);
    setFlash(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === allowedTabs[0]?.id || tab === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }

  const publishedProducts = products.filter((p) => p.active);
  const draftProducts = products.filter((p) => !p.active);
  const lowStockProducts = products.filter(
    (p) => p.stockQty <= LOW_STOCK_THRESHOLD,
  );
  const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
  const activeTabMeta = effectiveTab
    ? (allowedTabs.find((t) => t.id === effectiveTab) ?? allowedTabs[0])
    : null;

  const canOpenCatalogTab = allowedTabs.some((t) => t.id === "catalog");
  const canOpenInventoryTab = allowedTabs.some((t) => t.id === "inventory");

  return (
    <div className="min-h-dvh bg-cream text-ink lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b-2 border-ink bg-sand p-5 lg:sticky lg:top-0 lg:h-dvh lg:border-r-2 lg:border-b-0 lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-[24px] leading-none font-extrabold tracking-[-0.04em]"
          >
            Momo Eliquid
            <sup className="relative -top-[1.1em] ml-px text-[8px] tracking-normal">
              ®
            </sup>
          </Link>
          <span className="rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.08em] uppercase">
            {user.isSuperAdmin ? "Super Admin" : user.rbacRoleName}
          </span>
        </div>

        <nav
          aria-label="Admin sections"
          className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-8 lg:grid-cols-1 lg:gap-2.5"
        >
          {allowedTabs.map((tab) => {
            const isActive = effectiveTab === tab.id;
            const badgeText =
              tab.id === "catalog" && canFetchCatalogs
                ? String(catalogs.length)
                : tab.id === "inventory" && canFetchProducts
                  ? String(products.length)
                  : tab.id === "roles" && canFetchRolesAndUsers
                    ? String(roles.length)
                    : undefined;

            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => selectTab(tab.id)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-3 text-left transition ${
                  isActive
                    ? "border-ink bg-ink text-cream shadow-[4px_4px_0_var(--color-lime)]"
                    : "border-transparent bg-cream/70 text-ink hover:border-ink hover:bg-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <TabIcon id={tab.id} />
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-extrabold">
                      {tab.label}
                    </span>
                    <span
                      className={`hidden truncate text-[11px] lg:block ${
                        isActive ? "text-cream/75" : "text-ink/60"
                      }`}
                    >
                      {tab.hint}
                    </span>
                  </span>
                </span>
                {badgeText !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      isActive
                        ? "bg-lime text-ink"
                        : "border border-ink/25 bg-white text-ink"
                    }`}
                  >
                    {badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-5 flex flex-col gap-3 border-t-2 border-ink/15 pt-4 lg:mt-auto">
          <div className="rounded-2xl border-2 border-ink bg-cream px-3.5 py-3">
            <p className="truncate text-sm font-extrabold">
              {user.name || user.email}
            </p>
            <p className="truncate text-xs text-ink/70">
              {user.email} · {user.rbacRoleName}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/shop"
              className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-full border-2 border-ink bg-white px-3 text-xs font-bold hover:bg-lime"
            >
              Storefront
              <ArrowIcon className="size-3.5" />
            </Link>
            <AdminSignOutButton className="flex-1 px-3 text-xs" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 border-b-2 border-ink bg-cream/95 px-5 py-4 backdrop-blur-sm sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-ink/60">
                Admin Portal / {activeTabMeta?.label ?? "Restricted"}
              </p>
              <h1 className="text-xl leading-tight font-extrabold tracking-[-0.02em]">
                {activeTabMeta?.label ?? "No permissions assigned"}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {canOpenInventoryTab &&
                lowStockProducts.length > 0 &&
                effectiveTab !== "inventory" && (
                  <button
                    type="button"
                    onClick={() => selectTab("inventory")}
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-pink px-3.5 text-xs font-extrabold text-ink"
                  >
                    {lowStockProducts.length} low stock
                  </button>
                )}
              {allowedTabs.length > 0 && (
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => void fetchAll()}
                  className="inline-flex h-9 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-4 text-xs font-bold hover:bg-sand disabled:opacity-60"
                >
                  {refreshing ? "Syncing…" : "Sync API"}
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 lg:p-10">
          {flash && (
            <div
              role={flash.kind === "error" ? "alert" : "status"}
              className={`mb-6 flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-bold ${
                flash.kind === "error"
                  ? "border-[#c8102e] bg-[#fff5f6] text-[#c8102e]"
                  : "border-ink bg-lime text-ink"
              }`}
            >
              <span>{flash.text}</span>
              <button
                type="button"
                onClick={() => setFlash(null)}
                className="cursor-pointer text-xs underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-[24px] border-2 border-ink/20 bg-sand"
                />
              ))}
            </div>
          ) : effectiveTab === null ? (
            <div className="mx-auto max-w-xl rounded-[28px] border-2 border-ink bg-white p-8 text-center shadow-[6px_6px_0_var(--color-ink)]">
              <span className="inline-block rounded-full border-2 border-ink bg-sand px-3.5 py-1 text-xs font-extrabold tracking-[0.08em] uppercase">
                {user.rbacRoleName} · 0 permissions
              </span>
              <h2 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.02em]">
                No permissions{" "}
                <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
                  assigned yet.
                </em>
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink/75">
                Signed in as{" "}
                <strong className="text-ink">{user.email}</strong> (role:{" "}
                <code>{user.rbacRoleName}</code>). Ask a{" "}
                <strong>Super Admin</strong> to grant module permissions to your
                role under <strong>Roles &amp; Access</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex h-11 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-5 text-sm font-bold text-ink"
                >
                  Check permissions
                </button>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white"
                >
                  Back to storefront
                </Link>
              </div>
            </div>
          ) : effectiveTab === "overview" ? (
            <div className="space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[42px]">
                    Store{" "}
                    <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
                      overview.
                    </em>
                  </h2>
                  <p className="mt-1.5 text-sm text-ink/70">
                    Live merchandising metrics pulled directly from{" "}
                    <code>/api/admin/catalogs</code> and{" "}
                    <code>/api/admin/products</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canOpenCatalogTab && (
                    <button
                      type="button"
                      onClick={() => selectTab("catalog")}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-4 text-xs font-bold hover:bg-lime"
                    >
                      Manage catalogs →
                    </button>
                  )}
                  {canOpenInventoryTab && (
                    <button
                      type="button"
                      onClick={() => selectTab("inventory")}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full bg-ink px-4 text-xs font-bold text-white"
                    >
                      Manage inventory →
                    </button>
                  )}
                </div>
              </div>

              <section
                aria-label="Store metrics"
                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
              >
                <article className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-xs font-extrabold tracking-[0.1em] uppercase text-ink/65">
                    Catalogs
                  </p>
                  <p className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">
                    {catalogs.length}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/70">
                    {catalogs.map((c) => c.short).join(" · ") || "None"}
                  </p>
                </article>

                <article className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-xs font-extrabold tracking-[0.1em] uppercase text-ink/65">
                    Products
                  </p>
                  <p className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">
                    {products.length}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/70">
                    {publishedProducts.length} published · {draftProducts.length}{" "}
                    draft
                  </p>
                </article>

                <article className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-xs font-extrabold tracking-[0.1em] uppercase text-ink/65">
                    Total Stock Units
                  </p>
                  <p className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">
                    {totalUnits}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/70">
                    Across all storefront SKUs
                  </p>
                </article>

                <article
                  className={`rounded-[24px] border-2 border-ink p-6 shadow-[5px_5px_0_var(--color-ink)] ${
                    lowStockProducts.length > 0 ? "bg-pink" : "bg-teal"
                  }`}
                >
                  <p className="text-xs font-extrabold tracking-[0.1em] uppercase text-ink/80">
                    Low Stock Alerts
                  </p>
                  <p className="mt-3 text-4xl font-extrabold tracking-[-0.03em]">
                    {lowStockProducts.length}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/85">
                    Products at or below {LOW_STOCK_THRESHOLD} units
                  </p>
                </article>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-4">
                    <h3 className="text-lg font-extrabold">
                      Collections snapshot
                    </h3>
                    {canOpenCatalogTab && (
                      <button
                        type="button"
                        onClick={() => selectTab("catalog")}
                        className="cursor-pointer text-xs font-bold underline underline-offset-4"
                      >
                        Open Catalog tab
                      </button>
                    )}
                  </div>
                  <ul className="mt-4 space-y-3">
                    {catalogs.map((c) => (
                      <li
                        key={c.slug}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-cream/60 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`size-4 rounded-full border-2 border-ink ${bgClass[c.color]}`}
                          />
                          <div>
                            <p className="text-sm font-extrabold">{c.label}</p>
                            <p className="text-xs text-ink/60">/{c.slug}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold">
                          {c.productCount ?? 0} SKU
                          {(c.productCount ?? 0) === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-4">
                    <h3 className="text-lg font-extrabold">
                      Stock attention needed
                    </h3>
                    {canOpenInventoryTab && (
                      <button
                        type="button"
                        onClick={() => selectTab("inventory")}
                        className="cursor-pointer text-xs font-bold underline underline-offset-4"
                      >
                        Open Inventory tab
                      </button>
                    )}
                  </div>
                  {lowStockProducts.length === 0 ? (
                    <p className="mt-4 text-sm text-ink/70">
                      All products have healthy stock (&gt;{" "}
                      {LOW_STOCK_THRESHOLD} units).
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {lowStockProducts.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-sand/70 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-extrabold">{p.name}</p>
                            <p className="text-xs text-ink/65">
                              {formatPrice(p.price)} · {p.category}
                            </p>
                          </div>
                          <span className="rounded-full border border-ink bg-pink px-3 py-0.5 text-xs font-extrabold">
                            {p.stockQty} left
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          ) : effectiveTab === "catalog" ? (
            <CatalogTab
              catalogs={catalogs}
              canWrite={canWriteCatalog}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
          ) : effectiveTab === "inventory" ? (
            <InventoryTab
              catalogs={catalogs}
              products={products}
              canWrite={canWriteInventory}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
          ) : effectiveTab === "roles" ? (
            <RolesTab
              roles={roles}
              users={users}
              currentUserId={user.id}
              canWrite={canWriteRoles}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
          ) : (
            <ConfigTab
              config={config}
              refreshing={refreshing}
              onRefresh={fetchAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}
