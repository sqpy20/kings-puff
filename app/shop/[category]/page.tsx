import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CollectionView from "@/components/collection-view";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import { getCatalogBySlug, getCatalogs, getProducts } from "@/lib/catalog-data";
import {
  breadcrumbJsonLd,
  buildMetadata,
  collectionJsonLd,
} from "@/lib/seo";

export async function generateStaticParams() {
  const list = await getCatalogs();
  return list.length > 0
    ? list.map((c) => ({ category: c.slug }))
    : [{ category: "vapes" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const slug = (await params).category;
  const [category, list] = await Promise.all([
    getCatalogBySlug(slug),
    getProducts(slug),
  ]);
  if (!category) {
    return buildMetadata({
      title: "Shop",
      description: "Browse Momo Eliquid collections.",
      path: "/shop",
    });
  }
  const lead = list[0];
  return buildMetadata({
    title: category.label,
    description: category.description,
    path: `/shop/${category.slug}`,
    image: lead?.image,
    imageAlt: `${category.label} · Momo Eliquid`,
  });
}

async function CategoryContent({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const slug = (await params).category;
  const [category, categories, list] = await Promise.all([
    getCatalogBySlug(slug),
    getCatalogs(),
    getProducts(slug),
  ]);
  if (!category) notFound();

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
      <CollectionView
        category={category}
        categories={categories}
        products={list}
      />
    </>
  );
}

export default function CategoryPage({
  params,
}: PageProps<"/shop/[category]">) {
  return (
    <Suspense
      fallback={
        <>
          <Nav />
          <main className="shell min-h-[60vh] pt-[25px] pb-16" />
          <Footer />
        </>
      }
    >
      <CategoryContent params={params} />
    </Suspense>
  );
}
