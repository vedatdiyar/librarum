"use client";

import * as React from "react";
import Image from "next/image";
import { Copy, LoaderCircle, Calendar, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton
} from "@/components/ui";
import { splitBookDisplayTitle } from "@/lib/book-title";
import { useBookDetailData } from "../_hooks/use-book-detail-data";
import { BookMetaSection, BookStatusAndNotesSection, LogisticsInfo } from "./detail-sections";
import { cn } from "@/lib/utils";
import type { BookDetail } from "@/types";

function DetailSkeleton() {
  return (
    <div className="space-y-8 pb-24">
      {/* Back Link Skeleton */}
      <Skeleton className="mb-4 h-4 w-32 rounded-full" />

      <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
        {/* Cover Skeleton */}
        <div className="space-y-10">
          <Skeleton className="aspect-2/3 w-full max-w-[320px] rounded-2xl border border-white/5 bg-white/2 shadow-2xl lg:max-w-none" />
          <Skeleton className="h-24 w-full rounded-2xl border border-white/5 bg-white/2" />
        </div>

        {/* Identity & Meta Skeleton */}
        <div className="space-y-12">
          <div className="space-y-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
              <Skeleton className="h-8 w-1/2 rounded-xl" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" key={`meta-skeleton-client-${i}`} />
             ))}
          </div>

          <Skeleton className="h-[400px] w-full rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}

function DetailError({ message }: { message: string }) {
  return (
    <div className="glass-panel flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="mb-6 rounded-2xl bg-destructive/10 p-4">
        <Trash2 className="h-8 w-8 text-destructive" />
      </div>
      <p className="max-w-md text-sm text-foreground italic">{message}</p>
      <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
        <Link href="/books">Koleksiyona Dön</Link>
      </Button>
    </div>
  );
}

type BookDetailPageClientProps = {
  bookSlug: string;
};

