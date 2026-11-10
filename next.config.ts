import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean OpenAI-compatible and Anthropic-compatible gateway URLs.
  async rewrites() {
    return [
      { source: "/health", destination: "/api/health" },
      { source: "/v1/:path*", destination: "/api/v1/:path*" },
    ];
  },
};

export default nextConfig;
