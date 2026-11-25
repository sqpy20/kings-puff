import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { formatPrice } from "@/lib/catalog";
import { guides } from "@/lib/guides";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export async function GET() {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `- Storefront URL: ${SITE_URL}`,
    "- Dispatch & Delivery: UK orders placed before 2:00 PM Mon-Fri dispatch same day; free standard delivery on orders over £50.",
    "- Sitemap: " + absoluteUrl("/sitemap.xml"),
    "",
    "## Key Pages",
    `- Home: ${absoluteUrl("/")}`,
    `- All Products: ${absoluteUrl("/shop")}`,
    `- Buyer Guides: ${absoluteUrl("/guides")}`,
    `- About & Quality: ${absoluteUrl("/about")}`,
    `- FAQ & Shipping: ${absoluteUrl("/faq")}`,
    `- Press & Partners: ${absoluteUrl("/press")}`,
    "",
    "## Collections",
    ...categories.map(
      (c) =>
        `- ${c.label} (${absoluteUrl(`/shop/${c.slug}`)}): ${c.description}`,
    ),
    "",
    "## Products",
    ...products.map(
      (p) =>
        `- ${p.name} (${formatPrice(p.price)} · ${absoluteUrl(`/products/${p.id}`)}): ${p.meta} — ${p.description}`,
    ),
    "",
    "## UK Buyer Guides",
    ...guides.map(
      (g) =>
        `- ${g.title} (${absoluteUrl(`/guides/${g.slug}`)}): ${g.description}`,
    ),
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