export function BookDetailPageClient({ bookSlug }: BookDetailPageClientProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);

  const { bookQuery, deleteMutation, invalidateBookQueries } = useBookDetailData(bookSlug);

  async function handleReturn() {
    setIsReturning(true);
    try {
      const response = await fetch(`/api/books/${bookSlug}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          status: "owned",
          loanedTo: null,
          loanedAt: null
        })
      });

      if (!response.ok) {
        throw new Error("İade işlemi başarısız oldu.");
      }

      invalidateBookQueries();
      setIsReturnDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsReturning(false);
    }
  }

  if (bookQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <DetailError
        message={
          bookQuery.error instanceof Error
            ? bookQuery.error.message
            : "Kitap detayları alınırken bir hata oluştu."
        }
      />
    );
  }

  const book = bookQuery.data;
  const displayTitle = splitBookDisplayTitle(book.title, book.subtitle);

  function handleBookUpdated(updatedBook: BookDetail) {
    invalidateBookQueries();

    if (updatedBook.slug !== bookSlug) {
      router.replace(`/books/${updatedBook.slug}`);
    }
  }

  return (
    <>
      <div className="relative z-10 space-y-12 pb-24">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between duration-700 animate-in fade-in slide-in-from-top-4">
          <Button asChild variant="ghost" className="group -ml-2 rounded-xl px-2 hover:bg-muted/40">
              <Link href="/books" className="flex items-center gap-2 text-white transition-colors group-hover:text-primary">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-[11px] font-bold tracking-wide">Koleksiyona Dön</span>
              </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              className="h-9 w-9 rounded-xl border border-border bg-card transition-all hover:bg-muted/40"
              onClick={() => {
                void navigator.clipboard.writeText(book.slug);
              }}
              size="icon"
              variant="ghost"
              title="Kitap ID Kopyala"
            >
              <Copy className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="grid items-start gap-12 lg:grid-cols-[380px_1fr]">
          {/* Immersive Cover */}
          <div className="group relative mx-auto w-full max-w-[320px] pt-6 duration-1000 animate-in fade-in zoom-in-95 lg:mx-0 lg:max-w-none lg:pt-8">
            <div className="book-card-shadow relative aspect-2/3 w-full overflow-hidden rounded-xl border border-border bg-card transition-transform duration-700 group-hover:scale-[1.02]">
              {book.coverUrl ? (
                <>
                  <Image
                    alt={displayTitle.title || book.title}
                    className="relative object-contain brightness-110 contrast-105"
                    fill
                    priority
                    sizes="420px"
                    src={book.coverUrl}
                  />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-12 text-center">
                   <p className="font-serif text-3xl font-bold text-muted-foreground italic">{book.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Book Identity */}
          <div className="space-y-10 self-start text-center lg:self-center lg:text-left">
            <div className="space-y-6 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-[11px] font-bold tracking-wide text-primary">
                  {book.category?.name || "Kategorisiz"}
                </div>
                
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl leading-tight font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                    {displayTitle.title || book.title}
                  </h1>
                  {displayTitle.subtitle && (
                    <p className="font-serif text-xl font-medium tracking-tight text-primary md:text-2xl">
                      {displayTitle.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 lg:justify-start">
                {book.authors.length > 0 ? (
                  book.authors.map((author, idx) => (
                    <React.Fragment key={author.id}>
                        {idx > 0 && <span className="text-sm text-muted-foreground/60 italic">&</span>}
                        <Link
                          className="font-serif text-lg font-bold text-white transition-colors hover:text-primary md:text-xl"
                          href={`/authors/${author.slug}`}
                        >
                          {author.name}
                        </Link>
                    </React.Fragment>
                  ))
                ) : (
                  <span className="font-serif text-sm font-medium text-muted-foreground italic">Yazar Belirtilmemiş</span>
                )}
              </div>
            </div>

            <div className="delay-200 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-6">
              <BookMetaSection book={book} />
            </div>

            <div className="delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-4">
              <LogisticsInfo book={book} />
            </div>
          </div>
        </header>

        {/* Secondary Content */}
        <section className="delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
          <BookStatusAndNotesSection
              book={book}
              invalidateBookQueries={invalidateBookQueries}
              onBookUpdated={handleBookUpdated}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              setIsReturnDialogOpen={setIsReturnDialogOpen}
          />
        </section>

        {/* System Metadata Footer */}
        <footer className="relative mt-20 overflow-hidden border-t border-white/5 pt-12">
          <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <div className="space-y-1.5 text-center md:text-left">
                <p className="text-[11px] font-bold tracking-wider text-foreground/40 uppercase">
                  Librarum Dijital Kütüphane Sistemi
                </p>
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <span className="text-[10px] font-medium tracking-tighter text-foreground/60 uppercase">Arşiv ID:</span>
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-primary/80">
                    {book.slug}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 md:items-end">
              <span className="text-[10px] font-bold tracking-[0.2em] text-foreground/40 uppercase">Koleksiyona Giriş</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-2 backdrop-blur-md">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold tracking-wide text-foreground/80">
                  {new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(book.createdAt))}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent className="glass-panel rounded-3xl border-white/10 bg-background/95 backdrop-blur-3xl sm:max-w-[425px]">
          <DialogHeader className=" space-y-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-white">Kitabı Koleksiyondan Kaldır</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground italic">
               Bu baskıyı dijital koleksiyonunuzdan kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3">
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="secondary"
              className="rounded-xl border-white/5 bg-white/3 hover:bg-white/8"
            >
              Vazgeç
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              variant="destructive"
              className="rounded-xl shadow-2xl"
            >
              {deleteMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Kaldırılıyor...
                </>
              ) : (
                "Evet, Kaldır"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsReturnDialogOpen} open={isReturnDialogOpen}>
        <DialogContent className="glass-panel rounded-3xl border-white/10 bg-background/95 backdrop-blur-3xl sm:max-w-[425px]">
          <DialogHeader className="space-y-4">
             <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <ArrowLeft className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-white">Kitabı İade Al</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground italic">
               Kitap koleksiyona geri dönecek ve durumu &apos;Okundu&apos; olarak güncellenecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3">
            <Button disabled={isReturning} onClick={() => setIsReturnDialogOpen(false)} variant="secondary" className="rounded-xl border-white/5 bg-white/3 hover:bg-white/8">
              Vazgeç
            </Button>
            <Button disabled={isReturning} onClick={handleReturn} className="rounded-xl bg-white text-black shadow-2xl transition-all hover:bg-primary hover:text-primary-foreground">
              {isReturning ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                "İadeyi Onayla"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
