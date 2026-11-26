"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminSignOutButton from "@/components/admin-sign-out-button";
import { ArrowIcon } from "@/components/illustrations";
import Pagination, { paginateItems } from "@/components/pagination";
import type { AdminUser } from "@/lib/auth/admin";
import {
  type Category,
  LOW_STOCK_THRESHOLD,
  type Product,
  bgClass,
  formatPrice,
} from "@/lib/catalog";
import {
  type AdminNotification,
  type AdminOrderStats,
  type OrderRecord,
  type PaymentSettings,
  getPaymentLabel,
} from "@/lib/payment";
import {
  type AdminRole,
  type AdminUserRecord,
  hasAnyPermission,
  hasPermission,
} from "@/lib/rbac";
import CatalogTab from "./catalog-tab";
import ConfigTab, { type AdminConfigPayload } from "./config-tab";
import InventoryTab from "./inventory-tab";
import OrdersTab from "./orders-tab";
import PaymentsTab from "./payments-tab";
import RolesTab from "./roles-tab";
import UsersTab from "./users-tab";

export type AdminTabId =
  | "overview"
  | "orders"
  | "payments"
  | "catalog"
  | "inventory"
  | "users"
  | "roles"
  | "config";

const TABS: { id: AdminTabId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Store KPIs & alerts" },
  { id: "orders", label: "Orders", hint: "Incoming orders & status" },
  { id: "payments", label: "Payments", hint: "Payment page copy & wallets" },
  { id: "catalog", label: "Catalog", hint: "Collections & taxonomy" },
  { id: "inventory", label: "Inventory", hint: "Products, pricing & stock" },
  { id: "users", label: "Users", hint: "Accounts, roles & access" },
  { id: "roles", label: "Roles", hint: "Roles & permission matrix" },
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
    case "orders":
      return (
        <svg {...shared}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "payments":
      return (
        <svg {...shared}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" />
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
    case "users":
      return (
        <svg {...shared}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
          case "orders":
            return hasAnyPermission(
              user.permissions,
              ["orders.read", "orders.write"],
              user.isSuperAdmin,
            );
          case "payments":
            return hasAnyPermission(
              user.permissions,
              ["payments.read", "payments.write"],
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
          case "users":
            return hasAnyPermission(
              user.permissions,
              ["users.read", "users.write"],
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [overviewCatalogPage, setOverviewCatalogPage] = useState(1);
  const [overviewLowStockPage, setOverviewLowStockPage] = useState(1);
  const [overviewOrdersPage, setOverviewOrdersPage] = useState(1);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [focusedOrderId, setFocusedOrderId] = useState<number | null>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const latestNotifIdRef = useRef<number | null>(null);
  const [catalogs, setCatalogs] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderStats, setOrderStats] = useState<AdminOrderStats | null>(null);
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);
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

  const canFetchOrders = hasAnyPermission(
    user.permissions,
    ["orders.read", "orders.write"],
    user.isSuperAdmin,
  );
  const canFetchPaymentSettings = hasAnyPermission(
    user.permissions,
    ["payments.read", "payments.write"],
    user.isSuperAdmin,
  );
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
  const canFetchUsersAndRoles = hasAnyPermission(
    user.permissions,
    ["users.read", "roles.read"],
    user.isSuperAdmin,
  );
  const canFetchConfig = hasPermission(
    user.permissions,
    "config.view",
    user.isSuperAdmin,
  );

  const canWriteOrders = hasPermission(
    user.permissions,
    "orders.write",
    user.isSuperAdmin,
  );
  const canWritePayments = hasPermission(
    user.permissions,
    "payments.write",
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
  const canWriteUsers = hasPermission(
    user.permissions,
    "users.write",
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
      !canFetchOrders &&
      !canFetchPaymentSettings &&
      !canFetchCatalogs &&
      !canFetchProducts &&
      !canFetchUsersAndRoles &&
      !canFetchConfig &&
      !user.isSuperAdmin
    ) {
      return {
        orders: [] as OrderRecord[],
        orderStats: null as AdminOrderStats | null,
        paymentSettings: null as PaymentSettings | null,
        catalogs: [] as Category[],
        products: [] as Product[],
        roles: [] as AdminRole[],
        users: [] as AdminUserRecord[],
        config: null as AdminConfigPayload | null,
        notifications: [] as AdminNotification[],
        unreadCount: 0,
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

    const [
      ordersJson,
      payJson,
      catJson,
      prodJson,
      rolesJson,
      usersJson,
      cfgJson,
      notifJson,
    ] = await Promise.all([
      canFetchOrders
        ? (fetchJson("/api/admin/orders") as Promise<{
            orders?: OrderRecord[];
            stats?: AdminOrderStats;
          } | null>)
        : Promise.resolve(null),
      canFetchPaymentSettings
        ? (fetchJson("/api/admin/payment-settings") as Promise<{
            paymentSettings?: PaymentSettings;
          } | null>)
        : Promise.resolve(null),
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
      canFetchUsersAndRoles
        ? (fetchJson("/api/admin/roles") as Promise<{
            roles?: AdminRole[];
          } | null>)
        : Promise.resolve(null),
      canFetchUsersAndRoles
        ? (fetchJson("/api/admin/users") as Promise<{
            users?: AdminUserRecord[];
          } | null>)
        : Promise.resolve(null),
      canFetchConfig
        ? (fetchJson("/api/admin/config") as Promise<AdminConfigPayload | null>)
        : Promise.resolve(null),
      user.isSuperAdmin
        ? (fetchJson("/api/admin/notifications") as Promise<{
            notifications?: AdminNotification[];
            unreadCount?: number;
          } | null>)
        : Promise.resolve(null),
    ]);

    if (
      (canFetchOrders && !ordersJson) ||
      (canFetchPaymentSettings && !payJson) ||
      (canFetchCatalogs && !catJson) ||
      (canFetchProducts && !prodJson) ||
      (canFetchUsersAndRoles && (!rolesJson || !usersJson)) ||
      (canFetchConfig && !cfgJson)
    ) {
      return null;
    }

    return {
      orders: Array.isArray(ordersJson?.orders) ? ordersJson.orders : [],
      orderStats: ordersJson?.stats ?? null,
      paymentSettings: payJson?.paymentSettings ?? null,
      catalogs: Array.isArray(catJson?.catalogs) ? catJson.catalogs : [],
      products: Array.isArray(prodJson?.products) ? prodJson.products : [],
      roles: Array.isArray(rolesJson?.roles) ? rolesJson.roles : [],
      users: Array.isArray(usersJson?.users) ? usersJson.users : [],
      config: cfgJson,
      notifications: Array.isArray(notifJson?.notifications)
        ? notifJson.notifications
        : [],
      unreadCount: Number(notifJson?.unreadCount ?? 0),
    };
  }, [
    canFetchOrders,
    canFetchPaymentSettings,
    canFetchCatalogs,
    canFetchProducts,
    canFetchUsersAndRoles,
    canFetchConfig,
    user.isSuperAdmin,
  ]);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await loadAll();
      if (!data) {
        onFlash("error", "Unable to refresh one or more admin API endpoints.");
        return;
      }
      setOrders(data.orders);
      setOrderStats(data.orderStats);
      setPaymentSettings(data.paymentSettings);
      setCatalogs(data.catalogs);
      setProducts(data.products);
      setRoles(data.roles);
      setUsers(data.users);
      setConfig(data.config);
      setNotifications(data.notifications);
      setUnreadNotifCount(data.unreadCount);
      latestNotifIdRef.current = data.notifications[0]?.id ?? null;
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
        setOrders(data.orders);
        setOrderStats(data.orderStats);
        setPaymentSettings(data.paymentSettings);
        setCatalogs(data.catalogs);
        setProducts(data.products);
        setRoles(data.roles);
        setUsers(data.users);
        setConfig(data.config);
        setNotifications(data.notifications);
        setUnreadNotifCount(data.unreadCount);
        latestNotifIdRef.current = data.notifications[0]?.id ?? null;
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

  useEffect(() => {
    if (!user.isSuperAdmin) return;
    let active = true;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/admin/notifications", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok || !active) return;
        const json = (await res.json()) as {
          notifications?: AdminNotification[];
          unreadCount?: number;
        };
        const list = Array.isArray(json.notifications) ? json.notifications : [];
        const top = list[0];
        const prevLatestId = latestNotifIdRef.current;

        setNotifications(list);
        setUnreadNotifCount(Number(json.unreadCount ?? 0));

        if (top && prevLatestId !== null && top.id > prevLatestId) {
          latestNotifIdRef.current = top.id;
          onFlash("success", `${top.title} — ${top.message}`);
          void fetchAll();
        } else if (top && prevLatestId === null) {
          latestNotifIdRef.current = top.id;
        }
      } catch {
        // Ignore transient background poll errors.
      }
    }, 20_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user.isSuperAdmin, fetchAll, onFlash]);

  useEffect(() => {
    if (!notifOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [notifOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  function selectTab(tab: AdminTabId) {
    setActiveTab(tab);
    setMobileNavOpen(false);
    setNotifOpen(false);
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

  async function markNotificationRead(id?: number) {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id !== undefined ? { id } : { markAll: true }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        notifications?: AdminNotification[];
        unreadCount?: number;
      };
      if (Array.isArray(json.notifications)) {
        setNotifications(json.notifications);
      }
      if (typeof json.unreadCount === "number") {
        setUnreadNotifCount(json.unreadCount);
      }
    } catch {
      // Ignore transient error.
    }
  }

  function openNotificationOrder(item: AdminNotification) {
    if (!item.read) {
      void markNotificationRead(item.id);
    }
    if (item.orderId) {
      setFocusedOrderId(item.orderId);
    }
    setNotifOpen(false);
    selectTab("orders");
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

  const canOpenOrdersTab = allowedTabs.some((t) => t.id === "orders");
  const canOpenPaymentsTab = allowedTabs.some((t) => t.id === "payments");
  const canOpenCatalogTab = allowedTabs.some((t) => t.id === "catalog");
  const canOpenInventoryTab = allowedTabs.some((t) => t.id === "inventory");
  const pendingOrdersCount =
    (orderStats?.pendingCount ?? 0) + (orderStats?.submittedCount ?? 0);

  const { items: paginatedNotifications, safePage: safeNotifPage } =
    paginateItems(notifications, notifPage, 6);
  const { items: paginatedOverviewCatalogs, safePage: safeOverviewCatalogPage } =
    paginateItems(catalogs, overviewCatalogPage, 5);
  const { items: paginatedLowStock, safePage: safeOverviewLowStockPage } =
    paginateItems(lowStockProducts, overviewLowStockPage, 5);
  const { items: paginatedOverviewOrders, safePage: safeOverviewOrdersPage } =
    paginateItems(orders, overviewOrdersPage, 5);

  function renderSidebarNav(onPick?: () => void) {
    return (
      <>
        <nav
          aria-label="Admin sections"
          className="mt-6 grid grid-cols-1 gap-2 lg:mt-8 lg:gap-2.5"
        >
          {allowedTabs.map((tab) => {
            const isActive = effectiveTab === tab.id;
            const badgeText =
              tab.id === "orders" && canFetchOrders
                ? String(orderStats?.totalOrders ?? orders.length)
                : tab.id === "catalog" && canFetchCatalogs
                  ? String(catalogs.length)
                  : tab.id === "inventory" && canFetchProducts
                    ? String(products.length)
                    : tab.id === "users" && canFetchUsersAndRoles
                      ? String(users.length)
                      : tab.id === "roles" && canFetchUsersAndRoles
                        ? String(roles.length)
                        : undefined;

            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  selectTab(tab.id);
                  onPick?.();
                }}
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
                      className={`block truncate text-[11px] ${
                        isActive ? "text-cream/75" : "text-ink/60"
                      }`}
                    >
                      {tab.hint}
                    </span>
                  </span>
                </span>
                {badgeText !== undefined && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
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

        <div className="mt-auto flex flex-col gap-3 border-t-2 border-ink/15 pt-4">
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
      </>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:border-r-2 lg:border-ink lg:bg-sand lg:p-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-[24px] leading-none font-extrabold tracking-[-0.04em]"
          >
            Momo Eliquid
            <sup className="relative top-[-1.1em] ml-px text-[8px] tracking-normal">
              ®
            </sup>
          </Link>
          <span className="rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.08em] uppercase">
            {user.isSuperAdmin ? "Super Admin" : user.rbacRoleName}
          </span>
        </div>

        {renderSidebarNav()}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
        >
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-10 flex w-[min(86vw,310px)] flex-col overflow-y-auto border-r-2 border-ink bg-sand p-5 shadow-[6px_0_0_var(--color-ink)]">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="text-[22px] leading-none font-extrabold tracking-[-0.04em]"
              >
                Momo Eliquid
                <sup className="relative top-[-1.1em] ml-px text-[8px] tracking-normal">
                  ®
                </sup>
              </Link>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink bg-white text-sm font-extrabold"
              >
                ✕
              </button>
            </div>
            <div className="mt-2.5">
              <span className="inline-block rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.08em] uppercase">
                {user.isSuperAdmin ? "Super Admin" : user.rbacRoleName}
              </span>
            </div>

            {renderSidebarNav(() => setMobileNavOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-cream/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 sm:px-8 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open admin navigation"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-ink bg-white shadow-[2px_2px_0_var(--color-ink)] lg:hidden"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-extrabold tracking-[0.12em] uppercase text-ink/60 sm:text-[11px]">
                  Admin Portal / {activeTabMeta?.label ?? "Restricted"}
                </p>
                <h1 className="truncate text-lg leading-tight font-extrabold tracking-[-0.02em] sm:text-xl">
                  {activeTabMeta?.label ?? "No permissions assigned"}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canOpenOrdersTab &&
                pendingOrdersCount > 0 &&
                effectiveTab !== "orders" && (
                  <button
                    type="button"
                    onClick={() => selectTab("orders")}
                    className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-3 text-[11px] font-extrabold text-ink sm:h-9 sm:px-3.5 sm:text-xs"
                  >
                    {pendingOrdersCount} awaiting
                  </button>
                )}
              {canOpenInventoryTab &&
                lowStockProducts.length > 0 &&
                effectiveTab !== "inventory" && (
                  <button
                    type="button"
                    onClick={() => selectTab("inventory")}
                    className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-pink px-3 text-[11px] font-extrabold text-ink sm:h-9 sm:px-3.5 sm:text-xs"
                  >
                    {lowStockProducts.length} low stock
                  </button>
                )}
              {user.isSuperAdmin && (
                <div ref={notifContainerRef} className="relative">
                  <button
                    type="button"
                    aria-label="Order notifications"
                    aria-expanded={notifOpen}
                    onClick={() =>
                      setNotifOpen((prev) => {
                        if (!prev) setNotifPage(1);
                        return !prev;
                      })
                    }
                    className="relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 text-xs font-extrabold hover:bg-lime sm:h-9 sm:px-3"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {unreadNotifCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-ink bg-pink px-1.5 py-0.5 text-[10px] leading-none font-extrabold text-ink">
                        {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      role="region"
                      aria-label="Super Admin order notifications"
                      className="fixed inset-x-4 top-[66px] z-40 rounded-[24px] border-2 border-ink bg-white p-4 shadow-[6px_6px_0_var(--color-ink)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[360px]"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-3">
                        <div>
                          <p className="text-sm font-extrabold">
                            Order notifications
                          </p>
                          <p className="text-[11px] text-ink/65">
                            {unreadNotifCount > 0
                              ? `${unreadNotifCount} unread alert${unreadNotifCount === 1 ? "" : "s"}`
                              : "All caught up"}
                          </p>
                        </div>
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void markNotificationRead()}
                            className="cursor-pointer rounded-full border border-ink bg-sand px-2.5 py-1 text-[11px] font-extrabold hover:bg-lime"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-ink/65">
                          New order alerts will appear here.
                        </p>
                      ) : (
                        <>
                          <ul className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto pr-0.5">
                            {paginatedNotifications.map((item) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() => openNotificationOrder(item)}
                                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                                    item.read
                                      ? "border-ink/15 bg-cream/40 hover:bg-cream"
                                      : "border-ink bg-lime/35 hover:bg-lime/55"
                                  }`}
                                >
                                  <span
                                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                      item.read ? "bg-ink/25" : "bg-pink ring-2 ring-ink"
                                    }`}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-extrabold text-ink">
                                      {item.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-ink/80">
                                      {item.message}
                                    </span>
                                    <span className="mt-1 block text-[10px] font-semibold text-ink/55">
                                      {new Date(item.createdAt).toLocaleString(
                                        "en-GB",
                                        {
                                          dateStyle: "short",
                                          timeStyle: "short",
                                        },
                                      )}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                          {notifications.length > 6 && (
                            <div className="mt-3 border-t border-ink/15 pt-2.5">
                              <Pagination
                                compact
                                variant="admin"
                                page={safeNotifPage}
                                pageSize={6}
                                totalItems={notifications.length}
                                itemLabel="alerts"
                                onPageChange={setNotifPage}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {allowedTabs.length > 0 && (
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => void fetchAll()}
                  className="inline-flex h-8 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-3 text-[11px] font-bold hover:bg-sand disabled:opacity-60 sm:h-9 sm:px-4 sm:text-xs"
                >
                  {refreshing ? "Syncing…" : "Sync API"}
                </button>
              )}
            </div>
          </div>

          {allowedTabs.length > 0 && (
            <nav
              aria-label="Quick admin tabs"
              className="flex gap-1.5 overflow-x-auto border-t border-ink/15 px-4 py-2 sm:px-8 lg:hidden"
            >
              {allowedTabs.map((tab) => {
                const isActive = effectiveTab === tab.id;
                const badgeText =
                  tab.id === "orders" && canFetchOrders
                    ? String(orderStats?.totalOrders ?? orders.length)
                    : tab.id === "catalog" && canFetchCatalogs
                      ? String(catalogs.length)
                      : tab.id === "inventory" && canFetchProducts
                        ? String(products.length)
                        : tab.id === "users" && canFetchUsersAndRoles
                          ? String(users.length)
                          : tab.id === "roles" && canFetchUsersAndRoles
                            ? String(roles.length)
                            : undefined;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 text-xs font-extrabold whitespace-nowrap ${
                      isActive
                        ? "border-ink bg-ink text-cream"
                        : "border-ink/25 bg-white text-ink"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {badgeText !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-extrabold ${
                          isActive
                            ? "bg-lime text-ink"
                            : "bg-sand text-ink"
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
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
                  className="h-32 animate-pulse rounded-3xl border-2 border-ink/20 bg-sand"
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
                <em className="font-serif text-[1.08em] leading-0 font-normal tracking-[-0.02em]">
                  assigned yet.
                </em>
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink/75">
                Signed in as{" "}
                <strong className="text-ink">{user.email}</strong> (role:{" "}
                <code>{user.rbacRoleName}</code>). Ask a{" "}
                <strong>Super Admin</strong> to grant module permissions to your
                role under <strong>Roles</strong>.
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
                    <em className="font-serif text-[1.08em] leading-0 font-normal tracking-[-0.02em]">
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
                  {canOpenOrdersTab && (
                    <button
                      type="button"
                      onClick={() => selectTab("orders")}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-lime px-4 text-xs font-extrabold text-ink hover:bg-teal"
                    >
                      View orders ({orderStats?.totalOrders ?? orders.length}) →
                    </button>
                  )}
                  {canOpenPaymentsTab && (
                    <button
                      type="button"
                      onClick={() => selectTab("payments")}
                      className="inline-flex h-10 cursor-pointer items-center rounded-full border-2 border-ink bg-white px-4 text-xs font-bold hover:bg-sand"
                    >
                      Payment page content →
                    </button>
                  )}
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
                className="grid grid-cols-2 gap-3.5 sm:gap-5 xl:grid-cols-4"
              >
                <article className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-6 sm:shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/65 sm:text-xs">
                    Catalogs
                  </p>
                  <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em] sm:mt-3 sm:text-4xl">
                    {catalogs.length}
                  </p>
                  <p className="mt-1.5 text-xs text-ink/70 sm:text-sm">
                    {catalogs.map((c) => c.short).join(" · ") || "None"}
                  </p>
                </article>

                <article className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-6 sm:shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/65 sm:text-xs">
                    Products
                  </p>
                  <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em] sm:mt-3 sm:text-4xl">
                    {products.length}
                  </p>
                  <p className="mt-1.5 text-xs text-ink/70 sm:text-sm">
                    {publishedProducts.length} published · {draftProducts.length}{" "}
                    draft
                  </p>
                </article>

                <article className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-6 sm:shadow-[5px_5px_0_var(--color-ink)]">
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/65 sm:text-xs">
                    Total Stock Units
                  </p>
                  <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em] sm:mt-3 sm:text-4xl">
                    {totalUnits}
                  </p>
                  <p className="mt-1.5 text-xs text-ink/70 sm:text-sm">
                    Across all storefront SKUs
                  </p>
                </article>

                <article
                  className={`rounded-3xl border-2 border-ink p-4 shadow-[4px_4px_0_var(--color-ink)] sm:p-6 sm:shadow-[5px_5px_0_var(--color-ink)] ${
                    lowStockProducts.length > 0 ? "bg-pink" : "bg-teal"
                  }`}
                >
                  <p className="text-[11px] font-extrabold tracking-widest uppercase text-ink/80 sm:text-xs">
                    Low Stock Alerts
                  </p>
                  <p className="mt-2.5 text-3xl font-extrabold tracking-[-0.03em] sm:mt-3 sm:text-4xl">
                    {lowStockProducts.length}
                  </p>
                  <p className="mt-1.5 text-xs text-ink/85 sm:text-sm">
                    Products at or below {LOW_STOCK_THRESHOLD} units
                  </p>
                </article>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
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
                    {paginatedOverviewCatalogs.map((c) => (
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
                  {catalogs.length > 5 && (
                    <div className="mt-4 border-t border-ink/15 pt-3">
                      <Pagination
                        compact
                        variant="admin"
                        page={safeOverviewCatalogPage}
                        pageSize={5}
                        totalItems={catalogs.length}
                        itemLabel="catalogs"
                        onPageChange={setOverviewCatalogPage}
                      />
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
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
                    <>
                      <ul className="mt-4 space-y-3">
                        {paginatedLowStock.map((p) => (
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
                      {lowStockProducts.length > 5 && (
                        <div className="mt-4 border-t border-ink/15 pt-3">
                          <Pagination
                            compact
                            variant="admin"
                            page={safeOverviewLowStockPage}
                            pageSize={5}
                            totalItems={lowStockProducts.length}
                            itemLabel="alerts"
                            onPageChange={setOverviewLowStockPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>

              {canFetchOrders && (
                <section className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
                  <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-4">
                    <h3 className="text-lg font-extrabold">
                      Recent storefront orders
                    </h3>
                    {canOpenOrdersTab && (
                      <button
                        type="button"
                        onClick={() => selectTab("orders")}
                        className="cursor-pointer text-xs font-bold underline underline-offset-4"
                      >
                        Open Orders tab
                      </button>
                    )}
                  </div>
                  {orders.length === 0 ? (
                    <p className="mt-4 text-sm text-ink/70">
                      No orders have been placed yet.
                    </p>
                  ) : (
                    <>
                      <ul className="mt-4 space-y-2.5">
                        {paginatedOverviewOrders.map((o) => (
                          <li
                            key={o.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/15 bg-cream/60 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-extrabold">
                                #{o.orderNumber} · {o.shippingAddress.firstName}{" "}
                                {o.shippingAddress.lastName}
                              </p>
                              <p className="text-xs text-ink/65">
                                {getPaymentLabel(o.paymentMethod)} · {o.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold">
                                {formatPrice(o.total)}
                              </p>
                              <p className="text-xs font-bold uppercase text-ink/70">
                                {o.status.replace("_", " ")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {orders.length > 5 && (
                        <div className="mt-4 border-t border-ink/15 pt-3">
                          <Pagination
                            compact
                            variant="admin"
                            page={safeOverviewOrdersPage}
                            pageSize={5}
                            totalItems={orders.length}
                            itemLabel="orders"
                            onPageChange={setOverviewOrdersPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
            </div>
          ) : effectiveTab === "orders" ? (
            <OrdersTab
              key={focusedOrderId ?? "default"}
              orders={orders}
              stats={orderStats}
              canWrite={canWriteOrders}
              focusedOrderId={focusedOrderId}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
          ) : effectiveTab === "payments" ? (
            <PaymentsTab
              settings={paymentSettings}
              canWrite={canWritePayments}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
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
          ) : effectiveTab === "users" ? (
            <UsersTab
              currentUser={user}
              users={users}
              roles={roles}
              canWrite={canWriteUsers}
              onMutated={fetchAll}
              onFlash={onFlash}
            />
          ) : effectiveTab === "roles" ? (
            <RolesTab
              roles={roles}
              users={users}
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
