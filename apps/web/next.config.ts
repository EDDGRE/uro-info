import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@uro-info/content", "@uro-info/ui"],
};

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // @serwist/next auto-registers the worker; precaching dev's ever-changing HMR chunks
  // causes registration failures, so the worker is disabled outside production builds.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
