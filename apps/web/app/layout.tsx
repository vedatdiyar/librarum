import type { Metadata, Viewport } from "next";
import "@fontsource/inter";
import "@fontsource/playfair-display";
import "@fontsource/jetbrains-mono";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExLibris",
  description: "Kişisel kitap arşivi ve kütüphane yönetim sistemi",
};

export const viewport: Viewport = {
  themeColor: "#0e1112",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="tr">
      <head>
        <meta name="apple-mobile-web-app-title" content="Ex Libris" />
      </head>
      <body>
        <Providers session={session}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
