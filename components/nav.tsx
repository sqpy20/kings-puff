import Link from "next/link";
import { Suspense } from "react";
import CartLink from "./cart-link";
import MobileNav from "./mobile-nav";
import NavLinks, { NavLinkList } from "./nav-links";

export default function Nav() {
  return (
    <>
      <div className="flex min-h-12 items-center justify-center bg-ink px-4 py-2 text-center text-sm font-medium sm:text-sm text-red-500">
        Order before 2PM for same-day dispatch!
      </div>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream">
        <div className="shell flex h-17 items-center justify-between md:h-21.75">
          <Link
            href="/"
            className="-translate-y-0.5 text-[26px] leading-none font-extrabold tracking-[-0.04em] md:text-[32px]"
          >
            Momo Eliquid
            <sup className="relative top-[-1.1em] ml-px text-[8px] tracking-normal">
              ®
            </sup>
          </Link>
          {/* usePathname can suspend on unknown dynamic routes; fall back to no highlight. */}
          <Suspense fallback={<NavLinkList />}>
            <NavLinks />
          </Suspense>
          <div className="flex items-center gap-5 md:gap-7.5 xl:mr-2.25">
            <Link href="/shop#search" aria-label="Search products">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" />
              </svg>
            </Link>
            <CartLink />
            <MobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
