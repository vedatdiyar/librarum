"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText, MapPin, Star, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn
} from "@librarum/ui";
import type { BookDetail, BookStatus } from "@librarum/types";
import { EditBookFormTrigger } from "@/components/books/edit-book-form-trigger";

const NOTE_CLASS_NAME =
  "min-h-[180px] w-full rounded-[22px] border border-border/80 bg-surface-raised px-4 py-3 text-sm leading-7 text-text-primary outline-none placeholder:text-text-secondary/60";

const STATUS_META: Record<
  BookStatus,
  { label: string; className: string; accentClassName: string }
> = {
  owned: {
    label: "Sahibim",
    className: "border border-sky-400/25 bg-sky-400/12 text-sky-200",
    accentClassName: "text-sky-200"
  },
  completed: {
    label: "Okudum",
    className: "border border-emerald-400/25 bg-emerald-400/12 text-emerald-200",
    accentClassName: "text-emerald-200"
  },
  abandoned: {
    label: "Yarim Biraktim",
    className: "border border-amber-400/25 bg-amber-400/12 text-amber-200",
    accentClassName: "text-amber-200"
  },
  loaned: {
    label: "Odunc Verdim",
    className: "border border-violet-400/25 bg-violet-400/12 text-violet-200",
    accentClassName: "text-violet-200"
  },
  lost: {
    label: "Kayip",
    className: "border border-rose-400/25 bg-rose-400/12 text-rose-200",
    accentClassName: "text-rose-200"
  }
};

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) {
    return <p className="text-sm text-text-secondary">Puan verilmedi</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, rating - index));

          return (
            <span className="relative h-5 w-5" key={index}>
              <Star className="absolute inset-0 h-5 w-5 text-border" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="h-5 w-5 fill-accent text-accent" />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm font-medium text-text-primary">{rating.toFixed(1)} / 5</span>
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
    <div className="grid gap-1 sm:grid-cols-[120px,1fr] sm:gap-4">
      <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">{label}</span>
      <div className={cn("text-sm leading-7 text-text-primary", valueClassName)}>{value}</div>
    </div>
  );
}

function formatBookMeta(book: BookDetail) {
  const pieces = [book.publisher, book.publicationYear?.toString(), book.pageCount ? `${book.pageCount} sayfa` : null]
    .filter((piece): piece is string => Boolean(piece));

  return pieces.length > 0 ? pieces.join(" / ") : "Bilgi belirtilmedi";
}

function formatLocation(book: BookDetail) {
  if (!book.location) {
    return "Konum belirtilmedi";
  }

  return [
    book.location.locationName ?? "Alan yok",
    book.location.shelfRow ?? "Raf yok",
    book.location.shelfColumn?.toString() ?? "Sutun yok"
  ].join(" / ");
}

function formatReadingDate(book: BookDetail) {
  if (!book.readYear) {
    return "Belirtilmedi";
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
    return "Tarih belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function BookMetaSection({ book }: { book: BookDetail }) {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {book.authors.length > 0 ? (
            book.authors.map((author) => (
              <Link
                className="text-base text-text-primary transition hover:text-text-secondary"
                href={`/authors/${author.id}`}
                key={author.id}
              >
                {author.name}
              </Link>
            ))
          ) : (
            <span className="text-base text-text-secondary">Yazar belirtilmedi</span>
          )}
        </div>

        <div className="panel-muted p-5">
          <div className="grid gap-4">
            <DetailRow label="Yayin" value={formatBookMeta(book)} />
            <DetailRow label="ISBN" value={book.isbn ?? "Belirtilmedi"} valueClassName="font-meta text-xs" />
            <DetailRow
              label="Seri"
              value={
                book.series ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="text-text-primary transition hover:text-text-secondary"
                      href={`/series/${book.series.id}`}
                    >
                      {book.series.name}
                    </Link>
                    {book.series.seriesOrder ? (
                      <span className="text-text-secondary">Cilt {book.series.seriesOrder}</span>
                    ) : null}
                  </div>
                ) : (
                  "Seri bilgisi yok"
                )
              }
            />
            <DetailRow
              label="Kategori"
              value={
                book.category ? (
                  <Badge className="w-fit" variant="accent">
                    {book.category.name}
                  </Badge>
                ) : (
                  "Kategori belirtilmedi"
                )
              }
            />
            <DetailRow
              label="Etiketler"
              value={
                book.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag) => (
                      <Badge className="w-fit" key={tag.id} variant="muted">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "Etiket eklenmedi"
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="panel-muted p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium text-text-primary">Konum</p>
        </div>
        <p className="text-base leading-7 text-text-primary">{formatLocation(book)}</p>
      </div>
    </div>
  );
}

export function BookStatusAndNotesSection({
  book,
  bookId,
  invalidateBookQueries,
  setIsReturnDialogOpen,
  setIsDeleteDialogOpen
}: {
  book: BookDetail;
  bookId: string;
  invalidateBookQueries: () => void;
  setIsReturnDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-3xl">Durum ve Notlar</CardTitle>
            <CardDescription>
              Kaydin guncel durumu, puanlama ve kisisel notlar.
            </CardDescription>
          </div>
          <Badge className={cn("shrink-0", STATUS_META[book.status].className)}>
            {STATUS_META[book.status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="panel-muted p-5">
          <div className="space-y-4">
            <DetailRow label="Puan" value={<RatingStars rating={book.rating} />} />
            <DetailRow label="Okuma tarihi" value={formatReadingDate(book)} />
            <DetailRow
              label="Odunc"
              value={
                book.loanedTo ? `${book.loanedTo} - ${formatLoanDate(book.loanedAt)}` : "Odunc kaydi yok"
              }
            />
            <DetailRow
              label="Kopya"
              value={`${book.copyCount} adet`}
            />
            <DetailRow
              label="Bagis"
              value={book.donatable ? "Bagislanabilir" : "Bagisa uygun degil"}
              valueClassName={book.donatable ? "text-emerald-200" : undefined}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary" htmlFor="personal-note">
            Kisisel not
          </label>
          <textarea
            aria-label="Kisisel not"
            className={NOTE_CLASS_NAME}
            id="personal-note"
            readOnly
            value={book.personalNote ?? "Bu kitap icin not eklenmemis."}
          />
        </div>

        <div className="flex flex-col gap-3">
          <EditBookFormTrigger
            bookId={bookId}
            buttonProps={{ className: "w-full", size: "lg" }}
            onSuccess={invalidateBookQueries}
          />

          {book.status === "loaned" ? (
            <Button
              className="w-full"
              onClick={() => setIsReturnDialogOpen(true)}
              size="lg"
              variant="secondary"
            >
              <BookOpenText className="mr-2 h-4 w-4" />
              Iade Edildi
            </Button>
          ) : null}

          <Button
            className="w-full"
            onClick={() => setIsDeleteDialogOpen(true)}
            size="lg"
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
