import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminLoginForm from "@/components/admin-login-form";
import { getAdminSession, sanitizeAdminRedirect } from "@/lib/auth/admin";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Admin Login",
  description: "Sign in to the Momo Eliquid store administrator portal.",
  path: "/admin/login",
  noIndex: true,
});

async function AdminLoginGate({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRedirect =
    typeof params.redirectTo === "string"
      ? params.redirectTo
      : typeof params.callbackUrl === "string"
        ? params.callbackUrl
        : typeof params.next === "string"
          ? params.next
          : undefined;
  const redirectTo = sanitizeAdminRedirect(rawRedirect);

  const session = await getAdminSession();
  if (session.authenticated && session.isAdmin) {
    redirect(redirectTo);
  }

  return (
    <AdminLoginForm
      redirectTo={redirectTo}
      signedInNonAdminEmail={
        session.authenticated ? (session.user?.email ?? "") : null
      }
    />
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle,var(--color-pink)_0_36vmax,var(--color-teal)_36vmax_48vmax,var(--color-lime)_48vmax)] p-5">
      <div className="w-full max-w-[490px] rounded-[32px] border-2 border-ink bg-cream px-6 py-10 text-center shadow-[6px_6px_0_var(--color-ink)] sm:px-10 sm:py-11">
        <div className="flex items-center justify-center gap-2.5">
          <p className="text-[28px] leading-none font-extrabold tracking-[-0.04em]">
            Momo Eliquid
            <sup className="relative -top-[1.1em] ml-px text-[8px] tracking-normal">
              ®
            </sup>
          </p>
          <span className="rounded-full border-2 border-ink bg-lime px-3 py-0.5 text-[11px] font-extrabold tracking-[0.08em] uppercase">
            Admin
          </span>
        </div>

        <h1 className="mt-5 text-[36px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[44px]">
          Admin{" "}
          <em className="font-serif text-[1.1em] leading-[0] font-normal tracking-[-0.02em]">
            sign in.
          </em>
        </h1>
        <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-6 text-ink/75">
          Restricted storefront control panel. Sign in with an authorised
          administrator account to continue.
        </p>

        <Suspense
          fallback={
            <div className="mt-7 space-y-5">
              <div className="h-[54px] animate-pulse rounded-xl bg-sand" />
              <div className="h-[54px] animate-pulse rounded-xl bg-sand" />
              <div className="h-[56px] animate-pulse rounded-full bg-sand" />
            </div>
          }
        >
          <AdminLoginGate searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
