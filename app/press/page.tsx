import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BacklinkKit from "@/components/backlink-kit";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import { formatPrice } from "@/lib/catalog";
import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { BRAND_LOGO_URL } from "@/lib/media";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Press & Partners",
  description:
    "Official Momo Eliquid brand assets, product facts, and backlink generator for press, reviewers, and UK retail partners.",
  path: "/press",
  keywords: [
    "Momo Eliquid press kit",
    "Momo Eliquid partners",
    "Momo Eliquid brand assets",
  ],
});

const assets = [
  {
    name: "Momo Eliquid Square Logo",
    file: BRAND_LOGO_URL,
    download: "momo-eliquid-logo.jpg",
    spec: "800 × 800 px · JPEG",
  },
  {
    name: "Momo Eliquid App Icon",
    file: "/icon.png",
    download: "momo-eliquid-icon.png",
    spec: "512 × 512 px · PNG",
  },
];

export default async function PressPage() {
  const [categories, products] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Press & Partners", path: "/press" },
        ])}
      />
      <Nav />
      <main className="shell pt-6.25 pb-16 lg:pb-24">
        <nav aria-label="Breadcrumb" className="text-[14.5px] leading-5.5">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          / Press &amp; Partners
        </nav>

        <section className="mt-5 rounded-[28px] bg-purple px-6 py-10 text-white sm:px-10 lg:rounded-4xl lg:px-14 lg:py-14">
          <p className="inline-flex h-7 items-center rounded-full bg-lime px-3 text-[11px] font-bold tracking-widest text-ink uppercase">
            Press &amp; Partner Kit
          </p>
          <h1 className="mt-4 text-[38px] leading-[1.06] font-extrabold tracking-[-0.04em] sm:text-[54px] lg:text-[64px]">
            Share &amp; link to{" "}
            <em className="font-serif text-[1.08em] leading-0 font-normal tracking-[-0.02em]">
              Momo Eliquid.
            </em>
          </h1>
          <p className="mt-4 max-w-160 text-lg leading-7 text-white">
            Official logos, verified product details, and ready-to-use partner
            backlink snippets for UK reviewers, creators, and retail stockists.
          </p>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <BacklinkKit categories={categories} products={products} />

          <section className="rounded-[28px] bg-white p-6 sm:p-9 lg:p-10">
            <p className="text-[11.5px] leading-4 font-bold tracking-widest uppercase">
              Brand assets
            </p>
            <h2 className="mt-3 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[32px]">
              Official logos
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-[#555]">
              Download high-resolution brand marks for editorial features,
              review roundups, and stockist listings.
            </p>
            <ul className="mt-6 space-y-4">
              {assets.map((asset) => (
                <li
                  key={asset.file}
                  className="flex items-center gap-4 rounded-2xl border-2 border-ink/15 bg-cream/60 p-3.5"
                >
                  <div className="relative size-18 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-white">
                    <Image
                      src={asset.file}
                      alt={asset.name}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{asset.name}</p>
                    <p className="text-sm text-[#666]">{asset.spec}</p>
                  </div>
                  <a
                    href={asset.file}
                    download={asset.download}
                    className="inline-flex h-10 shrink-0 items-center rounded-full bg-ink px-4 text-sm font-bold text-white"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-12 rounded-[28px] bg-white p-6 sm:p-9 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11.5px] leading-4 font-bold tracking-widest uppercase">
                Reference directory
              </p>
              <h2 className="mt-2 text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-[36px]">
                Catalog &amp; direct product links
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[15px] font-bold underline underline-offset-4"
            >
              Browse all products
            </Link>
          </div>

          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {categories.map((category) => {
              const items = products.filter(
                (p) => p.category === category.slug,
              );
              return (
                <div
                  key={category.slug}
                  className="rounded-2xl border-2 border-ink/15 bg-cream/50 p-5"
                >
                  <h3 className="text-xl font-extrabold">
                    <Link
                      href={`/shop/${category.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {category.label}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#555]">
                    {category.description}
                  </p>
                  <ul className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                    {items.map((p) => (
                      <li key={p.id} className="text-sm">
                        <Link
                          href={`/products/${p.id}`}
                          className="font-bold underline-offset-2 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[#666]">
                          {p.meta} · {formatPrice(p.price)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
