import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "@/components/collection-view";
import { categories, getCategory } from "@/lib/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = getCategory((await params).category);
  return { title: `${category?.label ?? "Shop"} · Momo Eliquid` };
}

export default async function CategoryPage({
  params,
}: PageProps<"/shop/[category]">) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  return <CollectionView category={category} />;
}
