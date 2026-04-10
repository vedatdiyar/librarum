"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText, MapPin, Star, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  cn
} from "@/components/ui";
import type { BookDetail, BookStatus } from "@/types";
import { EditBookFormTrigger } from "./edit-book-form-trigger";

const NOTE_CLASS_NAME =
  "min-h-[220px] w-full rounded-2xl border border-white/5 bg-white/1 px-6 py-5 text-sm leading-relaxed text-white/80 outline-none placeholder:text-foreground italic shadow-inner focus:border-primary/20 transition-all duration-300";

import { BOOK_STATUS_LABELS } from "@/lib/constants/books";

const STATUS_META: Record<
  BookStatus,
  { label: string; className: string; accentColor: string }
> = {
  owned: {
    label: BOOK_STATUS_LABELS.owned,
    className: "border-primary/20 bg-primary/5 text-primary",
    accentColor: "var(--primary)"
  },
  completed: {
    label: BOOK_STATUS_LABELS.completed,
    className: "border-emerald-400/20 bg-emerald-400/5 text-emerald-400/70",
    accentColor: "var(--chart-2)"
  },
  abandoned: {
    label: BOOK_STATUS_LABELS.abandoned,
    className: "border-amber-400/20 bg-amber-400/5 text-amber-400/70",
    accentColor: "var(--chart-4)"
  },
  loaned: {
    label: BOOK_STATUS_LABELS.loaned,
    className: "border-violet-400/20 bg-violet-400/5 text-violet-400/70",
    accentColor: "var(--chart-3)"
  },
  lost: {
    label: BOOK_STATUS_LABELS.lost,
    className: "border-rose-400/20 bg-rose-400/5 text-rose-400/70",
    accentColor: "var(--chart-5)"
  }
};

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) {
    return <p className="text-[11px] font-bold tracking-[0.15em] text-foreground uppercase italic">Henüz puan verilmemiş</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, rating - index));

          return (
              <span className="relative h-4.5 w-4.5" key={index}>
                <Star className="absolute inset-0 h-4.5 w-4.5 text-white/5" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className="h-4.5 w-4.5 fill-primary text-primary" />
                </span>
              </span>
          );
        })}
      </div>
      <span className="font-serif text-lg font-bold tracking-tight text-foreground">{rating.toFixed(1)} <span className="ml-1 font-sans text-sm font-medium text-foreground uppercase">/ 5.0</span></span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="grid items-start gap-2 border-b border-white/3 py-4 sm:grid-cols-[140px_1fr] sm:gap-8">
      <span className="text-[10px] font-bold tracking-[0.25em] text-foreground uppercase">{label}</span>
      <div className={cn("text-sm leading-relaxed font-medium tracking-tight text-white/90", valueClassName)}>{value}</div>
    </div>
  );
}

function formatBookMeta(book: BookDetail) {
  const pieces = [book.publisher, book.publicationYear?.toString(), book.pageCount ? `${book.pageCount} sayfa` : null]
    .filter((piece): piece is string => Boolean(piece));
  return pieces.length > 0 ? pieces.join(" • ") : "Bilgi verilmemiş";
}

function formatLocation(book: BookDetail) {
  if (!book.location) {
    return "Fiziksel konum bilinmiyor";
  }

  const parts = [];
  if (book.location.locationName) parts.push(book.location.locationName);
  if (book.location.shelfRow) parts.push(`Raf ${book.location.shelfRow}`);

  return parts.length > 0 ? parts.join(" / ") : "Bölge bilinmiyor";
}

function formatReadingDate(book: BookDetail) {
  if (!book.readYear) {
    return "Tarihsiz";
  }

  if (!book.readMonth) {
    return `${book.readYear}`;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric"
  }).format(new Date(book.readYear, book.readMonth - 1, 1));
}

