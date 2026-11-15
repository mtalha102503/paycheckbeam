import { ImageResponse } from "next/og";

export const alt = "PaycheckBeam — Paycheck Calculator & Take-Home Pay by State (2026)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default Open Graph image for the homepage and every route without its own
// (state pages, tools, static pages). 1200x630 so Google Discover and
// social shares can use the large preview.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#2563eb", fontWeight: "bold", marginBottom: 20 }}>
          PaycheckBeam — Paycheck Calculator (2026)
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: "bold",
            marginBottom: 40,
            lineHeight: 1.12,
          }}
        >
          See Your Real Take-Home Pay
        </div>
        <div style={{ display: "flex", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: "#64748b" }}>Coverage</div>
            <div style={{ fontSize: 46, fontWeight: "bold" }}>50 states + DC</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: "#64748b" }}>Data source</div>
            <div style={{ fontSize: 46, fontWeight: "bold" }}>2026 IRS tables</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: "#64748b" }}>Cost</div>
            <div style={{ fontSize: 46, fontWeight: "bold" }}>Free · No sign-up</div>
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            height: 8,
            width: 220,
            background: "#2563eb",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
