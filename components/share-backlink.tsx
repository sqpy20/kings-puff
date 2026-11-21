"use client";

import { useRef, useState } from "react";
import { SITE_NAME, buildBacklinkSnippets } from "@/lib/seo";

export default function ShareBacklink({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { url, html, markdown } = buildBacklinkSnippets({
    path,
    anchorText: `${title} — ${SITE_NAME}`,
  });

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable (insecure context or blocked permission).
    }
  }

  const encodedText = encodeURIComponent(`Check out ${title} at ${SITE_NAME}`);
  const shareTargets = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(buildBacklinkSnippets({ path, anchorText: title, utmSource: "x" }).url)}&text=${encodedText}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${buildBacklinkSnippets({ path, anchorText: title, utmSource: "whatsapp" }).url}`)}`,
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(buildBacklinkSnippets({ path, anchorText: title, utmSource: "reddit" }).url)}&title=${encodedText}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildBacklinkSnippets({ path, anchorText: title, utmSource: "facebook" }).url)}`,
    },
  ];

  const embedRows = [
    { key: "html", label: "HTML backlink", value: html },
    { key: "markdown", label: "Markdown", value: markdown },
  ];

  return (
    <div className="mt-6 rounded-2xl border-2 border-ink/15 bg-cream/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-[0.08em] text-[#555] uppercase">
          Share &amp; link
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {shareTargets.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-full border border-ink/25 bg-white px-3 text-xs font-bold hover:border-ink"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => copyText("url", url)}
            className="inline-flex h-8 cursor-pointer items-center rounded-full bg-ink px-3 text-xs font-bold text-white"
          >
            <span aria-live="polite">
              {copied === "url" ? "Copied!" : "Copy link"}
            </span>
          </button>
        </div>
      </div>

      <details className="mt-3 border-t border-ink/10 pt-2.5">
        <summary className="cursor-pointer text-xs font-bold underline-offset-2 hover:underline">
          Get backlink / embed code
        </summary>
        <div className="mt-3 space-y-2.5">
          {embedRows.map((row) => (
            <div key={row.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-[0.06em] text-[#666] uppercase">
                  {row.label}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(row.key, row.value)}
                  className="cursor-pointer text-xs font-bold underline underline-offset-2"
                >
                  {copied === row.key ? "Copied!" : "Copy"}
                </button>
              </div>
              <input
                type="text"
                readOnly
                aria-label={row.label}
                value={row.value}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-ink/20 bg-white px-2.5 py-1.5 font-mono text-xs text-ink"
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
