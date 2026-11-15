import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { ALL_STATE_SLUGS } from "@/lib/stateTaxData";

export default function sitemap() {
  const now = new Date();
  const staticRoutes = ["", "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/cookies", "/blog", "/blog/how-to-read-a-pay-stub"];
  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...ALL_STATE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
