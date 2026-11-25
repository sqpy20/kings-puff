import type { MetadataRoute } from "next";
import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { guides } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

const BASE_LAST_MODIFIED = "2026-11-25T00:00:00.000Z";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/guides"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/press"),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => {
    const lead = products.find((p) => p.category === category.slug);
    return {
      url: absoluteUrl(`/shop/${category.slug}`),
      lastModified: BASE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
      ...(lead ? { images: [absoluteUrl(lead.image)] } : {}),
    };
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.id}`),
    lastModified: BASE_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 0.85,
    images: [absoluteUrl(product.image)],
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: guide.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
    images: [absoluteUrl(guide.image)],
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...guidePages];
}
