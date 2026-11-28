import Image from "next/image";
import type { SVGProps } from "react";
import { MEDIA_IMAGES } from "@/lib/media";

export const COLORS = {
  ink: "#212121",
  cream: "#fdf3e4",
  lime: "#dbf063",
  pink: "#ee5d87",
  purple: "#6742cc",
  orange: "#ee7847",
  teal: "#7cd8c0",
} as const;

export type ColorName = keyof typeof COLORS;

const { ink: INK, cream: CREAM, lime: LIME, purple: PURPLE, orange: ORANGE, teal: TEAL } = COLORS;

type Props = SVGProps<SVGSVGElement>;

export function ArrowIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

const heroProducts = [
  {
    src: MEDIA_IMAGES.vapes.sodaLish,
    alt: "Momo Soda-lish e-liquid",
    className: "top-[19%] left-[30%] z-20 w-[39%] -rotate-3 bg-cream",
    sizes:
      "(min-width: 1280px) 306px, (min-width: 1024px) 250px, (min-width: 640px) 218px, 172px",
  },
  {
    src: MEDIA_IMAGES.kush.ogKushReserve,
    alt: "OG Kush Reserve flower",
    className: "top-[50%] left-[19%] z-30 w-[29%] -rotate-8 bg-ink",
    sizes:
      "(min-width: 1280px) 228px, (min-width: 1024px) 186px, (min-width: 640px) 162px, 128px",
  },
  {
    src: MEDIA_IMAGES.gummies.blueRaspberryRings,
    alt: "Blue Raspberry Rings gummies",
    className: "top-[48%] left-[52%] z-30 w-[29%] rotate-7 bg-white",
    sizes:
      "(min-width: 1280px) 228px, (min-width: 1024px) 186px, (min-width: 640px) 162px, 128px",
  },
];

export function HeroArt({ className }: { className?: string }) {
  return (
    <div className={`aspect-square ${className ?? ""}`}>
      <div className="relative size-full">
        <svg
          viewBox="0 0 786 786"
          fill="none"
          aria-hidden="true"
          className="size-full"
        >
          <circle cx="393" cy="393" r="393" fill={ORANGE} />
          <circle cx="393" cy="393" r="333" fill={LIME} />
          <circle cx="393" cy="393" r="274" fill={TEAL} />
          <circle cx="393" cy="393" r="214" fill={PURPLE} />
          <circle cx="393" cy="393" r="155" fill={CREAM} />
        </svg>
        {heroProducts.map((item, index) => (
          <div
            key={item.src}
            className={`absolute aspect-square overflow-hidden rounded-2xl border-[3px] border-ink shadow-[5px_5px_0_var(--color-ink)] sm:rounded-3xl ${item.className}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes={item.sizes}
              preload={index === 0}
              loading={index === 0 ? undefined : "eager"}
              fetchPriority={index === 0 ? "high" : undefined}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Outlined concentric rings used on the collection banner. */
export function RingsArt({
  className,
  image,
  alt = "",
}: {
  className?: string;
  image?: string;
  alt?: string;
}) {
  return (
    <div className={`aspect-square ${className ?? ""}`}>
      <div className="relative size-full">
        <svg
          viewBox="0 0 464 464"
          fill="none"
          aria-hidden="true"
          className="size-full"
        >
          <g stroke={INK} strokeWidth="3">
            <circle cx="232" cy="232" r="229" />
            <circle cx="232" cy="232" r="181" />
            <circle cx="232" cy="232" r="133" />
            <circle cx="232" cy="232" r="85" />
            {!image && <circle cx="232" cy="232" r="36" fill={CREAM} />}
          </g>
        </svg>
        {image && (
          <div className="absolute top-1/2 left-1/2 size-[36.6%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] border-ink bg-cream shadow-[4px_4px_0_var(--color-ink)]">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="170px"
              preload
              fetchPriority="high"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Icon({
  children,
  viewBox = "0 0 160 140",
  strokeWidth = 5,
  ...props
}: Props) {
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden="true" {...props}>
      <g
        stroke={INK}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {children}
      </g>
    </svg>
  );
}

export function GummiesIcon(props: Props) {
  return (
    <Icon {...props}>
      <rect x="10" y="40" width="60" height="60" rx="16" fill={LIME} transform="rotate(-10 40 70)" />
      <rect x="88" y="22" width="60" height="60" rx="16" fill={CREAM} transform="rotate(8 118 52)" />
      <rect x="52" y="68" width="62" height="62" rx="16" fill={PURPLE} transform="rotate(4 83 99)" />
    </Icon>
  );
}
