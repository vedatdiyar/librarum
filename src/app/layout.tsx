import type { Metadata, Viewport } from "next";
import "@fontsource/inter";
import "@fontsource/playfair-display";
import "@fontsource/jetbrains-mono";
import { auth } from "@/auth";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Librarum",
  description: "Kişisel kitap arşivi ve kütüphane yönetim sistemi",
};

export const viewport: Viewport = {
  themeColor: "#0f1314",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-title" content="Librarum" />
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
