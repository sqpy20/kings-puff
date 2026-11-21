import type { Metadata } from "next";
import Link from "next/link";
import GateCard, { gatePrimaryButton } from "@/components/gate-card";

export const metadata: Metadata = {
  title: "Page not found · Momo Eliquid",
};

export default function NotFound() {
  return (
    <GateCard
      title="Page"
      accent="not found."
      actions={
        <Link href="/" className={gatePrimaryButton}>
          Back to home
        </Link>
      }
      note="Error 404"
    >
      We couldn&apos;t find the page you&apos;re looking for. It may have moved,
      or the link might be wrong.
    </GateCard>
  );
}
