import type { Metadata } from "next";
import CollectionView from "@/components/collection-view";
import JsonLd from "@/components/json-ld";
import { getCatalogs, getProducts } from "@/lib/catalog-data";
import {
  breadcrumbJsonLd,
  buildMetadata,
  collectionJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Products",
  description:
    "Browse all Momo Eliquid vapes, UK-made e-liquids, dosed THC gummies, and small-batch Kush with same-day UK dispatch before 2PM.",
  path: "/shop",
  keywords: [
    "Momo Eliquid",
    "UK e-liquid",
    "vapes",
    "THC gummies",
    "Kush",
  ],
});

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          collectionJsonLd(products),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/shop" },
          ]),
        ]}
      />
      <CollectionView categories={categories} products={products} />
    </>
  );
}
