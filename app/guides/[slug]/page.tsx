import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Footer from "@/components/footer";
import { ArrowIcon } from "@/components/illustrations";
import JsonLd from "@/components/json-ld";
import Nav from "@/components/nav";
import ProductCard from "@/components/product-card";
import { getCatalogBySlug, getProducts } from "@/lib/catalog-data";
import { findGuide, guides } from "@/lib/guides";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) {
    return buildMetadata({
      title: "Buyer Guides",
      description: "UK e-liquid, gummy & Kush buyer guides at Momo Eliquid.",
      path: "/guides",
      noIndex: true,
    });
  }

  return buildMetadata({
    title: guide.seoTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
    image: guide.image,
    imageAlt: guide.title,
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
  });
}

async function GuideContent({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  const [category, allProducts] = await Promise.all([
    getCatalogBySlug(guide.categorySlug),
    getProducts(),
  ]);

  const featuredProducts = allProducts.filter((p) =>
    guide.productIds.includes(p.id),
  );
  const relatedGuides = guides.filter((g) => g.slug !== guide.slug).slice(0, 2);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: guide.title,
            description: guide.description,
            path: `/guides/${guide.slug}`,
            image: guide.image,
            datePublished: guide.publishedAt,
            dateModified: guide.updatedAt,
            keywords: guide.keywords,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Buyer Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          faqJsonLd(guide.faqs),
        ]}
      />
      <Nav />
      <main className="shell pt-8 pb-20 lg:pt-10 lg:pb-24">
        <nav aria-label="Breadcrumb" className="text-[14.5px] leading-[22px]">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/guides" className="underline underline-offset-2">
            Buyer Guides
          </Link>{" "}
          / {guide.title}
        </nav>

        <article className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <header>
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold uppercase">
                <Link
                  href={`/shop/${guide.categorySlug}`}
                  className="rounded-full border-2 border-ink bg-lime px-3 py-0.5 text-ink"
                >
                  {category?.label ?? guide.categorySlug}
                </Link>
                <span className="rounded-full border border-ink bg-sand px-3 py-0.5 text-ink/80">
                  {guide.readingTime}
                </span>
                <time dateTime={guide.updatedAt} className="text-ink/60">
                  Updated{" "}
                  {new Date(guide.updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>

              <h1 className="mt-4 text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[48px]">
                {guide.title}
              </h1>
              <p className="mt-4 text-[18px] leading-7 text-ink/80">
                {guide.description}
              </p>
            </header>

            <div className="mt-8 space-y-10">
              {guide.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="rounded-[24px] border-2 border-ink bg-white p-6 sm:p-8"
                >
                  <h2 className="text-2xl leading-tight font-extrabold tracking-[-0.02em]">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-[16px] leading-7 text-ink/85">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-5 list-disc space-y-2 pl-5 text-[15px] leading-6 font-medium text-ink">
                      {section.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section
                id="faqs"
                className="rounded-[24px] border-2 border-ink bg-cream p-6 sm:p-8"
              >
                <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                  Frequently asked questions
                </h2>
                <dl className="mt-5 space-y-5">
                  {guide.faqs.map((faq) => (
                    <div
                      key={faq.q}
                      className="rounded-2xl border border-ink/20 bg-white p-5"
                    >
                      <dt className="text-base font-extrabold">{faq.q}</dt>
                      <dd className="mt-2 text-[15px] leading-6 text-ink/80">
                        {faq.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <nav
              aria-label="In this guide"
              className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-ink/65">
                On this page
              </p>
              <ul className="mt-3 space-y-2 text-sm font-bold">
                {guide.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block underline-offset-4 hover:underline"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#faqs"
                    className="block underline-offset-4 hover:underline"
                  >
                    Frequently asked questions
                  </a>
                </li>
              </ul>
            </nav>

            <div className="rounded-[24px] border-2 border-ink bg-lime p-6 shadow-[4px_4px_0_var(--color-ink)]">
              <h2 className="text-lg font-extrabold">
                Shop {category?.label ?? guide.categorySlug}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/85">
                UK orders placed before 2:00 PM Monday–Friday dispatch the same
                day, with free UK delivery over £50.
              </p>
              <Link
                href={`/shop/${guide.categorySlug}`}
                className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-white"
              >
                Browse {category?.label ?? guide.categorySlug}
                <ArrowIcon className="size-4" />
              </Link>
            </div>
          </aside>
        </article>

        {featuredProducts.length > 0 && (
          <section className="mt-14 border-t border-ink/15 pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
                Featured in this guide
              </h2>
              <Link
                href={`/shop/${guide.categorySlug}`}
                className="text-sm font-bold underline underline-offset-4"
              >
                View full collection →
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 border-t border-ink/15 pt-10">
          <h2 className="text-xl font-extrabold">More UK buyer guides</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {relatedGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="rounded-2xl border-2 border-ink bg-white p-5 transition hover:bg-sand/60"
              >
                <p className="text-xs font-extrabold uppercase text-ink/60">
                  {g.categorySlug} · {g.readingTime}
                </p>
                <p className="mt-1.5 text-lg font-extrabold">{g.title}</p>
                <p className="mt-1 text-sm text-ink/75">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function GuideDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <>
          <Nav />
          <main className="shell min-h-[60vh] pt-8 pb-16" />
          <Footer />
        </>
      }
    >
      <GuideContent params={params} />
    </Suspense>
  );
}
