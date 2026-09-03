import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The block IS the tile: iOS masks it to a rounded square, so only the
// gate interior is drawn, in frost on the void (touch icons are opaque).
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
        }}
      >
        <svg width="150" height="150" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#F4F7FA" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 12.5C11.5 12.5 11 16 13 16" />
            <path d="M8.5 19.5C11.5 19.5 11 16 13 16" />
            <path d="M17 10V22" />
            <circle cx="22.5" cy="16" r="2.1" fill="#F4F7FA" stroke="none" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
