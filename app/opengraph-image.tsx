import { ImageResponse } from "next/og";

export const alt = "MaydaLabs — Software people can feel";
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
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#090909",
          color: "#f2f0ea",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -240,
            left: -230,
            display: "flex",
            width: 650,
            height: 650,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(247,147,26,.24), rgba(9,9,9,0) 68%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "66%",
            padding: "58px 0 52px 62px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 19, fontWeight: 700, letterSpacing: 5 }}>
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" style={{ marginRight: 16 }}>
              <path d="M6 5H11L17 11V29L11 35H6V5Z" fill="#F2F0EA" />
              <path d="M34 5H29L23 11V29L29 35H34V5Z" fill="#F2F0EA" />
              <circle cx="20" cy="20" r="3.5" fill="#F39A36" />
            </svg>
            MAYDALABS
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 600, lineHeight: 0.98, letterSpacing: -4 }}>
              We build software
            </div>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 600, lineHeight: 0.98, letterSpacing: -4 }}>
              people can&nbsp;<span style={{ color: "#f39a36", fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>feel.</span>
            </div>
            <div style={{ display: "flex", marginTop: 30, color: "rgba(242,240,234,.56)", fontSize: 22 }}>
              Product · Commerce · Growth systems
            </div>
          </div>

          <div style={{ display: "flex", color: "rgba(242,240,234,.42)", fontSize: 15, letterSpacing: 3 }}>
            ISTANBUL / EVERYWHERE · ML / 2026
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34%",
          }}
        >
          <div style={{ position: "absolute", display: "flex", width: 330, height: 330, border: "1px solid rgba(242,240,234,.13)", borderRadius: 999 }} />
          <div style={{ position: "absolute", display: "flex", width: 220, height: 220, border: "1px solid rgba(247,147,26,.32)", borderRadius: 999 }} />
          <div style={{ position: "absolute", display: "flex", width: 110, height: 110, border: "1px solid rgba(247,147,26,.5)", borderRadius: 999 }} />
          <div style={{ display: "flex", width: 18, height: 18, borderRadius: 999, background: "#f39a36", boxShadow: "0 0 42px rgba(247,147,26,.8)" }} />
          <div
            style={{
              position: "absolute",
              top: 145,
              right: 38,
              display: "flex",
              flexDirection: "column",
              width: 178,
              padding: "16px 18px",
              border: "1px solid rgba(242,240,234,.16)",
              borderRadius: 16,
              background: "rgba(16,16,15,.92)",
            }}
          >
            <span style={{ color: "rgba(242,240,234,.42)", fontSize: 11, letterSpacing: 2 }}>BUILD / 01</span>
            <span style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>Marketplace</span>
            <span style={{ marginTop: 7, color: "#f39a36", fontSize: 11, letterSpacing: 2 }}>SHIPPING</span>
          </div>
        </div>

        <div style={{ position: "absolute", right: 0, bottom: 0, display: "flex", width: 22, height: 170, background: "#f39a36" }} />
      </div>
    ),
    size,
  );
}
