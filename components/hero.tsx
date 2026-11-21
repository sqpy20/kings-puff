import Link from "next/link";
import { ArrowIcon, HeroArt } from "./illustrations";

export default function Hero() {
  return (
    <section className="shell pt-5 md:pt-3 lg:pt-9">
      <div className="relative overflow-hidden rounded-[28px] bg-purple lg:flex lg:min-h-150 lg:items-center xl:min-h-178.25">
        <div className="relative z-10 px-6 pt-10 sm:px-10 sm:pt-14 lg:w-[56%] lg:px-14 lg:py-16 xl:px-19.75">
          <p className="inline-flex h-7.25 items-center rounded-full bg-ink px-3.25 text-[11.5px] font-bold tracking-widest text-white uppercase">
            New drop · Summer of colour
          </p>
          <h1 className="mt-6.25 text-[42px] leading-[1.05] font-extrabold tracking-[-0.045em] sm:text-[60px] lg:text-[64px] xl:text-[76px]">
            Royalty, but
            <br />
            make it{" "}
            <em className="font-serif text-[1.08em] leading-0 font-normal tracking-[-0.02em]">
              groovy.
            </em>
          </h1>
          <p className="mt-6.25 max-w-130 text-[17px] leading-[31.5px]">
            Vapes, gummies and kush in loud colours, with clear
            potency and ingredient info on every pack.
          </p>
          <div className="mt-8.75 flex flex-wrap gap-3.5">
            <Link
              href="/shop"
              className="inline-flex h-14 items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-7 text-[17px] font-bold text-white"
            >
              Shop the drop
              <ArrowIcon className="size-4.5" />
            </Link>
          </div>
        </div>
        <div className="relative mt-4 h-85 sm:h-105 lg:static lg:mt-0 lg:h-auto">
          <HeroArt className="absolute top-[58%] left-1/2 w-110 max-w-none -translate-x-1/2 -translate-y-1/2 sm:w-140 lg:top-[53.4%] lg:left-[77.5%] lg:w-[640px] xl:w-[786px]" />
        </div>
      </div>
    </section>
  );
}
