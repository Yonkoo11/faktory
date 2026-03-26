import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/faktory",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
