import {
  BookOpen,
  Boxes,
  BrainCircuit,
  Gauge,
  LibraryBig,
  Settings,
  Users
} from "lucide-react";

export const appPageTitles = {
  home: "Ana Sayfa",
  books: "Kitaplar",
  newBook: "Yeni Kitap",
  authors: "Yazarlar",
  series: "Seriler",
  loans: "Ödünç Verilenler",
  aiSuggestions: "Akıllı Öneriler",
  settings: "Ayarlar"
} as const;

export const navigationItems = [
  {
    href: "/",
    label: appPageTitles.home,
    icon: Gauge
  },
  {
    href: "/books",
    label: appPageTitles.books,
    icon: BookOpen
  },
  {
    href: "/authors",
    label: appPageTitles.authors,
    icon: Users
  },
  {
    href: "/series",
    label: appPageTitles.series,
    icon: LibraryBig
  },
  {
    href: "/loans",
    label: appPageTitles.loans,
    icon: Boxes
  },
  {
    href: "/ai-suggestions",
    label: appPageTitles.aiSuggestions,
    icon: BrainCircuit
  },
  {
    href: "/settings",
    label: appPageTitles.settings,
    icon: Settings
  }
] as const;
