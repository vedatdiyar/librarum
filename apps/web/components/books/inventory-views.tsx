"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn
} from "@exlibris/ui";
import type { ApiBookListItem } from "@exlibris/types";

const STATUS_LABELS: Record<string, string> = {
  owned: "Sahibim",
  completed: "Okudum",
  abandoned: "Yarım Bıraktım",
  loaned: "Ödünç Verdim",
  lost: "Kayıp"
};

function statusBadgeVariant(status: ApiBookListItem["status"]) {
  if (status === "completed") return "success";
  if (status === "lost") return "destructive";
  return "muted";
}

function formatRating(rating: number | null) {
  return rating ? rating.toFixed(1) : "—";
}

export function BookCover({
  title,
  coverUrl,
  className
}: {
  title: string;
  coverUrl: string | null;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border/80 bg-surface-raised",
          className
        )}
      >
        <Image
          alt={`${title} kapağı`}
          className="object-cover"
          fill
          sizes="(max-width: 1280px) 96px, 112px"
          src={coverUrl}
        />
      </div>
    );
  }

  return (
    <div className={cn("book-placeholder aspect-[2/3] w-full rounded-lg p-3", className)}>
      <span className="line-clamp-3 font-display text-sm leading-5 text-text-primary">
        {title}
      </span>
    </div>
  );
}

export function BooksTable({
  items,
  selectedIds,
  onToggleRow,
  allVisibleSelected,
  onToggleAllVisible
}: {
  items: ApiBookListItem[];
  selectedIds: string[];
  onToggleRow: (id: string, index: number, withShift: boolean) => void;
  allVisibleSelected: boolean;
  onToggleAllVisible: (checked: boolean) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-border/60 bg-surface shadow-xl">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-raised/50">
            <TableHead className="w-12 text-center">
              <Checkbox
                aria-label="Tümünü seç"
                checked={allVisibleSelected}
                onChange={(event) => onToggleAllVisible(event.target.checked)}
              />
            </TableHead>
            <TableHead className="w-20">Kapak</TableHead>
            <TableHead>Kitap Başlığı</TableHead>
            <TableHead>Yazar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Konum</TableHead>
            <TableHead className="text-right">Puan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((book, index) => (
            <TableRow
              className={cn(
                "group transition-colors hover:bg-surface-raised/30",
                selectedIds.includes(book.id) && "bg-accent/4 hover:bg-accent/6"
              )}
              key={book.id}
            >
              <TableCell className="text-center">
                <Checkbox
                  aria-label={`${book.title} seç`}
                  checked={selectedIds.includes(book.id)}
                  onChange={(event) =>
                    onToggleRow(book.id, index, (event.nativeEvent as MouseEvent).shiftKey)
                  }
                />
              </TableCell>
              <TableCell>
                <Link href={`/books/${book.id}`}>
                  <BookCover
                    className="w-12 group-hover:shadow-lg group-hover:shadow-accent/5"
                    coverUrl={book.coverUrl}
                    title={book.title}
                  />
                </Link>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Link
                    className="font-display text-lg text-text-primary transition-colors hover:text-accent"
                    href={`/books/${book.id}`}
                  >
                    {book.title}
                  </Link>
                  <p className="font-meta text-[11px] text-text-secondary">
                    {book.isbn || "ISBN Yok"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {book.authors.map((author) => (
                    <Link
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                      href={`/authors/${author.id}`}
                      key={author.id}
                    >
                      {author.name}
                    </Link>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(book.status)}>{STATUS_LABELS[book.status]}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-text-secondary">
                  {book.location?.locationName || "—"}
                </span>
              </TableCell>
              <TableCell className="text-right font-display text-base text-text-primary">
                {formatRating(book.rating)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BooksGrid({
  items,
  selectedIds,
  onToggleRow
}: {
  items: ApiBookListItem[];
  selectedIds: string[];
  onToggleRow: (id: string, index: number, withShift: boolean) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((book, index) => (
        <Card
          className={cn(
            "group relative overflow-hidden transition-all hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5",
            selectedIds.includes(book.id) && "border-accent/50 bg-accent/4"
          )}
          key={book.id}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <Checkbox
                aria-label={`${book.title} seç`}
                checked={selectedIds.includes(book.id)}
                className="mt-1"
                onChange={(event) =>
                  onToggleRow(book.id, index, (event.nativeEvent as MouseEvent).shiftKey)
                }
              />
              <Badge variant={statusBadgeVariant(book.status)}>{STATUS_LABELS[book.status]}</Badge>
            </div>

            <Link className="mt-4 block" href={`/books/${book.id}`}>
              <BookCover
                className="mx-auto w-32 shadow-xl transition-transform duration-500 group-hover:scale-105"
                coverUrl={book.coverUrl}
                title={book.title}
              />
              <div className="mt-6 space-y-2 text-center">
                <h3 className="line-clamp-2 font-display text-xl leading-tight text-text-primary group-hover:text-accent">
                  {book.title}
                </h3>
                <p className="line-clamp-1 text-sm text-text-secondary">
                  {book.authors.map((a) => a.name).join(", ") || "Yazar yok"}
                </p>
              </div>
            </Link>

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-xs font-medium text-text-secondary">
                {book.location?.locationName || "—"}
              </span>
              <span className="font-display text-lg text-text-primary">{formatRating(book.rating)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
