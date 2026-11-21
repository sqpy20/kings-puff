import type { SVGProps } from "react";

export const COLORS = {
  ink: "#212121",
  cream: "#fdf3e4",
  lime: "#dbf063",
  pink: "#ee5d87",
  purple: "#7c58e0",
  orange: "#ee7847",
  teal: "#7cd8c0",
} as const;

export type ColorName = keyof typeof COLORS;

const { ink: INK, cream: CREAM, lime: LIME, pink: PINK, purple: PURPLE, orange: ORANGE, teal: TEAL } = COLORS;

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

function Gummy({
  x,
  y,
  rotate,
  fill,
}: {
  x: number;
  y: number;
  rotate: number;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-58" y="-58" width="116" height="116" rx="30" fill={fill} />
      <circle cx="-21" cy="-21" r="6.5" fill="#fff" stroke="none" />
      <circle cx="20" cy="10" r="6.5" fill="#fff" stroke="none" />
    </g>
  );
}

export function HeroArt(props: Props) {
  return (
    <svg viewBox="0 0 786 786" fill="none" aria-hidden="true" {...props}>
      <circle cx="393" cy="393" r="393" fill={ORANGE} />
      <circle cx="393" cy="393" r="333" fill={LIME} />
      <circle cx="393" cy="393" r="274" fill={TEAL} />
      <circle cx="393" cy="393" r="214" fill={PURPLE} />
      <circle cx="393" cy="393" r="155" fill={CREAM} />
      <g stroke={INK} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        {/* left vape */}
        <g transform="rotate(-14 335 360)">
          <rect x="304" y="201" width="62" height="56" rx="12" fill={INK} />
          <rect x="297" y="247" width="76" height="232" rx="38" fill={TEAL} />
          <rect x="320" y="279" width="30" height="80" rx="15" fill={LIME} />
          <circle cx="335" cy="431" r="10" fill={CREAM} />
        </g>
        {/* right vape */}
        <g transform="rotate(14 465 370)">
          <rect x="434" y="211" width="62" height="56" rx="12" fill={INK} />
          <rect x="427" y="257" width="76" height="232" rx="38" fill={PINK} />
          <rect x="450" y="289" width="30" height="80" rx="15" fill={LIME} />
          <circle cx="465" cy="441" r="10" fill={CREAM} />
        </g>
        <Gummy x={235} y={532} rotate={-15} fill={LIME} />
        <Gummy x={485} y={545} rotate={-5} fill={PURPLE} />
        <Gummy x={355} y={567} rotate={10} fill={ORANGE} />
      </g>
    </svg>
  );
}

/** Outlined concentric rings used on the collection banner. */
export function RingsArt(props: Props) {
  return (
    <svg viewBox="0 0 464 464" fill="none" aria-hidden="true" {...props}>
      <g stroke={INK} strokeWidth="3">
        <circle cx="232" cy="232" r="229" />
        <circle cx="232" cy="232" r="181" />
        <circle cx="232" cy="232" r="133" />
        <circle cx="232" cy="232" r="85" />
        <circle cx="232" cy="232" r="36" fill={CREAM} />
      </g>
    </svg>
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

export function VapesIcon(props: Props) {
  return (
    <Icon {...props}>
      <g transform="rotate(-20 55 75)">
        <rect x="40" y="6" width="30" height="26" rx="7" fill={INK} />
        <rect x="37" y="24" width="36" height="104" rx="18" fill={TEAL} />
        <rect x="47" y="40" width="16" height="38" rx="8" fill={LIME} />
      </g>
      <g transform="rotate(18 108 72)">
        <rect x="94" y="8" width="28" height="24" rx="7" fill={INK} />
        <rect x="91" y="26" width="34" height="96" rx="17" fill={PINK} />
        <circle cx="108" cy="98" r="6" fill={CREAM} />
      </g>
    </Icon>
  );
}

export function KushIcon({
  body = "purple",
  ...props
}: Props & { body?: ColorName }) {
  return (
    <Icon {...props}>
      <g transform="rotate(-4 80 70)">
        <rect x="30" y="10" width="100" height="120" rx="18" fill={COLORS[body]} />
        <path d="M32 34h96" />
        <rect x="46" y="48" width="68" height="62" rx="14" fill={CREAM} />
        <path
          d="M80 56 C86 66 86 78 80 88 C74 78 74 66 80 56 Z M61 65 C71 68 77 77 80 88 C69 84 63 75 61 65 Z M99 65 C89 68 83 77 80 88 C91 84 97 75 99 65 Z M55 83 C64 81 73 83 80 89 C71 93 62 90 55 83 Z M105 83 C96 81 87 83 80 89 C89 93 98 90 105 83 Z"
          fill={body === "lime" ? TEAL : LIME}
          strokeWidth="4"
        />
        <path d="M80 89v11" strokeWidth="4" />
      </g>
    </Icon>
  );
}
