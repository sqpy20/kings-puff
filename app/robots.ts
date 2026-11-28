import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

const DISALLOWED = ["/admin", "/cart", "/checkout", "/age-gate", "/api/"];

const USER_AGENTS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Applebot-Extended",
  "*",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOWED,
    })),
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
