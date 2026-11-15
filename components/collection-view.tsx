import Link from "next/link";
import {
  type Category,
  bgClass,
  categories,
  products,
} from "@/lib/catalog";
import CollectionBrowser from "./collection-browser";
import Footer from "./footer";
import { RingsArt } from "./illustrations";
import Nav from "./nav";

/** The shop page: every product, or one category when `category` is given. */
export default function CollectionView({ category }: { category?: Category }) {
  const list = category
    ? products.filter((p) => p.category === category.slug)
    : products;
  const title = category?.label ?? "Shop all";
  const description =
    category?.description ??
    "Everything in the Kings Puff lineup, in one place. Filter by category to find your vibe.";
  const color = category?.color ?? "pink";

  return (
    <>
      <Nav />
      <main className="shell pt-[25px] pb-16 lg:pb-24">
        <nav aria-label="Breadcrumb" className="text-[14.5px] leading-[22px]">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          /{" "}
          {category ? (
            <>
              <Link href="/shop" className="underline underline-offset-2">
                Shop
              </Link>{" "}
              / {category.label}
            </>
          ) : (
            "Shop"
          )}
        </nav>
        <div
          className={`relative mt-[19px] overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 lg:rounded-[32px] lg:px-[70px] lg:py-[69px] ${bgClass[color]} ${
            color === "purple" ? "text-white" : ""
          }`}
        >
          <RingsArt className="absolute top-[44%] -right-[79px] hidden w-[464px] -translate-y-1/2 md:block" />
          <div className="relative">
            <p className="inline-flex h-[30px] items-center rounded-full bg-ink px-[13px] text-[11.5px] font-bold tracking-[0.1em] text-white uppercase">
              {list.length} products
            </p>
            <h1 className="mt-4 text-[44px] leading-[1.05] font-extrabold tracking-[-0.045em] sm:text-[60px] lg:text-[76px]">
              {title}
            </h1>
            <p className="mt-5 max-w-[620px] text-lg leading-[1.6] lg:text-[19px]">
              {description}
            </p>
          </div>
        </div>
        {/* Keyed so sort and "load more" reset when the category changes. */}
        <CollectionBrowser
          key={category?.slug ?? "all"}
          categories={categories}
          active={category?.slug}
          products={list}
        />
      </main>
      <Footer />
    </>
  );
}
