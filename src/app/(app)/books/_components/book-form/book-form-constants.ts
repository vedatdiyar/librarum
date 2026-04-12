import type { BookStatus } from "@/types";

export const STATUS_META: Record<
  BookStatus,
  {
    label: string;
    className: string;
  }
> = {
  owned: {
    label: "Koleksiyonda",
    className: "border-primary/20 bg-primary/8 text-primary"
  },
  completed: {
    label: "Tamamlandı",
    className: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300"
  },
  abandoned: {
    label: "Yarım Bırakıldı",
    className: "border-amber-400/20 bg-amber-400/8 text-amber-300"
  },
  loaned: {
    label: "Ödünç Verildi",
    className: "border-violet-400/20 bg-violet-400/8 text-violet-300"
  },
  lost: {
    label: "Kayıp",
    className: "border-rose-400/20 bg-rose-400/8 text-rose-300"
  }
};

export function toSafeCoverPreviewUrl(url: string | null) {
  if (!url) {
    return null;
  }

  if (url.startsWith("/api/books/cover/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const key = parsed.pathname.startsWith("/")
      ? parsed.pathname.slice(1)
      : parsed.pathname;

    // R2 object paths are stored as books/covers/<id>.<ext>; proxy through our API route.
    if (!key.startsWith("books/covers/")) {
      return url;
    }

    const encodedKey = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `/api/books/cover/${encodedKey}`;
  } catch {
    return url;
  }
}
