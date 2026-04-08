import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../..")
  },
  transpilePackages: [
    "@exlibris/ui",
    "@exlibris/types",
    "@exlibris/lib",
    "@exlibris/ai",
    "@exlibris/db"
  ]
};

export default nextConfig;
