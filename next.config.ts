import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Tree-shake icon packages so only the icons actually imported are bundled.
   */
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
