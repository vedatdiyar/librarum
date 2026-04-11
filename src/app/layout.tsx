import type { Metadata, Viewport } from "next";
import { Poppins, Newsreader, Fredoka } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "./providers";
import "./globals.css";

const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "optional",
  preload: false,
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});



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
    <html lang="tr" data-scroll-behavior="smooth" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${fredoka.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Librarum" />
      </head>
      <body suppressHydrationWarning>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
