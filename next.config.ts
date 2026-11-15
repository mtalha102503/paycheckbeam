import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Plain SSG (same architecture as visatalentusa / fedtalentusa).
     NOTE: cacheComponents is deliberately OFF: with it enabled, an unknown
     [stateSlug] renders the not-found UI with HTTP 200 (soft 404), and
     `dynamicParams = false` is rejected at build time. Classic SSG gives a
     real 404 for unknown slugs. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
