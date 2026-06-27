import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Nogaritics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#4f46e5",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "128px",
            height: "128px",
            borderRadius: "20px",
            background: "white",
            fontSize: "88px",
            fontFamily: "serif",
            fontWeight: 900,
            color: "#4f46e5",
            lineHeight: "1",
            paddingBottom: "4px",
          }}
        >
          ℕ
        </div>
        <span
          style={{
            color: "white",
            fontSize: "80px",
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: "-1px",
          }}
        >
          Nogaritics
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
