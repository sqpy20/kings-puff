import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminSignOutButton from "@/components/admin-sign-out-button";
import AdminShell, { type AdminTabId } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/auth/admin";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Admin Dashboard",
  description: "Momo Eliquid storefront administration portal.",
  path: "/admin",
  noIndex: true,
});

const VALID_TABS: ReadonlySet<AdminTabId> = new Set([
  "overview",
  "catalog",
  "inventory",
  "users",
  "roles",
  "config",
]);

function resolveTab(raw: string | string[] | undefined): AdminTabId {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (candidate && VALID_TABS.has(candidate as AdminTabId)) {
    return candidate as AdminTabId;
  }
  return "overview";
}

async function AdminDashboardContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, resolvedParams] = await Promise.all([
    getAdminSession(),
    searchParams,
  ]);

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (!session.isAdmin || !session.user) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle,var(--color-pink)_0_36vmax,var(--color-teal)_36vmax_48vmax,var(--color-lime)_48vmax)] p-5">
        <div className="w-full max-w-[520px] rounded-[32px] border-2 border-ink bg-cream px-6 py-10 text-center shadow-[6px_6px_0_var(--color-ink)] sm:px-10 sm:py-12">
          <span className="inline-block rounded-full border-2 border-ink bg-pink px-3.5 py-1 text-xs font-extrabold tracking-[0.08em] uppercase text-ink">
            403 · Access Denied
          </span>
          <h1 className="mt-5 text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[42px]">
            Admin role{" "}
            <em className="font-serif text-[1.1em] leading-[0] font-normal tracking-[-0.02em]">
              required.
            </em>
          </h1>
          <p className="mt-4 text-[16px] leading-6 text-ink/80">
            Signed in as{" "}
            <span className="font-bold text-ink">
              {session.user?.email || "current user"}
            </span>{" "}
            (role: <code>{session.user?.role ?? "user"}</code>). Only accounts
            with the <code>admin</code> role may open this portal.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <AdminSignOutButton className="h-12 px-6" />
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-white"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      user={session.user}
      initialTab={resolveTab(resolvedParams.tab)}
    />
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-cream p-6">
          <div className="w-full max-w-md rounded-[28px] border-2 border-ink bg-white p-8 text-center shadow-[6px_6px_0_var(--color-ink)]">
            <p className="text-lg font-bold">Loading admin workspace…</p>
          </div>
        </main>
      }
    >
      <AdminDashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
