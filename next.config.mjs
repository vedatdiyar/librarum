const r2PublicUrl = process.env.LIBRARUM_R2_PUBLIC_URL
  ? new URL(process.env.LIBRARUM_R2_PUBLIC_URL)
  : null;
const disableImageOptimizationInDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.152.140.195"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
      "recharts"
    ]
  },
  images: {
    unoptimized: disableImageOptimizationInDev,
    qualities: [70, 75, 90],
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
      {
        protocol: "https",
        hostname: "*.archive.org"
      },
      {
        protocol: "https",
        hostname: "*.r2.dev"
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
  }
};

export default nextConfig;
