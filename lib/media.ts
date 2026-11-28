export const BRAND_LOGO_URL =
  "https://res.cloudinary.com/eshrmvst/image/upload/v1795584299/momo-eliquid/brand/logo.jpg";

export const MEDIA_IMAGES = {
  vapes: {
    sodaLish:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584272/momo-eliquid/vapes/image-1.png",
    kuroMomoFuji:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584282/momo-eliquid/vapes/image-2.jpg",
    expodProCola:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584286/momo-eliquid/vapes/image-3.jpg",
  },
  gummies: {
    blueRaspberryRings:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584289/momo-eliquid/gummies/image-1.jpg",
    wildBerryBites:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584290/momo-eliquid/gummies/image-2.jpg",
    sourAppleCubes:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584292/momo-eliquid/gummies/image-3.webp",
  },
  kush: {
    ogKushReserve:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584293/momo-eliquid/kush/image-1.webp",
    purpleKush:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584296/momo-eliquid/kush/image-2.webp",
    lemonKush:
      "https://res.cloudinary.com/eshrmvst/image/upload/v1795584297/momo-eliquid/kush/image-3.webp",
  },
  brandLogo: BRAND_LOGO_URL,
} as const;

/** Returns true for local paths and configured Cloudinary URLs handled by next/image. */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  return src.startsWith("https://res.cloudinary.com/eshrmvst/");
}
