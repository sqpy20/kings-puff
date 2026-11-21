import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "@/components/collection-view";
import JsonLd from "@/components/json-ld";
import { categories, getCategory, products } from "@/lib/catalog";
import {
  breadcrumbJsonLd,
  buildMetadata,
  collectionJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) {
    return buildMetadata({
      title: "Shop",
      description: "Browse Momo Eliquid collections.",
      path: "/shop",
    });
  }
  const lead = products.find((p) => p.category === category.slug);
  return buildMetadata({
    title: category.label,
    description: category.description,
    path: `/shop/${category.slug}`,
    image: lead?.image,
    imageAlt: `${category.label} · Momo Eliquid`,
  });
}

export default async function CategoryPage({
  params,
}: PageProps<"/shop/[category]">) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const list = products.filter((p) => p.category === category.slug);
  return (
    <>
      <JsonLd
        data={[
          collectionJsonLd(list, category),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/shop" },
            { name: category.label, path: `/shop/${category.slug}` },
          ]),
        ]}
      />
      <CollectionView category={category} />
    </>
  );
}
