import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ProductDetail from "@/components/product-detail";
import { findProduct, getCategory, products } from "@/lib/catalog";
import {
  breadcrumbJsonLd,
  buildMetadata,
  productJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProduct((await params).id);
  if (!product) {
    return buildMetadata({
      title: "Product",
      description: "Product details at Momo Eliquid.",
      path: "/shop",
      noIndex: true,
    });
  }
  return buildMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${product.id}`,
    image: product.image,
    imageAlt: product.name,
    keywords: [
      product.name,
      "Momo Eliquid",
      product.category,
      ...product.details.map((d) => d.value),
    ],
  });
}

export default async function ProductPage({ params }: Props) {
  const product = findProduct((await params).id);
  if (!product) notFound();
  const category = getCategory(product.category);
  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/shop" },
            ...(category
              ? [{ name: category.label, path: `/shop/${category.slug}` }]
              : []),
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />
      <ProductDetail product={product} />
    </>
  );
}
