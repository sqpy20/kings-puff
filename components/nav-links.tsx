"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/nav";

export function NavLinkList({ pathname }: { pathname?: string }) {
  return (
    <nav className="hidden gap-[35px] md:flex">
      {navLinks.map((l) => {
        const active = pathname !== undefined && l.match(pathname);
        return (
          <Link
            key={l.label}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 pb-[5px] text-lg leading-6 font-semibold ${
              active ? "border-ink" : "border-transparent"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop nav links with the current page underlined. */
export default function NavLinks() {
  return <NavLinkList pathname={usePathname()} />;
}
