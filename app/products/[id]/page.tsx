import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import ProductDetail from "@/components/product-detail";
import { getCatalogBySlug, getProductById, getProducts } from "@/lib/catalog-data";
import {
  breadcrumbJsonLd,
  buildMetadata,
  productJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const list = await getProducts();
  return list.length > 0
    ? list.map((p) => ({ id: p.id }))
    : [{ id: "momo-soda-lish" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductById((await params).id);
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

async function ProductContent({ params }: Props) {
  const product = await getProductById((await params).id);
  if (!product) notFound();

  const [category, allProducts] = await Promise.all([
    getCatalogBySlug(product.category),
    getProducts(),
  ]);

  const related = [
    ...allProducts.filter(
      (p) => p.category === product.category && p.id !== product.id,
    ),
    ...allProducts.filter((p) => p.category !== product.category),
  ].slice(0, 4);

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
      <ProductDetail
        product={product}
        category={category}
        related={related}
      />
    </>
  );
}

export default function ProductPage({ params }: Props) {
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
      <ProductContent params={params} />
    </Suspense>
  );
}
