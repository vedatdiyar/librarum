import {
  BookOpen,
  Boxes,
  BrainCircuit,
  Gauge,
  LibraryBig,
  Settings,
  Users
} from "lucide-react";

export const navigationItems = [
  {
    href: "/",
    label: "Genel Bakış",
    icon: Gauge
  },
  {
    href: "/books",
    label: "Kitaplar",
    icon: BookOpen
  },
  {
    href: "/authors",
    label: "Yazarlar",
    icon: Users
  },
  {
    href: "/series",
    label: "Seriler",
    icon: LibraryBig
  },
  {
    href: "/loans",
    label: "Ödünç İşlemleri",
    icon: Boxes
  },
  {
    href: "/ai-suggestions",
    label: "AI Önerileri",
    icon: BrainCircuit
  },
  {
    href: "/settings",
    label: "Ayarlar",
    icon: Settings
  }
] as const;
