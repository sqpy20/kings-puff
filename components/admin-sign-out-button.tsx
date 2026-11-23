"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function AdminSignOutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
    } catch {
      // Redirect anyway so proxy/server re-validates session state.
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleSignOut}
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white px-5 text-sm font-bold text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
