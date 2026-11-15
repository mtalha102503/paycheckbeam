import { ImageResponse } from "next/og";
import { getBlogPost } from "@/lib/blog";

export const alt = "PaycheckBeam Blog — Paycheck guides, 2026 figures";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-post Open Graph image: the article title on the brand layout.
// Gives every blog post the large (1200x630) image Google Discover and
// social shares need — posts previously had no og:image at all.
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const title = post?.title ?? "Paycheck Guides & 2026 Figures";
  const fontSize = title.length > 70 ? 50 : title.length > 45 ? 58 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#2563eb", fontWeight: "bold", marginBottom: 20 }}>
            PaycheckBeam Blog
          </div>
          <div style={{ fontSize, fontWeight: "bold", lineHeight: 1.18 }}>
            {title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 24, color: "#64748b" }}>
            Verified 2026 IRS figures
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>
            paycheckbeam.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
