import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plesk/Passenger deploy: the host builds this itself (git pull -> Run script
  // "build" -> Restart App), so /.next/ stays gitignored and is never shipped.
  // Start command must be `node .next/standalone/server.js`. See docs/DEPLOY.md.
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
