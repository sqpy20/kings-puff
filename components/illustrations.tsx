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
        {/* syrup bottle */}
        <g transform="rotate(-8 384 365)">
          <rect x="352" y="172" width="64" height="50" rx="10" fill={INK} />
          <rect x="363" y="216" width="42" height="36" fill={CREAM} />
          <rect x="309" y="247" width="150" height="236" rx="30" fill={PINK} />
          <rect x="331" y="318" width="106" height="84" rx="10" fill={CREAM} />
          <path d="M351 362q11-15 22 0t22 0 22 0" />
        </g>
        {/* vape */}
        <g transform="rotate(14 495 375)">
          <rect x="464" y="216" width="62" height="56" rx="12" fill={INK} />
          <rect x="457" y="262" width="76" height="232" rx="38" fill={PINK} />
          <rect x="480" y="294" width="30" height="80" rx="15" fill={LIME} />
          <circle cx="495" cy="446" r="10" fill={CREAM} />
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

export function SyrupIcon({
  body = "lime",
  ...props
}: Props & { body?: ColorName }) {
  return (
    <Icon {...props}>
      <rect x="65" y="4" width="30" height="22" rx="6" fill={INK} />
      <rect x="70" y="24" width="20" height="16" fill={CREAM} />
      <rect x="42" y="38" width="76" height="98" rx="14" fill={COLORS[body]} />
      <rect x="52" y="70" width="56" height="40" rx="8" fill={CREAM} />
      <path d="M62 91q6-9 12 0t12 0 12 0" />
    </Icon>
  );
}

export function WrapsIcon({
  box = "purple",
  ...props
}: Props & { box?: ColorName }) {
  return (
    <Icon {...props}>
      <g transform="rotate(-4 86 70)">
        <rect x="32" y="14" width="108" height="76" rx="8" fill={COLORS[box]} />
        <path d="M52 54q11-13 22 0t22 0 22 0" stroke="#fff" />
        <rect x="14" y="94" width="142" height="30" rx="15" fill={ORANGE} />
        <path d="M50 96v26M85 96v26M120 96v26" />
      </g>
    </Icon>
  );
}

export function AccessoriesIcon({
  ring = "pink",
  ...props
}: Props & { ring?: ColorName }) {
  return (
    <Icon {...props}>
      <circle cx="56" cy="74" r="46" fill={COLORS[ring]} />
      <circle cx="56" cy="74" r="27" fill={CREAM} />
      <circle cx="56" cy="74" r="9" fill={INK} />
      <rect x="116" y="20" width="30" height="26" rx="6" fill={INK} />
      <rect x="113" y="42" width="36" height="80" rx="8" fill={LIME} />
    </Icon>
  );
}

export function JarIcon({
  gummies = ["lime", "purple", "orange"],
  ...props
}: Props & { gummies?: ColorName[] }) {
  return (
    <Icon viewBox="0 0 160 196" {...props}>
      <rect x="8" y="24" width="144" height="166" rx="22" fill={CREAM} />
      <rect x="6" y="6" width="148" height="42" rx="18" fill={INK} />
      <rect x="26" y="78" width="48" height="48" rx="13" fill={COLORS[gummies[0]]} transform="rotate(-8 50 102)" />
      <rect x="86" y="90" width="48" height="48" rx="13" fill={COLORS[gummies[1]]} transform="rotate(6 110 114)" />
      <rect x="54" y="128" width="50" height="46" rx="13" fill={COLORS[gummies[2]]} />
    </Icon>
  );
}

export function VapeIcon({
  body = "teal",
  ...props
}: Props & { body?: ColorName }) {
  return (
    <Icon viewBox="0 0 110 224" {...props}>
      <g transform="rotate(12 55 112)">
        <rect x="36" y="6" width="40" height="38" rx="10" fill={INK} />
        <rect x="28" y="34" width="56" height="180" rx="28" fill={COLORS[body]} />
        <rect x="43" y="60" width="26" height="64" rx="13" fill={body === "lime" ? CREAM : LIME} />
        <circle cx="56" cy="174" r="8" fill={CREAM} />
      </g>
    </Icon>
  );
}
