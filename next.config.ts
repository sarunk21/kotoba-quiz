import type { NextConfig } from "next";

const isExport = process.env.NEXT_PUBLIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  output: isExport ? 'export' : undefined,
  images: {
    unoptimized: isExport ? true : undefined,
  },
};

export default nextConfig;
