import Image from "next/image";
import Link from "next/link";
import { MEDIA_IMAGES } from "@/lib/media";
import { ArrowIcon } from "./illustrations";

const highlights = [
  {
    title: "Signature E-Liquids",
    text: "60 ml shortfills & crisp 10 ml nic salts blended for bold, all-day fruit flavour.",
    image: MEDIA_IMAGES.vapes.sodaLish,
    href: "/shop/vapes",
    color: "bg-pink",
  },
  {
    title: "Dosed Gummies",
    text: "Sugar-coated rings, bites & cubes accurately dosed at 10–15 mg THC per piece.",
    image: MEDIA_IMAGES.gummies.sourAppleCubes,
    href: "/shop/gummies",
    color: "bg-lime",
  },
  {
    title: "Small-Batch Kush",
    text: "Dense, frosty 3.5 g and 7 g flower pouches sealed fresh at 22–26% THC.",
    image: MEDIA_IMAGES.kush.purpleKush,
    href: "/shop/kush",
    color: "bg-teal",
  },
  {
    title: "ExPod Pro Pods",
    text: "Ready-to-vape 2 ml prefilled pods at 20 mg/ml for instant Cola Gummy flavour.",
    image: MEDIA_IMAGES.vapes.expodProCola,
    href: "/shop/vapes",
    color: "bg-orange",
  },
];

const badges = [
  "Vapes · Gummies · Kush",
  "Same-day dispatch before 2PM",
  "18+ verified · Clear labels",
];

// Repeating wavy edge in the section colour; `flip` turns it into the bottom
// edge, which sits on the sand background of the FAQ / Contact section that follows.
function Wave({ flip = false }: { flip?: boolean }) {
  const id = flip ? "story-wave-bottom" : "story-wave-top";
  return (
    <svg
      aria-hidden="true"
      className={`block h-10 w-full text-purple ${flip ? "-mt-px rotate-180 bg-sand" : "-mb-px"}`}
    >
      <defs>
        <pattern id={id} width="262" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M0 13Q32.75 0 65.5 0T131 13t65.5 13T262 13V40H0Z"
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect width="100%" height="40" fill={`url(#${id})`} />
    </svg>
  );
}

export default function Story({ priority = false }: { priority?: boolean }) {
  return (
    <section>
      <Wave />
      <div className="bg-purple text-white">
        <div className="shell flex flex-col gap-12 pt-10 pb-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:pt-[79px] lg:pb-[104px]">
          <div className="lg:w-[44%]">
            <p className="text-[11.5px] leading-4 font-bold tracking-widest uppercase">
              Inside the lineup
            </p>
            <h2 className="mt-6 text-[40px] leading-[1.07] font-extrabold tracking-[-0.04em] sm:text-[52px] xl:text-[60px]">
              Crafted to{" "}
              <em className="font-serif text-[1.08em] leading-[0] font-normal tracking-[-0.02em]">
                taste
              </em>{" "}
              unforgettable.
            </h2>
            <p className="mt-6 max-w-[600px] text-lg leading-[1.68] xl:text-[19px]">
              Every drop from Momo Eliquid is built for people who care about
              flavour as much as potency. From UK-made e-liquids like our
              signature Soda-lish shortfill and crisp Kuro Momo Fuji nic salts
              to grab-and-go ExPod Pro pods, every blend delivers clean, layered
              fruit notes from first pull to last.
            </p>
            <p className="mt-5 max-w-[600px] text-[17px] leading-7 text-white">
              Beyond vapes, the lineup includes sugar-dusted gummies — Blue
              Raspberry Rings, Wild Berry Bites, and Sour Apple Cubes — dosed
              clearly per piece, alongside small-batch Kush flower sealed fresh
              for rich terpene aroma.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {badges.map((label) => (
                <li
                  key={label}
                  className="inline-flex h-8 items-center rounded-full border border-white/20 bg-ink/35 px-3.5 text-xs font-bold tracking-[0.04em] text-white sm:text-[13px]"
                >
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="mt-8 inline-flex h-14 items-center gap-1.5 rounded-full bg-lime px-7 text-[17px] font-bold text-ink"
            >
              Explore the full range
              <ArrowIcon className="size-[18px]" />
            </Link>
          </div>
          {/* On desktop the right-hand column of cards sits 52px lower. */}
          <ul className="grid grid-cols-2 gap-4 text-ink lg:w-[50%] lg:gap-x-[18px] lg:gap-y-7 lg:pb-[52px]">
            {highlights.map((item, index) => (
              <li key={item.title} className="lg:even:translate-y-[52px]">
                <Link
                  href={item.href}
                  className={`group flex h-full flex-col rounded-[22px] p-3 sm:rounded-[28px] sm:p-4 lg:p-5 ${item.color}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-[14px] border-2 border-ink bg-white sm:rounded-[18px]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      preload={priority && index === 0}
                      loading={priority || index === 0 ? "eager" : undefined}
                      fetchPriority={priority && index === 0 ? "high" : undefined}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 text-base leading-snug font-extrabold tracking-[-0.01em] sm:mt-4 sm:text-xl lg:text-[22px]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-[1.45] sm:text-sm lg:text-[15px]">
                    {item.text}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Wave flip />
    </section>
  );
}
