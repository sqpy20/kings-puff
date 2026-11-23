"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowIcon } from "@/components/illustrations";
import { authClient } from "@/lib/auth/client";

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybe = err as {
      error?: { message?: unknown };
      message?: unknown;
    };
    if (typeof maybe.error?.message === "string" && maybe.error.message.trim()) {
      return maybe.error.message;
    }
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Invalid email or password.";
}

export default function AdminLoginForm({
  redirectTo,
  signedInNonAdminEmail = null,
}: {
  redirectTo: string;
  signedInNonAdminEmail?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  async function handleSwitchAccount() {
    setSwitchingAccount(true);
    setFormError(null);
    try {
      await authClient.signOut();
    } catch {
      // Refresh anyway so server re-evaluates cookies.
    } finally {
      setSwitchingAccount(false);
      router.refresh();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    const nextEmailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
      ? "Please enter a valid admin email address."
      : null;
    const nextPasswordError =
      password.length === 0 ? "Please enter your password." : null;

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setPending(true);
    try {
      const result = await authClient.signIn.email({
        email: cleanEmail,
        password,
      });

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error
      ) {
        setFormError(extractErrorMessage(result.error));
        setPending(false);
        return;
      }

      const verifyRes = await fetch("/api/admin/session", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (verifyRes.status === 403) {
        await authClient.signOut().catch(() => { });
        setFormError("This account does not have administrator privileges.");
        setPending(false);
        router.refresh();
        return;
      }

      if (!verifyRes.ok) {
        setFormError(
          "Signed in, but could not verify admin permissions. Please try again.",
        );
        setPending(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setFormError(extractErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="mt-7">
      {signedInNonAdminEmail !== null && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border-2 border-ink bg-sand p-4 text-left text-[15px] leading-6"
        >
          <p className="font-bold text-ink">Administrator role required</p>
          <p className="mt-1 text-ink/80">
            Currently signed in as{" "}
            <span className="font-semibold text-ink">
              {signedInNonAdminEmail || "a standard account"}
            </span>
            , which does not have admin access.
          </p>
          <button
            type="button"
            disabled={switchingAccount || pending}
            onClick={handleSwitchAccount}
            className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {switchingAccount ? "Signing out…" : "Sign out & switch account"}
          </button>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border-2 border-[#c8102e] bg-[#fff5f6] px-4 py-3 text-left text-[15px] font-medium text-[#c8102e]"
        >
          {formError}
        </div>
      )}

      <form noValidate onSubmit={onSubmit} className="space-y-5 text-left">
        <label className="block text-[15px] font-bold">
          Admin email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={pending}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            placeholder="[EMAIL_ADDRESS]"
            aria-invalid={emailError ? true : undefined}
            className={`mt-2 block h-[54px] w-full rounded-xl border-2 bg-white px-[18px] text-[17px] font-normal placeholder:text-ink/40 disabled:opacity-60 ${emailError ? "border-[#c8102e]" : "border-ink"
              }`}
          />
          {emailError && (
            <span
              role="alert"
              className="mt-1.5 block text-sm font-medium text-[#c8102e]"
            >
              {emailError}
            </span>
          )}
        </label>

        <div className="block text-[15px] font-bold">
          <label htmlFor="admin-password" className="block">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              disabled={pending}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Enter your password"
              aria-invalid={passwordError ? true : undefined}
              className={`block h-[54px] w-full rounded-xl border-2 bg-white pr-20 pl-[18px] text-[17px] font-normal placeholder:text-ink/40 disabled:opacity-60 ${passwordError ? "border-[#c8102e]" : "border-ink"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={pending}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wide uppercase text-ink/75 hover:bg-sand hover:text-ink disabled:cursor-not-allowed"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError && (
            <span
              role="alert"
              className="mt-1.5 block text-sm font-medium text-[#c8102e]"
            >
              {passwordError}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 text-[17px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in to admin"}
          {!pending && <ArrowIcon className="size-[18px]" />}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-ink/15 pt-5 text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-bold underline-offset-4 hover:underline"
        >
          <ArrowIcon className="size-3.5 rotate-180" />
          Back to storefront
        </Link>
        <span className="text-ink/60">Protected by Neon Auth</span>
      </div>
    </div>
  );
}
