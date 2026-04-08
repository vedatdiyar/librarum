import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r2PublicUrl = process.env.LIBRARUM_R2_PUBLIC_URL
  ? new URL(process.env.LIBRARUM_R2_PUBLIC_URL)
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    optimizePackageImports: [
      "@librarum/ui",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
      "recharts"
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org"
      },
      {
        protocol: "https",
        hostname: "books.google.com"
      },
      {
        protocol: "https",
        hostname: "books.googleusercontent.com"
      },
      ...(r2PublicUrl
        ? [
            {
              protocol: r2PublicUrl.protocol.replace(":", ""),
              hostname: r2PublicUrl.hostname
            }
          ]
        : [])
    ]
  },
  transpilePackages: [
    "@librarum/ui",
    "@librarum/types",
    "@librarum/lib",
    "@librarum/ai",
    "@librarum/db"
  ]
};

export default nextConfig;
