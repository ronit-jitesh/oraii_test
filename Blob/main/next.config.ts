import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@deepgram/sdk",
    "@google-cloud/speech",
    "@google-cloud/translate",
    "ws",
  ],
};

export default nextConfig;
