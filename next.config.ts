import type { NextConfig } from "next";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa");

const isVercel = !!process.env.VERCEL;

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" as const }),
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default pwaConfig(nextConfig);
