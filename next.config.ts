import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/vechain-disperse" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