function formatLoanDate(value: string | null) {
  if (!value) {
    return "Tarih bilinmiyor";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function BookMetaSection({ book }: { book: BookDetail }) {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          {book.authors.length > 0 ? (
            book.authors.map((author, idx) => (
              <React.Fragment key={author.id}>
                  {idx > 0 && <span className="text-foreground italic">&</span>}
                  <Link
                    className="font-serif text-2xl font-bold text-foreground transition-all duration-500 hover:-translate-y-0.5 hover:text-primary md:text-3xl"
                    href={`/authors/${author.slug}`}
                  >
                    {author.name}
                  </Link>
              </React.Fragment>
            ))
          ) : (
            <span className="font-serif text-2xl font-bold text-foreground italic">Bilinmeyen Yetkili</span>
          )}
        </div>

        <div className="glass-panel rounded-3xl border-white/5 bg-white/1 p-8 shadow-inner">
          <div className="divide-y divide-white/2">
            <DetailRow label="Yayın" value={formatBookMeta(book)} />
            <DetailRow label="Kimlik" value={book.isbn ?? "ISBN YOK"} valueClassName="font-mono text-[11px] font-bold tracking-[0.2em] text-foreground uppercase" />
            <DetailRow
              label="Süreklilik"
              value={
                book.series ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      className="font-bold text-primary transition hover:text-foreground"
                      href={`/series/${book.series.id}`}
                    >
                      {book.series.name}
                    </Link>
                    {book.series.seriesOrder ? (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-widest text-foreground uppercase">Cilt {book.series.seriesOrder}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-foreground italic">Müstakil Eser</span>
                )
              }
            />
            <DetailRow
              label="Alan"
              value={
                book.category ? (
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                    {book.category.name}
                  </div>
                ) : (
                  <span className="text-foreground italic">Kategorisiz Alan</span>
                )
              }
            />

          </div>
        </div>
      </div>

      <div className="glass-panel flex flex-col items-stretch gap-8 rounded-3xl border-border bg-card p-8 shadow-inner md:flex-row md:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Envanter Konumu</p>
          <p className="font-serif text-xl font-bold tracking-tight text-foreground italic">
            {formatLocation(book)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BookStatusAndNotesSection({
  book,
  onBookUpdated,
  invalidateBookQueries,
  setIsReturnDialogOpen,
  setIsDeleteDialogOpen
}: {
  book: BookDetail;
  onBookUpdated: (book: BookDetail, action?: "created" | "increase_copy" | "updated") => void;
  invalidateBookQueries: () => void;
  setIsReturnDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
}) {
  return (
    <div className="space-y-12">
      <div className="glass-panel group relative overflow-hidden rounded-3xl border-white/5 bg-white/1 p-8 md:p-12">
        <div className="relative space-y-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
                <div className="space-y-2">
                    <h3 className="font-serif text-4xl font-bold tracking-tight text-foreground">Eser Arşivi</h3>
                    <p className="max-w-xl text-[13px] leading-relaxed text-foreground italic"> Eserin arşivdeki güncel durumu, entelektüel hakimiyet ve kişisel yansımalar.</p>
                </div>
                <div className={cn("inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase", STATUS_META[book.status].className)}>
                    {STATUS_META[book.status].label}
                </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
                <div className="space-y-8">
                   <div className="space-y-2">
                        <label className="px-1 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase">Hakimiyet Puanı</label>
                        <RatingStars rating={book.rating} />
                   </div>

                   <div className="divide-y divide-white/4 rounded-2xl border border-white/5 bg-white/1 px-6">
                        <DetailRow label="Okuma Kaydı" value={formatReadingDate(book)} />
                        <DetailRow
                        label="Ödünç"
                        value={
                            book.loanedTo ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-primary">{book.loanedTo}</p>
                                    <p className="text-xs text-foreground italic">{formatLoanDate(book.loanedAt)} tarihinden beri</p>
                                </div>
                            ) : "Aktif ödünç yok"
                        }
                        />
                        <DetailRow
                        label="Envanter"
                        value={`${book.copyCount} fiziksel nüsha`}
                        />
                        <DetailRow
                        label="Bağış"
                        value={book.donatable ? "Bağışlanabilir" : "Arşiv Temel Parçası"}
                        valueClassName={book.donatable ? "text-emerald-400" : "text-foreground italic"}
                        />
                   </div>
                </div>

                <div className="space-y-3">
                    <label className="px-1 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="personal-note">
                        Kişisel Yansımalar
                    </label>
                    <div className="relative">
                        <textarea
                            aria-label="Kişisel düşünceler"
                            className={NOTE_CLASS_NAME}
                            id="personal-note"
                            readOnly
                            value={book.personalNote ?? "Arşivler bu eser hakkında sessiz. Henüz bir yansıma kaydedilmemiş."}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/5 pt-8 md:flex-row">
                <EditBookFormTrigger
                    bookSlug={book.slug}
                    buttonProps={{ className: "flex-1 h-14 rounded-xl bg-white text-black hover:bg-primary transition-all duration-500 shadow-2xl font-bold uppercase tracking-widest text-[11px]", size: "lg" }}
                    onSuccess={onBookUpdated}
                />

                {book.status === "loaned" ? (
                    <Button
                    className="h-14 flex-1 rounded-xl border border-primary/20 bg-primary/10 text-[11px] font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/20"
                    onClick={() => setIsReturnDialogOpen(true)}
                    size="lg"
                    variant="ghost"
                    >
                    <BookOpenText className="mr-2 h-4 w-4" />
                    İade İşlemi
                    </Button>
                ) : null}

                <Button
                    className="h-14 rounded-xl border border-destructive/20 bg-destructive/10 px-8 text-[11px] font-bold tracking-widest text-destructive uppercase transition-all hover:bg-destructive/20"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    size="lg"
                    variant="ghost"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Kaldır
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
