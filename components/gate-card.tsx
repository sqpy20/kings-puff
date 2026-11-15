import type { ReactNode } from "react";

// Shared full-screen template for the age gate and the 404 / 500 pages:
// concentric colour rings behind a centred cream card.
export const gatePrimaryButton =
  "inline-flex h-[55px] shrink-0 cursor-pointer sm:flex-1 items-center justify-center rounded-full border-2 border-pink bg-pink px-6 text-[17px] font-bold";
export const gateSecondaryButton =
  "inline-flex h-[55px] shrink-0 cursor-pointer sm:flex-1 items-center justify-center rounded-full border-2 border-ink px-6 text-[17px] font-bold";

export default function GateCard({
  title,
  accent,
  children,
  actions,
  note,
}: {
  title: string;
  /** Second half of the heading, set in the italic serif. */
  accent: string;
  children: ReactNode;
  actions: ReactNode;
  note: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle,var(--color-pink)_0_36vmax,var(--color-teal)_36vmax_48vmax,var(--color-lime)_48vmax)] p-5">
      <div className="w-full max-w-[565px] rounded-[32px] bg-cream px-6 py-10 text-center sm:px-[60px] sm:py-[60px]">
        <p className="text-[32px] leading-none font-extrabold tracking-[-0.04em]">
          Kings Puff
          <sup className="relative -top-[1.1em] ml-px text-[8px] tracking-normal">
            ®
          </sup>
        </p>
        <h1 className="mt-6 text-[36px] leading-[1.12] font-extrabold tracking-[-0.03em] sm:text-[50px]">
          {title}{" "}
          <em className="font-serif text-[1.1em] leading-[0] font-normal tracking-[-0.02em]">
            {accent}
          </em>
        </h1>
        <p className="mx-auto mt-[26px] max-w-[410px] text-[17px] leading-[27.5px]">
          {children}
        </p>
        <div className="mt-7 flex flex-col gap-3.5 sm:flex-row">{actions}</div>
        <p className="mt-[26px] text-sm leading-[22px]">{note}</p>
      </div>
    </main>
  );
}
