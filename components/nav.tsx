import Link from "next/link";
import { Suspense } from "react";
import { navLinks } from "@/lib/nav";
import CartLink from "./cart-link";
import NavLinks, { NavLinkList } from "./nav-links";

export default function Nav() {
  return (
    <>
      <div className="flex min-h-12 items-center justify-center bg-ink px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        21+ only · Shipping to [eligible states] where legal · Free shipping
        over [amount]
      </div>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream">
        <div className="shell flex h-[68px] items-center justify-between md:h-[87px]">
          <Link
            href="/"
            className="-translate-y-0.5 text-[26px] leading-none font-extrabold tracking-[-0.04em] md:text-[32px]"
          >
            Kings Puff
            <sup className="relative -top-[1.1em] ml-px text-[8px] tracking-normal">
              ®
            </sup>
          </Link>
          {/* usePathname can suspend on unknown dynamic routes; fall back to no highlight. */}
          <Suspense fallback={<NavLinkList />}>
            <NavLinks />
          </Suspense>
          <div className="flex items-center gap-5 md:gap-[30px] xl:mr-[9px]">
            <button aria-label="Search" type="button">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" />
              </svg>
            </button>
            <CartLink />
            {/* Mobile menu: <details> so it opens without client JS. */}
            <details className="group md:hidden">
              <summary
                aria-label="Menu"
                className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path
                    className="group-open:hidden"
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                  <path
                    className="hidden group-open:block"
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </summary>
              <nav className="absolute inset-x-0 top-full z-20 flex flex-col border-b border-ink/10 bg-cream px-5 pt-1 pb-4 sm:px-8">
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="border-b border-ink/10 py-3.5 text-lg font-semibold last:border-0"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
