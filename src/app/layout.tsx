import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import { brand, sans, serif } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Librarum",
    default: "Librarum",
  },
  description: "Dijital kitap koleksiyonu ve kütüphane yönetim sistemi",
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr" data-scroll-behavior="smooth" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${brand.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Librarum" />
      </head>
      <body suppressHydrationWarning>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
