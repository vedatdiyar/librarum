"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn
} from "@/components/ui";
import type { ApiBookListItem } from "@/types";
import { splitBookDisplayTitle } from "@/lib/shared/book-title";

import { BOOK_STATUS_LABELS } from "@/lib/constants/books";

const STATUS_LABELS = BOOK_STATUS_LABELS;

const STATUS_COLORS: Record<string, string> = {
  owned: "text-primary border-primary/20 bg-primary/5",
  completed: "text-emerald-400/70 border-emerald-400/20 bg-emerald-400/5",
  abandoned: "text-amber-400/70 border-amber-400/20 bg-amber-400/5",
  loaned: "text-violet-400/70 border-violet-400/20 bg-violet-400/5",
  lost: "text-rose-400/70 border-rose-400/20 bg-rose-400/5"
};

function BookTitleBlock({ title, subtitle, className }: { title: string; subtitle?: string | null; className?: string }) {
  const displayTitle = splitBookDisplayTitle(title, subtitle);

  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <span className="block text-base font-bold tracking-tight text-white transition-colors group-hover:text-primary">
        {displayTitle.title}
      </span>
      {displayTitle.subtitle ? (
        <span className="line-clamp-2 block text-[11px] leading-snug font-semibold tracking-wide text-foreground uppercase">
          {displayTitle.subtitle}
        </span>
      ) : null}
    </div>
  );
}

function formatRating(rating: number | null) {
  return rating ? rating.toFixed(1) : "—";
}

