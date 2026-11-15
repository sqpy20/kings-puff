import Link from "next/link";
import {
  AccessoriesIcon,
  ArrowIcon,
  GummiesIcon,
  SyrupIcon,
  VapesIcon,
  WrapsIcon,
} from "./illustrations";

const categories = [
  { label: "THC Gummies", slug: "thc-gummies", Icon: GummiesIcon, color: "bg-pink" },
  { label: "Vapes", slug: "vapes", Icon: VapesIcon, color: "bg-purple text-white" },
  { label: "Rosin Syrup", slug: "rosin-syrup", Icon: SyrupIcon, color: "bg-orange" },
  { label: "Backwood Wraps", slug: "backwood-wraps", Icon: WrapsIcon, color: "bg-lime" },
  { label: "Accessories", slug: "accessories", Icon: AccessoriesIcon, color: "bg-teal" },
];

export default function Categories() {
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
      <ul className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mt-[50px] lg:grid-cols-5 lg:gap-5 xl:gap-7">
        {categories.map(({ label, slug, Icon, color }) => (
          // Sizes inside each card scale with the card's own width (cqw).
          <li key={slug} className="@container">
            <Link
              href={`/collections/${slug}`}
              className={`flex aspect-square flex-col rounded-[clamp(20px,10.6cqw,28px)] p-[clamp(14px,9.8cqw,26px)] ${color}`}
            >
              <div className="flex min-h-0 flex-1 items-start justify-center">
                <Icon className="w-[68%]" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[clamp(16px,9.1cqw,24px)] leading-[1.25] font-bold tracking-[-0.01em]">
                  {label}
                </span>
                <ArrowIcon className="size-[clamp(18px,9cqw,24px)] shrink-0" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
