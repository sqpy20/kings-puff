import Link from "next/link";
import {
  ArrowIcon,
  JarIcon,
  PinkSyrupIcon,
  VapeIcon,
  WrapsIcon,
} from "./illustrations";

const products = [
  {
    name: "Rainbow Crown Gummies",
    meta: "THC Gummies · [XX] mg per piece · [count] pieces",
    note: "21+ · Available in select states",
    badge: "New arrival",
    badgeColor: "bg-lime",
    color: "bg-pink",
    Icon: JarIcon,
    iconWidth: "w-[45%]",
    stroke: 5,
  },
  {
    name: "Purple Reign Disposable",
    meta: "Vapes · [X] g · [strain / flavour]",
    note: "21+ · Available in select states",
    badge: "Featured",
    badgeColor: "bg-white",
    color: "bg-purple",
    Icon: VapeIcon,
    iconWidth: "w-[31%]",
    stroke: 5,
  },
  {
    name: "Golden Hour Rosin Syrup",
    meta: "Rosin Syrup · [XX] mg THC · [XX] ml",
    note: "21+ · Available in select states",
    badge: "Limited stock",
    badgeColor: "bg-cream",
    color: "bg-orange",
    Icon: PinkSyrupIcon,
    iconWidth: "w-[80%]",
    stroke: 3,
  },
  {
    name: "Backwood Wraps — Variety",
    meta: "Wraps · [count] per pack · [flavours]",
    note: "21+ · Tobacco product · Available in select states",
    badge: "Available",
    badgeColor: "bg-teal",
    color: "bg-lime",
    Icon: WrapsIcon,
    iconWidth: "w-[66%]",
    stroke: 3.6,
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
        {products.map((p) => (
          <li
            key={p.name}
            className="flex flex-col overflow-hidden rounded-[20px] bg-white sm:rounded-3xl"
          >
            <div
              className={`relative grid aspect-[337/422] place-items-center ${p.color}`}
            >
              <span
                className={`absolute top-3 left-3 inline-flex h-[26px] items-center rounded-full px-2.5 text-[10px] font-bold tracking-[0.1em] uppercase sm:top-[18px] sm:left-[18px] sm:h-[29px] sm:px-[13px] sm:text-[11.5px] ${p.badgeColor}`}
              >
                {p.badge}
              </span>
              <p.Icon className={p.iconWidth} strokeWidth={p.stroke} />
            </div>
            <div className="flex flex-1 flex-col px-3.5 pt-3.5 pb-4 sm:px-[18px] sm:pt-4 sm:pb-[22px]">
              <h3 className="text-[17px] leading-[1.3] font-semibold tracking-[0.01em] sm:text-[21px] sm:leading-7 lg:text-lg xl:text-[21px]">
                {p.name}
              </h3>
              <p className="mt-[7px] text-[13px] leading-[22px] text-[#666] sm:text-sm sm:leading-[22px]">
                {p.meta}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5 pt-[17px]">
                <span className="text-lg font-medium sm:text-[22px]">
                  [Price]
                </span>
                <button
                  type="button"
                  className="h-10 rounded-[10px] bg-pink px-3.5 text-sm font-bold sm:h-[43px] sm:px-[18px] sm:text-[15.5px]"
                >
                  Add to bag
                </button>
              </div>
              <p className="mt-[9px] text-xs leading-5 text-[#666] sm:text-[13.5px] sm:leading-[21px]">
                {p.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
