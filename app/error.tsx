"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import GateCard, {
  gatePrimaryButton,
  gateSecondaryButton,
} from "@/components/gate-card";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <GateCard
      title="Something"
      accent="went wrong."
      actions={
        <>
          <button
            type="button"
            onClick={() => retry()}
            className={gatePrimaryButton}
          >
            Try again
          </button>
          <Link href="/" className={gateSecondaryButton}>
            Back to home
          </Link>
        </>
      }
      note="Error 500 · If this keeps happening, please contact us."
    >
      That one&apos;s on us. Give it another go in a moment, or head back to
      the home page.
    </GateCard>
  );
}
