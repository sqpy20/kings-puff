import { type Badge, type Product, bgClass, getCategory } from "@/lib/catalog";
import AddToBag from "./add-to-bag";
import {
  AccessoriesIcon,
  JarIcon,
  SyrupIcon,
  VapeIcon,
  WrapsIcon,
} from "./illustrations";

const badgeClass: Record<Badge, string> = {
  "New arrival": "bg-lime",
  Featured: "bg-white",
  "Limited stock": "bg-cream",
  Available: "bg-teal",
};

export function ProductArt({ product }: { product: Product }) {
  const [first] = product.palette;
  switch (product.category) {
    case "thc-gummies":
      return <JarIcon className="w-[45%]" gummies={product.palette} />;
    case "vapes":
      return <VapeIcon className="w-[31%]" body={first} />;
    case "rosin-syrup":
      return <SyrupIcon className="w-[80%]" strokeWidth={3} body={first} />;
    case "backwood-wraps":
      return <WrapsIcon className="w-[66%]" strokeWidth={3.6} box={first} />;
    case "accessories":
      return <AccessoriesIcon className="w-[60%]" strokeWidth={4} ring={first} />;
  }
}

export default function ProductCard({
  product,
  meta = product.meta,
  note = product.note,
}: {
  product: Product;
  /** Override the catalogue text, e.g. to prefix the category name. */
  meta?: string;
  note?: string;
}) {
  const color = getCategory(product.category)?.color ?? "pink";
  return (
    <li className="flex flex-col overflow-hidden rounded-[20px] bg-white sm:rounded-3xl">
      <div
        className={`relative grid aspect-[337/422] place-items-center ${bgClass[color]}`}
      >
        {product.badge && (
          <span
            className={`absolute top-3 left-3 inline-flex h-[26px] items-center rounded-full px-2.5 text-[10px] font-bold tracking-[0.1em] uppercase sm:top-[18px] sm:left-[18px] sm:h-[29px] sm:px-[13px] sm:text-[11.5px] ${badgeClass[product.badge]}`}
          >
            {product.badge}
          </span>
        )}
        <ProductArt product={product} />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-3.5 pb-4 sm:px-[18px] sm:pt-4 sm:pb-[22px]">
        <h3 className="text-[17px] leading-[1.3] font-semibold tracking-[0.01em] sm:text-[21px] sm:leading-7 lg:text-lg xl:text-[21px]">
          {product.name}
        </h3>
        <p className="mt-[7px] text-[13px] leading-[22px] text-[#666] sm:text-sm sm:leading-[22px]">
          {meta}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5 pt-[17px]">
          <span className="text-lg font-medium sm:text-[22px]">[Price]</span>
          <AddToBag
            id={product.id}
            className="h-10 rounded-[10px] bg-pink px-3.5 text-sm font-bold sm:h-[43px] sm:px-[18px] sm:text-[15.5px]"
          />
        </div>
        <p className="mt-[9px] text-xs leading-5 text-[#666] sm:text-[13.5px] sm:leading-[21px]">
          {note}
        </p>
      </div>
    </li>
  );
}
