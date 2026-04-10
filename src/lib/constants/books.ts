import type { BookStatus } from "@/types";

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  owned: "Arşivde",
  completed: "Tamamlandı",
  abandoned: "Bırakıldı",
  loaned: "Ödünç Verildi",
  lost: "Kayıp"
};

export const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "owned", label: BOOK_STATUS_LABELS.owned },
  { value: "completed", label: BOOK_STATUS_LABELS.completed },
  { value: "abandoned", label: BOOK_STATUS_LABELS.abandoned },
  { value: "loaned", label: BOOK_STATUS_LABELS.loaned },
  { value: "lost", label: BOOK_STATUS_LABELS.lost }
] as const;

export const BOOK_FORM_STATUS_OPTIONS: Array<{ value: BookStatus; label: string }> = [
  { value: "owned", label: BOOK_STATUS_LABELS.owned },
  { value: "completed", label: BOOK_STATUS_LABELS.completed },
  { value: "abandoned", label: BOOK_STATUS_LABELS.abandoned },
  { value: "loaned", label: BOOK_STATUS_LABELS.loaned },
  { value: "lost", label: BOOK_STATUS_LABELS.lost }
];
