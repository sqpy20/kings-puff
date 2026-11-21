import type { Metadata } from "next";
import Link from "next/link";
import GateCard, {
  gatePrimaryButton,
  gateSecondaryButton,
} from "@/components/gate-card";

export const metadata: Metadata = {
  title: "Are you 18 or older?",
  robots: { index: false, follow: false },
};

export default function AgeGate() {
  return (
    <GateCard
      title="Are you"
      accent="21 or older?"
      actions={
        <>
          <Link href="/" className={gatePrimaryButton}>
            Yes, I&apos;m 21+
          </Link>
          {/* Not wired up yet: decide where under-21 visitors are sent. */}
          <button type="button" className={gateSecondaryButton}>
            No, I&apos;m not
          </button>
        </>
      }
      note={
        <>
          By entering you agree to our{" "}
          <Link href="#" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          . ID is verified again at checkout.
        </>
      }
    >
      This site sells products that contain THC. You must be of
      legal age in your state to enter.
    </GateCard>
  );
}
