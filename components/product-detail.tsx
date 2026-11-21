import Image from "next/image";
import Link from "next/link";
import {
  FREE_SHIPPING_THRESHOLD,
  type Product,
  bgClass,
  formatPrice,
  getCategory,
  productTag,
  products,
} from "@/lib/catalog";
import Footer from "./footer";
import { ArrowIcon } from "./illustrations";
import Nav from "./nav";
import ProductCard, { badgeClass } from "./product-card";
import ProductPurchase from "./product-purchase";
import ShareBacklink from "./share-backlink";

export default function ProductDetail({ product }: { product: Product }) {
  const category = getCategory(product.category);
  const color = category?.color ?? "pink";
  const tag = productTag(product);
  const related = [
    ...products.filter(
      (p) => p.category === product.category && p.id !== product.id,
    ),
    ...products.filter((p) => p.category !== product.category),
  ].slice(0, 4);

  return (
    <>
      <Nav />
      <main className="shell pt-[25px] pb-16 lg:pb-24">
        <nav aria-label="Breadcrumb" className="text-[14.5px] leading-[22px]">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/shop" className="underline underline-offset-2">
            Products
          </Link>{" "}
          {category && (
            <>
              /{" "}
              <Link
                href={`/shop/${category.slug}`}
                className="underline underline-offset-2"
              >
                {category.label}
              </Link>{" "}
            </>
          )}
          / {product.name}
        </nav>

        <div className="mt-6 grid items-start gap-8 lg:mt-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12 xl:gap-16">
          <div
            className={`relative aspect-square overflow-hidden rounded-[28px] border-2 border-ink shadow-[6px_6px_0_var(--color-ink)] sm:rounded-[32px] ${bgClass[color]}`}
          >
            {product.badge && (
              <span
                className={`absolute top-4 left-4 z-10 inline-flex h-[30px] items-center rounded-full px-3.5 text-[11.5px] font-bold tracking-[0.1em] uppercase shadow-sm ring-1 ring-ink/10 sm:top-6 sm:left-6 ${badgeClass[product.badge]}`}
              >
                {product.badge}
              </span>
            )}
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              preload
              className="object-cover"
            />
          </div>

          <div className="rounded-[28px] bg-white p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link
                  href={`/shop/${category.slug}`}
                  className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-bold tracking-[0.1em] uppercase ${bgClass[color]} ${
                    color === "purple" ? "text-white" : ""
                  }`}
                >
                  {category.label}
                </Link>
              )}
              <span
                className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-bold tracking-[0.1em] uppercase ${tag.className}`}
              >
                {tag.label}
              </span>
            </div>

            <h1 className="mt-4 text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[42px] lg:text-[48px]">
              {product.name}
            </h1>
            <p className="mt-2.5 text-[15px] leading-6 text-[#666] sm:text-base">
              {product.meta}
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[28px] leading-none font-extrabold sm:text-[34px]">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm font-medium text-[#666]">
                {product.price >= FREE_SHIPPING_THRESHOLD
                  ? "Qualifies for free UK standard delivery"
                  : `Free UK standard delivery over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`}
              </span>
            </div>

            <p className="mt-5 text-[17px] leading-7 text-ink/90">
              {product.description}
            </p>

            <ProductPurchase
              id={product.id}
              name={product.name}
              price={product.price}
            />

            <p className="mt-6 rounded-2xl bg-sand px-4 py-3.5 text-sm leading-6 font-semibold">
              Order before 2PM for same-day UK dispatch · 18+ ID verification on
              delivery.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              {product.details.map((d) => (
                <div key={d.label} className="rounded-2xl bg-cream p-4">
                  <dt className="text-[11px] font-bold tracking-[0.1em] text-[#666] uppercase">
                    {d.label}
                  </dt>
                  <dd className="mt-1 text-[15px] leading-snug font-bold sm:text-base">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>

            <ShareBacklink
              path={`/products/${product.id}`}
              title={product.name}
            />
          </div>
        </div>

        <section className="mt-16 lg:mt-24">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <h2 className="text-[30px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[43px]">
              You might also like
            </h2>
            <Link
              href="/shop"
              className="mb-1.5 inline-flex items-center gap-1.5 font-semibold sm:text-[17px]"
            >
              View all products
              <ArrowIcon className="size-4" />
            </Link>
          </div>
          <ul className="mt-7 grid grid-cols-2 gap-4 lg:mt-10 lg:grid-cols-4 lg:gap-5 xl:gap-[26px]">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
