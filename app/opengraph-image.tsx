import { ImageResponse } from "next/og";

export const alt = "Momo Eliquid · UK E-Liquids, Gummies & Small-Batch Kush";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#7c58e0",
          color: "#ffffff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#dbf063",
              color: "#212121",
              fontSize: 22,
              fontWeight: 800,
              padding: "12px 24px",
              borderRadius: 999,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Same-day UK dispatch before 2PM
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: "#fdf3e4",
            }}
          >
            18+ UK Storefront
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            Momo Eliquid®
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 500,
              color: "#fdf3e4",
              maxWidth: 920,
              lineHeight: 1.3,
            }}
          >
            UK-made e-liquids, ExPod Pro pods, clearly dosed THC gummies &amp;
            small-batch Kush.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#ee5d87",
              color: "#212121",
              fontSize: 26,
              fontWeight: 800,
              padding: "14px 28px",
              borderRadius: 999,
              border: "3px solid #212121",
            }}
          >
            Vapes
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "#dbf063",
              color: "#212121",
              fontSize: 26,
              fontWeight: 800,
              padding: "14px 28px",
              borderRadius: 999,
              border: "3px solid #212121",
            }}
          >
            Gummies
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "#7cd8c0",
              color: "#212121",
              fontSize: 26,
              fontWeight: 800,
              padding: "14px 28px",
              borderRadius: 999,
              border: "3px solid #212121",
            }}
          >
            Kush
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
