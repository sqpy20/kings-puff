import Image from "next/image";
import Link from "next/link";
import { bgClass } from "@/lib/catalog";
import { getCatalogs, getProducts } from "@/lib/catalog-data";
import { BRAND_LOGO_URL } from "@/lib/media";
import { ArrowIcon } from "./illustrations";

export default async function Categories() {
  const [catalogList, productList] = await Promise.all([
    getCatalogs(),
    getProducts(),
  ]);

  const cards = catalogList.map((catalog) => {
    const imgs = productList
      .filter((p) => p.category === catalog.slug)
      .slice(0, 2)
      .map((p) => p.image);
    return {
      slug: catalog.slug,
      label: catalog.label,
      colorClass: `${bgClass[catalog.color]} ${
        catalog.color === "purple" || catalog.color === "ink"
          ? "text-white"
          : "text-ink"
      }`,
      images: [
        imgs[0] ?? BRAND_LOGO_URL,
        imgs[1] ?? imgs[0] ?? BRAND_LOGO_URL,
      ],
    };
  });

  return (
    <section className="shell pt-14 pb-16 lg:pt-[103px] lg:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="text-[30px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[43px]">
          Shop by vibe
        </h2>
        <Link
          href="/shop"
          className="mb-1.5 inline-flex items-center gap-1.5 font-semibold sm:text-[17px]"
        >
          View all products
          <ArrowIcon className="size-4" />
        </Link>
      </div>
      <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mt-[50px] lg:gap-5 xl:gap-7">
        {cards.map(({ slug, label, images, colorClass }, index) => {
          const isOddTrailing =
            cards.length % 2 === 1 && index === cards.length - 1;
          return (
            // Sizes inside each card scale with the card's own width (cqw).
            <li
              key={slug}
              className={`@container ${isOddTrailing ? "max-sm:col-span-2" : ""}`}
            >
              <Link
                href={`/shop/${slug}`}
                className={`group flex ${
                  isOddTrailing && index === 2
                    ? "aspect-[2/1] sm:aspect-square"
                    : "aspect-square"
                } flex-col rounded-[clamp(20px,8cqw,28px)] p-[clamp(14px,7.5cqw,28px)] ${colorClass}`}
              >
                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  <div className="absolute aspect-square h-[76%] max-w-[58%] -translate-x-[22%] translate-y-[4%] -rotate-8 overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-300 group-hover:-translate-x-[28%] group-hover:-rotate-12 sm:rounded-2xl sm:border-[3px] sm:shadow-[5px_5px_0_var(--color-ink)]">
                    <Image
                      src={images[0]}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 240px, (min-width: 640px) 180px, 100px"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute aspect-square h-[76%] max-w-[58%] translate-x-[22%] -translate-y-[4%] rotate-6 overflow-hidden rounded-xl border-2 border-ink bg-cream shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-300 group-hover:translate-x-[28%] group-hover:rotate-10 sm:rounded-2xl sm:border-[3px] sm:shadow-[5px_5px_0_var(--color-ink)]">
                    <Image
                      src={images[1]}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 240px, (min-width: 640px) 180px, 100px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[clamp(16px,7.5cqw,28px)] leading-[1.25] font-bold tracking-[-0.01em]">
                    {label}
                  </span>
                  <ArrowIcon className="size-[clamp(18px,6.5cqw,26px)] shrink-0" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
