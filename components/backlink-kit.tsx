"use client";

import { useRef, useState } from "react";
import { categories, products } from "@/lib/catalog";
import { SITE_NAME, buildBacklinkSnippets } from "@/lib/seo";

type TargetOption = {
  path: string;
  label: string;
  anchor: string;
};

const targets: TargetOption[] = [
  { path: "/", label: "Homepage", anchor: `${SITE_NAME} — UK Storefront` },
  {
    path: "/shop",
    label: "All Products (/shop)",
    anchor: `Shop all ${SITE_NAME} products`,
  },
  ...categories.map((c) => ({
    path: `/shop/${c.slug}`,
    label: `Category: ${c.label}`,
    anchor: `${c.label} at ${SITE_NAME}`,
  })),
  ...products.map((p) => ({
    path: `/products/${p.id}`,
    label: `Product: ${p.name}`,
    anchor: `${p.name} — ${SITE_NAME}`,
  })),
];

export default function BacklinkKit() {
  const [selectedPath, setSelectedPath] = useState(targets[0].path);
  const [partnerRef, setPartnerRef] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const activeTarget =
    targets.find((t) => t.path === selectedPath) ?? targets[0];
  const cleanRef = partnerRef
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { url, html, markdown } = buildBacklinkSnippets({
    path: activeTarget.path,
    anchorText: activeTarget.anchor,
    ref: cleanRef || undefined,
  });

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable.
    }
  }

  const rows = [
    { key: "url", label: "Direct URL", value: url },
    { key: "html", label: "HTML Backlink", value: html },
    { key: "markdown", label: "Markdown", value: markdown },
  ];

  return (
    <section className="rounded-[28px] bg-white p-6 sm:p-9 lg:p-10">
      <p className="text-[11.5px] leading-4 font-bold tracking-[0.1em] uppercase">
        Backlink generator
      </p>
      <h2 className="mt-3 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[36px]">
        Link directly to any Momo Eliquid page
      </h2>
      <p className="mt-3 max-w-[680px] text-[16px] leading-7 text-[#555]">
        Pick a destination page and add an optional partner or publication tag
        to generate clean, attributable URLs, HTML links, and Markdown citations.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-[15px] font-bold">
          Target page
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="mt-2 block h-[52px] w-full rounded-xl border-2 border-ink bg-white px-4 text-base font-medium"
          >
            {targets.map((t) => (
              <option key={t.path} value={t.path}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[15px] font-bold">
          Partner / source tag (optional)
          <input
            type="text"
            value={partnerRef}
            onChange={(e) => setPartnerRef(e.target.value)}
            placeholder="e.g. your-blog or partner-name"
            className="mt-2 block h-[52px] w-full rounded-xl border-2 border-ink bg-white px-4 text-base font-normal placeholder:text-ink/40"
          />
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div
            key={row.key}
            className="rounded-2xl border-2 border-ink/15 bg-cream/60 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold tracking-[0.08em] text-[#555] uppercase">
                {row.label}
              </span>
              <button
                type="button"
                onClick={() => copy(row.key, row.value)}
                className="inline-flex h-8 cursor-pointer items-center rounded-full bg-ink px-4 text-xs font-bold text-white"
              >
                <span aria-live="polite">
                  {copied === row.key ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              aria-label={row.label}
              value={row.value}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 font-mono text-xs text-ink sm:text-sm"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
