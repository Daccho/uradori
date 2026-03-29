import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://uradori-api.uradori.workers.dev"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
