import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
  async rewrites() {
    // Blogger-style URLs (/2026/11/slug.html) are served by the extension-less route.
    return [
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:slug.html",
        destination: "/:year/:month/:slug",
      },
    ];
  },
  async redirects() {
    return [
      { source: "/feeds/posts/default", destination: "/feed.xml", permanent: true },
      { source: "/search/label/:label", destination: "/topics/:label", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})", destination: "/blog", permanent: true },
      { source: "/2020/12/introducing-with-pr.html", destination: "/", permanent: true },
      { source: "/2022/06/introduction-to-java-programming.html", destination: "/", permanent: true },
      { source: "/2022/07/java-terminology.html", destination: "/", permanent: true },
      { source: "/2022/11/oops-is-java-pure-object-oriented.html", destination: "/", permanent: true },
      { source: "/topics/java", destination: "/", permanent: true },
    ];
  },
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
