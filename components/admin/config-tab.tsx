"use client";

import type { AdminUser } from "@/lib/auth/admin";
import { formatPrice } from "@/lib/catalog";
import type { AdminDbStats } from "@/lib/db";

export type AdminConfigPayload = {
  user: AdminUser;
  database: AdminDbStats;
  storefront: {
    siteName: string;
    siteUrl: string;
    locale: string;
    freeShippingThreshold: number;
    dispatchCutoff: string;
  };
  infrastructure: {
    authProvider: string;
    databaseDriver: string;
    proxyMatcher: string[];
    robotsDisallow: string[];
    endpoints: {
      public: string[];
      admin: string[];
    };
  };
};

export default function ConfigTab({
  config,
  refreshing,
  onRefresh,
}: {
  config: AdminConfigPayload | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) {
  const db = config?.database;
  const formattedServerTime = db?.serverTime
    ? new Date(db.serverTime).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "UTC",
      })
    : "Unavailable";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[32px]">
            Infrastructure &amp; configuration
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Neon Lakebase Postgres health, Neon Auth identity, backend API
            endpoints, SEO controls, and CLI administration.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => onRefresh()}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white px-5 text-sm font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-lime disabled:opacity-60"
        >
          {refreshing ? "Checking…" : "Refresh health check"}
        </button>
      </div>

      {!config ? (
        <div className="rounded-[24px] border-2 border-ink bg-white p-8 text-center text-sm font-bold">
          Loading infrastructure configuration…
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold">Neon Lakebase Postgres</h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-0.5 text-xs font-extrabold uppercase ${
                    db?.connected ? "bg-teal" : "bg-pink"
                  }`}
                >
                  <span className="size-2 rounded-full bg-ink" />
                  {db?.connected ? "Connected" : "Degraded"}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Neon Branch
                  </dt>
                  <dd className="mt-1 font-mono font-bold">{db?.branch}</dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Database
                  </dt>
                  <dd className="mt-1 font-mono font-bold">{db?.databaseName}</dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Runtime Driver
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {config.infrastructure.databaseDriver}
                  </dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    DB Clock (UTC)
                  </dt>
                  <dd className="mt-1 font-semibold">{formattedServerTime}</dd>
                </div>
                <div className="rounded-xl bg-sand p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Catalog Tables
                  </dt>
                  <dd className="mt-1 font-bold">
                    {db?.catalogCount ?? 0} catalogs · {db?.productCount ?? 0}{" "}
                    products ({db?.activeProductCount ?? 0} live)
                  </dd>
                </div>
                <div className="rounded-xl bg-sand p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Low Stock Flagged
                  </dt>
                  <dd className="mt-1 font-bold">
                    {db?.lowStockCount ?? 0} item(s)
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold">
                  Neon Auth &amp; Security Boundary
                </h3>
                <span className="rounded-full border-2 border-ink bg-lime px-3 py-0.5 text-xs font-extrabold uppercase">
                  Managed Better Auth
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Identity Provider
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {config.infrastructure.authProvider}
                  </dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Signed-in Admin
                  </dt>
                  <dd className="mt-1 truncate font-bold">{config.user.email}</dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Registered Users
                  </dt>
                  <dd className="mt-1 font-bold">
                    {db?.adminUsers ?? 0} admin · {db?.totalUsers ?? 0} total
                  </dd>
                </div>
                <div className="rounded-xl bg-cream p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Active Sessions
                  </dt>
                  <dd className="mt-1 font-bold">{db?.activeSessions ?? 0}</dd>
                </div>
                <div className="col-span-2 rounded-xl bg-sand p-3.5">
                  <dt className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink/60">
                    Next.js 16 Proxy Matcher (proxy.ts)
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-bold">
                    {config.infrastructure.proxyMatcher.join(", ")}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <h3 className="text-lg font-extrabold">
                Storefront &amp; SEO Runtime
              </h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
                  <dt className="text-ink/70">Storefront Name</dt>
                  <dd className="font-bold">{config.storefront.siteName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
                  <dt className="text-ink/70">Canonical Origin</dt>
                  <dd className="font-mono text-xs font-bold">
                    {config.storefront.siteUrl}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
                  <dt className="text-ink/70">Locale</dt>
                  <dd className="font-mono font-bold">
                    {config.storefront.locale}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
                  <dt className="text-ink/70">Free UK Shipping</dt>
                  <dd className="font-bold">
                    {formatPrice(config.storefront.freeShippingThreshold)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
                  <dt className="text-ink/70">Same-day Dispatch</dt>
                  <dd className="font-bold">{config.storefront.dispatchCutoff}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 pt-1">
                  <dt className="text-ink/70">robots.txt Disallow</dt>
                  <dd className="font-mono text-xs font-bold">
                    {config.infrastructure.robotsDisallow.join(", ")}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[24px] border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--color-ink)]">
              <h3 className="text-lg font-extrabold">Backend API Surface</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                    Public Storefront APIs
                  </p>
                  <ul className="mt-2.5 space-y-1.5 font-mono text-xs">
                    {config.infrastructure.endpoints.public.map((ep) => (
                      <li key={ep} className="font-semibold">
                        GET {ep}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-sand p-4">
                  <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                    Admin CRUD &amp; Infra APIs
                  </p>
                  <ul className="mt-2.5 space-y-1.5 font-mono text-xs">
                    {config.infrastructure.endpoints.admin.map((ep) => (
                      <li key={ep} className="font-semibold">
                        {ep}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-[24px] border-2 border-ink bg-sand p-6">
            <h3 className="text-lg font-extrabold">Infrastructure CLI Commands</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-ink/20 bg-white p-4">
                <p className="text-xs font-extrabold uppercase text-ink/65">
                  Create / promote admin
                </p>
                <code className="mt-2 block font-mono text-xs leading-5 break-all">
                  pnpm run admin:create -- --email admin@momoeliquidz.co.uk
                  --password &quot;...&quot;
                </code>
              </div>
              <div className="rounded-2xl border border-ink/20 bg-white p-4">
                <p className="text-xs font-extrabold uppercase text-ink/65">
                  Ensure tables &amp; seed data
                </p>
                <code className="mt-2 block font-mono text-xs leading-5">
                  pnpm run db:seed
                </code>
              </div>
              <div className="rounded-2xl border border-ink/20 bg-white p-4">
                <p className="text-xs font-extrabold uppercase text-ink/65">
                  Disable public sign-up
                </p>
                <code className="mt-2 block font-mono text-xs leading-5 break-all">
                  neon neon-auth config email-password update --disable-sign-up
                  true
                </code>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
