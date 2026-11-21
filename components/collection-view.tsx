import Link from "next/link";
import { type Category, categories, products } from "@/lib/catalog";
import CollectionBrowser from "./collection-browser";
import Footer from "./footer";
import Nav from "./nav";

/** The shop page: every product, or one category when `category` is given. */
export default function CollectionView({ category }: { category?: Category }) {
  const list = category
    ? products.filter((p) => p.category === category.slug)
    : products;

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
