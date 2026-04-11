import { Fredoka, Newsreader, Poppins } from "next/font/google";

export const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-next",
  display: "swap",
  preload: false,
});

export const serif = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif-next",
  display: "optional",
  preload: false,
});

export const brand = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand-next",
  display: "swap",
  preload: false,
});
