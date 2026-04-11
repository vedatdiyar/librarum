"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText, Calendar, Layers, MapPin, Printer, Star, Trash2 } from "lucide-react";
import {
  Button,
  cn
} from "@/components/ui";
import type { BookDetail, BookStatus } from "@/types";
import { EditBookFormTrigger } from "./edit-book-form-trigger";



function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) {
    return <p className="text-[11px] font-bold tracking-wide text-primary italic">Puan Verilmedi</p>;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, rating - index));

          return (
              <span className="relative h-4 w-4" key={index}>
                <Star className="absolute inset-0 h-4 w-4 text-border" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </span>
              </span>
          );
        })}
      </div>
      <span className="font-serif text-lg font-bold text-white">{rating.toFixed(1)}</span>
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  className
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel flex flex-col items-start gap-3 rounded-2xl border-border bg-card p-4 transition-all hover:bg-muted/40 sm:p-5", className)}>
      <div className="flex w-full items-center justify-start gap-2">
         {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
         <span className="text-[11px] font-bold tracking-wide whitespace-nowrap text-primary">{label}</span>
      </div>
      <div className="text-xs leading-relaxed font-bold text-white sm:text-sm">{value}</div>
    </div>
  );
}

function formatBookMeta(book: BookDetail) {
  const hasData = book.publisher?.name || book.publicationYear || book.pageCount;
  if (!hasData) return <span className="text-muted-foreground italic">Bilgi Belirtilmemiş</span>;

  return (
    <div className="flex flex-col gap-2">
       <span className="text-sm leading-tight font-bold text-white">
         {book.publisher?.name || "Bilinmeyen Yayıncı"}
       </span>
       <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {book.publicationYear && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground">
              <Calendar className="h-3 w-3 text-primary" />
              <span>{book.publicationYear}</span>
            </div>
          )}
          {book.pageCount && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground">
              <BookOpenText className="h-3 w-3 text-primary" />
              <span>{book.pageCount} Sayfa</span>
            </div>
          )}
       </div>
    </div>
  );
}

function formatLocation(book: BookDetail) {
  if (!book.location || (!book.location.locationName && !book.location.shelfRow)) {
    return <span className="text-muted-foreground italic">Konum Belirtilmemiş</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold text-white">{book.location.locationName || "Kütüphane"}</span>
      {book.location.shelfRow && (
        <span className="text-[11px] font-medium tracking-wide text-primary/70 capitalize">Raf {book.location.shelfRow}</span>
      )}
    </div>
  );
}

function formatReadingDate(book: BookDetail) {
  if (!book.readYear) {
    return "Tarih Yok";
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
  if (!value) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function BookMetaSection({ book }: { book: BookDetail }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetaTile label="Yayın" value={formatBookMeta(book)} icon={Printer} />
      <MetaTile label="ISBN" value={<span className="font-mono text-xs tracking-wider">{book.isbn ?? "Kayıtsız"}</span>} />
      <MetaTile 
         label="Seri" 
         icon={Layers}
         value={
           book.series ? (
             <div className="flex flex-col gap-1">
               <Link href={`/series/${book.series.slug}`} className="text-sm font-bold text-white transition-colors hover:text-primary">
                 {book.series.name}
               </Link>
               {book.series.seriesOrder && (
                 <span className="text-[10px] font-medium text-primary/70 capitalize">Cilt {book.series.seriesOrder}</span>
               )}
             </div>
           ) : <span className="text-sm font-bold text-white">Tekil Kitap</span>
         } 
      />
      <MetaTile label="Konum" value={formatLocation(book)} icon={MapPin} />
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
    <div className="glass-panel overflow-hidden rounded-[32px] border-border bg-card shadow-2xl">
      <div className="grid">
        {/* Review & Stats */}
        <div className="space-y-10 p-8 md:p-12">
           <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="space-y-1">
                <h3 className="font-serif text-3xl font-bold text-white">İnceleme & Notlar</h3>
                <p className="text-[13px] text-muted-foreground italic">Kişisel okuma deneyimi ve koleksiyon notları.</p>
              </div>
           </div>

           <div className="grid gap-10 sm:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center">
                  <p className="text-[11px] font-bold tracking-wide text-primary">Kişisel Puan</p>
                  <RatingStars rating={book.rating} />
              </div>

              <div className="flex flex-col items-center space-y-3 text-center">
                  <p className="text-[11px] font-bold tracking-wide text-primary">Okuma Tarihi</p>
                  <p className="font-serif text-lg leading-none font-bold text-white">{formatReadingDate(book)}</p>
              </div>

              <div className="flex flex-col items-center space-y-3 text-center">
                  <p className="text-[11px] font-bold tracking-wide text-primary">Koleksiyon</p>
                  <p className="font-serif text-lg leading-none font-bold text-white">{book.copyCount} Adet Kopya</p>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[11px] font-bold tracking-wide text-primary">Düşünceler</label>
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-border bg-primary/5 shadow-inner transition-colors focus-within:border-primary">
                 <div className="p-6 md:p-10">
                    <p className={cn(
                      "min-h-[160px] font-sans text-[15px]/7 whitespace-pre-wrap text-foreground/90",
                      !book.personalNote && "italic opacity-60"
                    )}>
                      {book.personalNote || "Henüz bir not eklenmemiş. Okuma deneyiminizi buraya kaydedebilirsiniz."}
                    </p>
                 </div>
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
              </div>
           </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col items-end gap-3 border-t border-border p-8 text-white md:p-8">
           <div className="flex flex-col gap-3 sm:flex-row">
              <EditBookFormTrigger
                bookSlug={book.slug}
                buttonProps={{ className: "h-12 rounded-xl bg-white text-black hover:bg-primary transition-all duration-500 shadow-2xl font-bold tracking-widest text-[11px] px-6", size: "sm" }}
                onSuccess={onBookUpdated}
              />
              
              <div className="flex gap-3">
                {book.status === "loaned" && (
                  <Button
                    className="h-12 border border-border bg-accent px-4 text-[11px] font-bold tracking-widest text-primary transition-all hover:bg-accent/80"
                    onClick={() => setIsReturnDialogOpen(true)}
                    variant="ghost"
                  >
                    İade Al
                  </Button>
                )}
                <Button
                  className="h-12 border border-destructive/30 bg-destructive/10 px-4 text-[11px] font-bold tracking-widest text-destructive transition-all hover:bg-destructive/15"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="ghost"
                >
                  Arşivden Sil
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export function LogisticsInfo({ book }: { book: BookDetail }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="glass-panel flex flex-col items-start gap-2 rounded-lg border-border bg-card/50 p-3 transition-all">
        <span className="text-[11px] font-bold tracking-wide text-primary">Ödünç Durumu</span>
        <span className="text-xs font-bold text-white">
          {book.loanedTo ? (
            <span className="text-violet-300">@{book.loanedTo}</span>
          ) : (
            <span>Koleksiyonda</span>
          )}
        </span>
      </div>
      <div className="glass-panel flex flex-col items-start gap-2 rounded-lg border-border bg-card/50 p-3 transition-all">
        <span className="text-[11px] font-bold tracking-wide text-primary">Arşiv Durumu</span>
        <span className={cn("text-xs font-bold", book.donatable ? "text-emerald-300" : "text-muted-foreground")}>
          {book.donatable ? "Bağışlanabilir" : "Kalıcı"}
        </span>
      </div>
    </div>
  );
}
