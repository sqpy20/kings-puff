import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

const DISALLOWED = ["/admin", "/cart", "/checkout", "/age-gate", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: DISALLOWED,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: DISALLOWED,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: DISALLOWED,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: DISALLOWED,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
