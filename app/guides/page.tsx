import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
import { ArrowIcon } from "@/components/illustrations";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import { guides } from "@/lib/guides";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "UK Buyer Guides & Knowledge Hub",
  description:
    "In-depth UK guides from Momo Eliquid covering shortfills vs nic salts, ExPod Pro 2ml prefilled pods, THC gummy dosing, and small-batch Kush potency.",
  path: "/guides",
  keywords: [
    "Momo Eliquid guides",
    "shortfill vs nic salt UK",
    "THC gummies dosing guide UK",
    "Indica vs Hybrid Kush",
    "UK e-liquid advice",
  ],
});

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Buyer Guides", path: "/guides" },
        ])}
      />
      <Nav />
      <main className="shell pt-8 pb-20 lg:pt-12 lg:pb-24">
        <nav aria-label="Breadcrumb" className="text-[14.5px] leading-[22px]">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          / Buyer Guides
        </nav>

        <header className="mt-5 max-w-3xl">
          <span className="inline-block rounded-full border-2 border-ink bg-lime px-3.5 py-1 text-xs font-extrabold tracking-[0.08em] uppercase">
            UK Knowledge Hub
          </span>
          <h1 className="mt-4 text-[40px] leading-[1.06] font-extrabold tracking-[-0.04em] sm:text-[56px]">
            Buyer guides &amp;{" "}
            <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
              breakdowns.
            </em>
          </h1>
          <p className="mt-4 text-[17px] leading-7 text-ink/80">
            Clear, UK-focused reference guides comparing bottle formats, coil
            pairings, mg-per-piece dosing, and cultivar potency across every
            Momo Eliquid drop.
          </p>
        </header>

        <section
          aria-label="Buyer guides list"
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {guides.map((guide) => (
            <article
              key={guide.slug}
              className="flex flex-col overflow-hidden rounded-[26px] border-2 border-ink bg-white shadow-[5px_5px_0_var(--color-ink)]"
            >
              <Link
                href={`/guides/${guide.slug}`}
                className="relative aspect-[16/9] w-full overflow-hidden border-b-2 border-ink bg-sand"
              >
                <Image
                  src={guide.image}
                  alt={guide.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
              </Link>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-ink/70">
                  <span className="rounded-full border border-ink bg-cream px-2.5 py-0.5 text-ink">
                    {guide.categorySlug}
                  </span>
                  <span>{guide.readingTime}</span>
                </div>

                <h2 className="mt-3 text-xl leading-snug font-extrabold tracking-[-0.01em] sm:text-2xl">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="hover:underline underline-offset-4"
                  >
                    {guide.title}
                  </Link>
                </h2>

                <p className="mt-2.5 flex-1 text-[15px] leading-6 text-ink/75">
                  {guide.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-4">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-extrabold hover:underline underline-offset-4"
                  >
                    Read full guide
                    <ArrowIcon className="size-4" />
                  </Link>
                  <Link
                    href={`/shop/${guide.categorySlug}`}
                    className="text-xs font-bold uppercase text-ink/70 underline underline-offset-4 hover:text-ink"
                  >
                    Shop {guide.categorySlug}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
