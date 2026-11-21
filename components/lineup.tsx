import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { ArrowIcon } from "./illustrations";
import ProductCard from "./product-card";

// Home-page picks. The text here names the category, which the collection
// pages leave out.
const lineup = [
  {
    id: "momo-soda-lish",
    meta: "Vapes · 60 ml · Raspberry, Grapefruit & Lemon",
  },
  {
    id: "blue-raspberry-rings",
    meta: "Gummies · 10 mg THC per piece · 10 pieces",
  },
  {
    id: "og-kush-reserve",
    meta: "Kush · 3.5 g · Indica-Dominant · 24% THC",
  },
  {
    id: "kuro-momo-fuji",
    meta: "Vapes · 10 ml · 5 mg Nicotine · White Peach & Fuji Apple",
  },
];

export default function Lineup() {
  return (
    <section className="shell pb-14 lg:pb-[106px]">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11.5px] leading-4 font-bold tracking-[0.1em] uppercase">
            Fan favourites
          </p>
          <h2 className="mt-3 text-[30px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[43px]">
            The royal lineup
          </h2>
        </div>
        <Link
          href="/shop"
          className="mb-1.5 inline-flex items-center gap-1.5 font-semibold sm:text-[17px]"
        >
          Shop all
          <ArrowIcon className="size-4" />
        </Link>
      </div>
      <ul className="mt-7 grid grid-cols-2 gap-4 lg:mt-[51px] lg:grid-cols-4 lg:gap-5 xl:gap-[27px]">
        {lineup.map(({ id, meta }) => (
          <ProductCard key={id} product={getProduct(id)} meta={meta} />
        ))}
      </ul>
    </section>
  );
}
