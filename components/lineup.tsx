import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { ArrowIcon } from "./illustrations";
import ProductCard from "./product-card";

// Home-page picks. The text here names the category, which the collection
// pages leave out.
const lineup = [
  {
    id: "rainbow-crown-gummies",
    meta: "THC Gummies · [XX] mg per piece · [count] pieces",
    note: "21+ · Available in select states",
  },
  {
    id: "purple-reign-disposable",
    meta: "Vapes · [X] g · [strain / flavour]",
    note: "21+ · Available in select states",
  },
  {
    id: "golden-hour-rosin-syrup",
    meta: "Rosin Syrup · [XX] mg THC · [XX] ml",
    note: "21+ · Available in select states",
  },
  {
    id: "backwood-wraps-variety",
    meta: "Wraps · [count] per pack · [flavours]",
    note: "21+ · Tobacco product · Available in select states",
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
        {lineup.map(({ id, meta, note }) => (
          <ProductCard key={id} product={getProduct(id)} meta={meta} note={note} />
        ))}
      </ul>
    </section>
  );
}
