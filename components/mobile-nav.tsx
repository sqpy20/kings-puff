"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navLinks } from "@/lib/nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevOverscroll = html.style.overscrollBehavior;
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    function onTouchMove(e: TouchEvent) {
      const nav = navRef.current;
      if (
        nav &&
        e.target instanceof Node &&
        nav.contains(e.target) &&
        nav.scrollHeight > nav.clientHeight
      ) {
        return;
      }
      e.preventDefault();
    }

    function onPopState() {
      setOpen(false);
    }

    const mq = window.matchMedia("(min-width: 768px)");
    function onMediaChange(e: MediaQueryListEvent) {
      if (e.matches) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("popstate", onPopState);
    mq.addEventListener("change", onMediaChange);

    return () => {
      html.style.overflow = prevOverflow;
      html.style.overscrollBehavior = prevOverscroll;
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("popstate", onPopState);
      mq.removeEventListener("change", onMediaChange);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="flex items-center md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full z-10 h-dvh touch-none bg-ink/25"
          />
          <nav
            ref={navRef}
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-full z-20 flex max-h-[calc(100dvh-4.25rem)] flex-col overflow-y-auto overscroll-contain border-b border-ink/10 bg-cream px-5 pt-1 pb-4 sm:px-8"
          >
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/10 py-3.5 text-lg font-semibold last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
