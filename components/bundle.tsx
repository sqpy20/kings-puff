import Link from "next/link";
import { ArrowIcon } from "./illustrations";

export default function Bundle() {
  return (
    <section className="shell pb-16 lg:pb-24">
      <div className="flex flex-col items-start gap-7 rounded-[28px] bg-orange p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:rounded-[36px] lg:p-[61px]">
        <div>
          <p className="inline-flex h-7 items-center rounded-full bg-ink px-[13px] text-[11.5px] font-bold tracking-[0.1em] text-white uppercase">
            Bundle &amp; save
          </p>
          <h2 className="mt-3 text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em] sm:text-[30px]">
            Build a Royal Box: pick any 3, save 15%.
          </h2>
          <p className="mt-3 text-[17px] leading-7">
            Mix vapes, gummies and kush. Offer valid where legal, while stock
            lasts.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex h-[55px] shrink-0 items-center gap-1.5 rounded-full bg-ink px-[30px] text-[17px] font-bold text-white"
        >
          Build your box
          <ArrowIcon className="size-[18px]" />
        </Link>
      </div>
    </section>
  );
}
