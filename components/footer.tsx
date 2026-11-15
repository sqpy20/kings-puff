import Link from "next/link";
import { categories } from "@/lib/catalog";

type FooterLink = { label: string; href: string };

const shop: FooterLink[] = categories.map((c) => ({
  label: c.label,
  href: `/shop/${c.slug}`,
}));
const helpHrefs: Record<string, string> = {
  FAQ: "/faq",
  "Contact us": "/faq#contact",
};
const help: FooterLink[] = [
  "FAQ",
  "Shipping & availability",
  "Lab results",
  "Contact us",
  "Instagram",
].map((label) => ({ label, href: helpHrefs[label] ?? "#" }));

function Column({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <div className="pt-[3px]">
      <h3 className="text-[11px] leading-4 font-bold tracking-[0.12em] uppercase">
        {title}
      </h3>
      <ul className="mt-1.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="block py-1 text-[17px] leading-7">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink pt-12 pb-10 text-white lg:pt-[74px] lg:pb-[45px]">
      <div className="shell">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[2.1fr_1fr_1fr] lg:gap-9">
        <div className="col-span-2 lg:col-span-1">
          <div className="text-[36px] leading-none lg:text-[45px] font-extrabold tracking-[-0.04em]">
            Kings Puff
            <sup className="relative -top-[1.6em] ml-px text-[9px] tracking-normal">
              ®
            </sup>
          </div>
          <p className="mt-[18px] text-[17px] leading-7">
            Drops, restocks and colourways first. 21+ only.
          </p>
          <form className="mt-[18px] flex flex-col gap-[9px] min-[480px]:flex-row">
            <input
              type="email"
              placeholder="you@email.com"
              aria-label="Email address"
              className="h-[55px] w-full min-[480px]:w-[300px] rounded-xl border-2 border-white bg-transparent px-[18px] text-lg outline-none placeholder:text-white/45"
            />
            <button
              type="submit"
              className="h-[55px] rounded-full bg-lime px-[25px] text-lg font-bold text-ink"
            >
              Join the court
            </button>
          </form>
        </div>
        <Column title="Shop" items={shop} />
        <Column title="Help" items={help} />
      </div>
      <hr className="mt-11 border-white/20" />
      <p className="mt-[26px] text-sm leading-[22px]">
        <strong>Warning:</strong> Products contain THC. For use only by adults
        21 and older. Keep out of reach of children and pets. Do not drive or
        operate machinery after use. Not for use if pregnant or breastfeeding.
        Backwood wraps are tobacco products. [Add state-required warnings and
        Farm Bill / hemp compliance statement.]
      </p>
      <p className="mt-3.5 text-sm leading-5.5">
        © 2026 Kings Puff. All rights reserved. ·{" "}
        <Link href="#" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="#" className="underline underline-offset-2">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="#" className="underline underline-offset-2">
          Shipping policy
        </Link>
      </p>
      </div>
    </footer>
  );
}
