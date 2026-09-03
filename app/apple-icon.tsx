import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The MaydaLabs mark (see components/Logo.tsx) on the void, monochrome
// frost — Apple touch icons are opaque PNGs, so no gradient here.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0B0F",
          borderRadius: 40,
        }}
      >
        <svg width="124" height="124" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#F4F7FA" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 26V6" />
            <path d="M25 26V6" />
            <path d="M7 13.5 13 20.5 25 6" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
