import Link from "next/link";
import type { Category, Product } from "@/lib/catalog";
import { guides } from "@/lib/guides";
import CollectionBrowser from "./collection-browser";
import Footer from "./footer";
import Nav from "./nav";

/** The shop page: every product, or one category when `category` is given. */
export default function CollectionView({
  category,
  categories,
  products,
}: {
  category?: Category;
  categories: Category[];
  products: Product[];
}) {
  const list = category
    ? products.filter((p) => p.category === category.slug)
    : products;

  const matchingGuides = category
    ? guides.filter((g) => g.categorySlug === category.slug)
    : guides.slice(0, 3);

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

        <header className="mt-5 max-w-3xl">
          <h1 className="text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[48px]">
            {category
              ? category.label
              : "Shop UK E-Liquids, Gummies & Kush"}
          </h1>
          <p className="mt-3 text-[16px] leading-6 text-ink/75 sm:text-[17px]">
            {category
              ? category.description
              : "Browse every Momo Eliquid release — UK-made shortfills, nic salts, ExPod Pro pods, dosed THC gummies, and small-batch Kush with same-day UK dispatch before 2PM."}
          </p>
        </header>

        {/* Keyed so sort and "load more" reset when the category changes. */}
        <CollectionBrowser
          key={category?.slug ?? "all"}
          categories={categories}
          active={category?.slug}
          products={list}
        />

        {matchingGuides.length > 0 && (
          <section className="mt-16 border-t border-ink/15 pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                  Related UK buyer guides
                </h2>
                <p className="mt-1 text-sm text-ink/70">
                  Detailed breakdowns on strengths, coil pairing, dosing, and UK
                  delivery.
                </p>
              </div>
              <Link
                href="/guides"
                className="text-sm font-bold underline underline-offset-4"
              >
                View all buyer guides →
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matchingGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="rounded-2xl border-2 border-ink bg-white p-5 transition hover:bg-sand/60"
                >
                  <span className="inline-block rounded-full border border-ink bg-lime px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                    {g.readingTime}
                  </span>
                  <h3 className="mt-3 text-base font-extrabold leading-snug">
                    {g.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-5 text-ink/75">
                    {g.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
