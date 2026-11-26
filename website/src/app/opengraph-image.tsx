import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          color: "white",
          background: "linear-gradient(135deg, #11445a 0%, #0b6687 55%, #0ea2d2 100%)",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>{SITE.name}</div>
        <div style={{ marginTop: 28, fontSize: 40, opacity: 0.9 }}>{SITE.tagline}</div>
        <div style={{ marginTop: 56, fontSize: 30, opacity: 0.75 }}>pradeeppanga.com</div>
      </div>
    ),
    size,
  );
}
