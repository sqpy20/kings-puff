import type { MetadataRoute } from "next";
import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { absoluteUrl } from "@/lib/seo";

const LAST_MODIFIED = "2026-11-21T00:00:00.000Z";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/press"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => {
    const lead = products.find((p) => p.category === category.slug);
    return {
      url: absoluteUrl(`/shop/${category.slug}`),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
      ...(lead ? { images: [absoluteUrl(lead.image)] } : {}),
    };
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.id}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [absoluteUrl(product.image)],
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