export function BookCover({
  title,
  subtitle,
  coverUrl,
  className
}: {
  title: string;
  subtitle?: string | null;
  coverUrl: string | null;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <div
        className={cn(
          "relative aspect-2/3 w-full overflow-hidden rounded-lg border border-white/10 bg-white/2 shadow-2xl transition-all duration-500",
          className
        )}
      >
        <Image alt="" className="object-cover opacity-30 blur-xl" fill sizes="(max-width: 1280px) 120px, 160px" src={coverUrl} />
        <Image
          alt={`${splitBookDisplayTitle(title, subtitle).title || title} kapağı`}
          className="relative object-contain transition-transform duration-700 group-hover:scale-110"
          fill
          sizes="(max-width: 1280px) 120px, 160px"
          src={coverUrl}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <div className={cn("flex aspect-2/3 w-full flex-col items-center justify-end rounded-lg border border-white/10 bg-white/2 p-4 text-center shadow-2xl transition-all duration-500 group-hover:border-white/20", className)}>
      <span className="line-clamp-4 font-serif text-[11px] leading-relaxed tracking-tighter text-foreground uppercase">
        {title}
      </span>
      <div className="mt-4 h-1 w-8 rounded-full bg-white/5 transition-colors group-hover:bg-primary/20" />
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
    <div className="relative overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/5 hover:bg-transparent">
            <TableHead className="w-12 text-center">
              <Checkbox
                aria-label="Hepsini seç"
                checked={allVisibleSelected}
                id="select-all-books"
                name="selectAll"
                onChange={(event) => onToggleAllVisible(event.target.checked)}
              />
            </TableHead>
            <TableHead className="w-24 px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">KAPAK</TableHead>
            <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">BAŞLIK VE KİMLİK</TableHead>
            <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">YAZARLAR</TableHead>
            <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">DURUM</TableHead>
            <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">KONUM</TableHead>
            <TableHead className="px-4 py-4 text-right text-[9px] font-bold tracking-wider text-foreground/40 uppercase">PUAN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((book, index) => (
            <TableRow
              className={cn(
                "group border-b border-white/2 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 last:border-0 hover:bg-white/3",
                selectedIds.includes(book.id) && "bg-primary/10 hover:bg-primary/15"
              )}
              key={book.id}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <TableCell className="px-4 py-3 text-center">
                <Checkbox
                  aria-label={`Seç: ${book.title}`}
                  checked={selectedIds.includes(book.id)}
                  id={`select-book-${book.id}`}
                  name={`select-book-${book.id}`}
                  onChange={(event) =>
                    onToggleRow(book.id, index, (event.nativeEvent as MouseEvent).shiftKey)
                  }
                />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Link href={`/books/${book.slug}`}>
                  <BookCover
                    className="w-14 shadow-lg group-hover:scale-110"
                    coverUrl={book.coverUrl}
                    subtitle={book.subtitle}
                    title={book.title}
                  />
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="space-y-1">
                  <Link
                    className="block"
                    href={`/books/${book.slug}`}
                  >
                    <BookTitleBlock subtitle={book.subtitle} title={book.title} />
                  </Link>
                  <p className="font-mono text-[10px] font-bold tracking-widest text-foreground uppercase">
                    {book.isbn || "ISBN YOK"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {book.authors.map((author) => (
                    <Link
                      className="text-sm font-medium text-foreground transition-colors hover:text-white"
                      href={`/authors/${author.slug}`}
                      key={author.id}
                    >
                      {author.name}
                    </Link>
                  ))}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase", STATUS_COLORS[book.status])}>
                  {STATUS_LABELS[book.status]}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <span className="text-[13px] font-medium text-foreground">
                  {book.status === "loaned" ? (
                    book.loanedTo || "—"
                  ) : (
                    <>
                      {book.location?.locationName || "—"}
                      {book.location?.shelfRow && ` / ${book.location.shelfRow}`}
                    </>
                  )}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                <span className="font-serif text-lg font-bold text-primary transition-colors group-hover:text-primary">
                    {formatRating(book.rating)}
                </span>
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
    <div className="grid gap-8 duration-1000 animate-in fade-in sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((book, index) => (
        <div
          className={cn(
            "group glass-panel relative flex flex-col rounded-2xl p-5 transition-all duration-500 hover:-translate-y-2 hover:bg-white/4",
            selectedIds.includes(book.id) && "border-primary/50 bg-primary/8"
          )}
          key={book.id}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="absolute top-4 right-4 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Checkbox
                aria-label={`Seç: ${book.title}`}
                checked={selectedIds.includes(book.id)}
                id={`grid-select-book-${book.id}`}
                name={`select-book-${book.id}`}
                onChange={(event) =>
                    onToggleRow(book.id, index, (event.nativeEvent as MouseEvent).shiftKey)
                }
            />
          </div>

          <Link className="flex-1 space-y-8" href={`/books/${book.slug}`}>
            <div className="group relative mx-auto aspect-2/3 w-4/5">
                <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
                <BookCover
                    className="relative group-hover:scale-105"
                    coverUrl={book.coverUrl}
                  subtitle={book.subtitle}
                    title={book.title}
                />
            </div>
            
            <div className="space-y-3 text-center">
              <div className={cn("mx-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase", STATUS_COLORS[book.status])}>
                {STATUS_LABELS[book.status]}
              </div>
              <BookTitleBlock
                className="text-center"
                subtitle={book.subtitle}
                title={book.title}
              />
              <p className="line-clamp-1 text-[11px] font-medium tracking-widest text-foreground uppercase">
                {book.authors.map((a) => a.name).join(", ") || "Bilinmeyen Yazar"}
              </p>
            </div>
          </Link>

          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-foreground uppercase">Konum</span>
                <span className="text-[12px] font-medium tracking-tight text-foreground italic">
                  {book.status === "loaned" ? (
                    book.loanedTo || "—"
                  ) : (
                    <>
                      {book.location?.locationName || "—"}
                      {book.location?.shelfRow && ` / ${book.location.shelfRow}`}
                    </>
                  )}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold tracking-widest text-foreground uppercase">Puan</span>
                <span className="font-serif text-xl font-bold text-primary transition-transform group-hover:scale-110">
                    {formatRating(book.rating)}
                </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
