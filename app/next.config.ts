import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Only use static export + basePath for GitHub Pages deployment
  ...(isGitHubPages ? {
    output: "export",
    basePath: "/faktory",
  } : {}),
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
