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
  DialogTitle
} from "@/components/ui";
import { splitBookDisplayTitle } from "@/lib/shared/book-title";
import { useBookDetailData } from "../_hooks/use-book-detail-data";
import { BookMetaSection, BookStatusAndNotesSection } from "./detail-sections";
import { cn } from "@/lib/utils";
import type { BookDetail } from "@/types";

function DetailSkeleton() {
  return (
    <div className="space-y-8 pb-24">
      {/* Back Link Skeleton */}
      <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />

      <div className="grid animate-pulse gap-16 lg:grid-cols-[420px_1fr]">
        <div className="space-y-10">
          <div className="aspect-2/3 w-full rounded-2xl border border-white/5 bg-white/2 shadow-2xl" />
          <div className="h-24 w-full rounded-2xl border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-16">
          <div className="space-y-8">
            <div className="h-8 w-40 rounded-full bg-white/5" />
            <div className="space-y-4">
               <div className="h-24 w-full rounded-2xl bg-white/5 md:h-32" />
               <div className="hidden h-32 w-2/3 rounded-2xl bg-white/5 md:block" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <div className="h-24 rounded-2xl border border-white/5 bg-white/2" key={`meta-skeleton-${i}`} />
             ))}
          </div>

          <div className="h-[400px] w-full rounded-3xl border border-white/5 bg-white/2" />
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
      <h2 className="mb-2 font-serif text-2xl font-bold text-white">Eşitleme Hatası</h2>
      <p className="max-w-md text-sm text-foreground italic">{message}</p>
      <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
        <Link href="/books">Arşive Dön</Link>
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
            : "Eser detayları alınırken bir hata oluştu."
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
      <div className="mb-8 duration-700 animate-in fade-in slide-in-from-left-4">
        <Button asChild variant="ghost" className="group rounded-xl px-0 hover:bg-transparent">
            <Link href="/books" className="flex items-center gap-2 text-foreground transition-colors group-hover:text-primary">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Eseri Kapat</span>
            </Link>
        </Button>
      </div>

      <div className="grid items-start gap-16 lg:grid-cols-[420px_1fr]">
        <aside className="sticky top-24 space-y-10 duration-1000 animate-in fade-in slide-in-from-bottom-8">
            <div className="group relative aspect-2/3 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
            
            {book.coverUrl ? (
              <>
                <Image alt="" className="object-cover opacity-40 blur-2xl" fill sizes="(max-width: 420px) 100vw, 420px" src={book.coverUrl} />
                <Image
                  alt={displayTitle.title || book.title}
                  className="relative object-contain transition-transform duration-1000 group-hover:scale-110"
                  fill
                  priority
                  sizes="(max-width: 420px) 100vw, 420px"
                  src={book.coverUrl}
                />
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-end p-12 text-center">
                 <p className="mb-8 font-serif text-3xl leading-tight font-bold text-white/40">
                    {book.title}
                 </p>
                 <div className="h-1 w-12 rounded-full bg-white/5" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
          </div>

          <div className="glass-panel rounded-2xl border-white/5 bg-white/2 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="rounded-lg border border-white/10 bg-white/3 p-2">
                    <Calendar className="h-4 w-4 text-foreground" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Kayıt Tarihi</p>
                    <p className="text-sm font-bold tracking-tight text-white/80">
                    {new Intl.DateTimeFormat("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }).format(new Date(book.createdAt))}
                    </p>
                 </div>
              </div>
              <Button
                className="h-9 w-9 rounded-xl border-white/10 bg-white/3 transition-all hover:bg-white/8"
                onClick={() => {
                  void navigator.clipboard.writeText(book.slug);
                }}
                size="icon"
                variant="ghost"
              >
                <Copy className="h-3.5 w-3.5 text-foreground" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-16 pb-24">
          <section className="space-y-8 delay-200 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                <span className="shadow-glow h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase">
                    {book.category?.name || "Kategorisiz"}
                </span>
              </div>
              
              <div className="space-y-2">
                <h1 className="font-serif text-6xl leading-[1.05] font-bold tracking-tight text-balance text-white md:text-8xl">
                  {displayTitle.title || book.title}
                </h1>
                {displayTitle.subtitle ? (
                  <p className="max-w-4xl font-serif text-2xl font-bold tracking-tight text-primary/85 md:text-4xl">
                    {displayTitle.subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <BookMetaSection book={book} />
          </section>

          <div className="delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
            <BookStatusAndNotesSection
                book={book}
                invalidateBookQueries={invalidateBookQueries}
                onBookUpdated={handleBookUpdated}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                setIsReturnDialogOpen={setIsReturnDialogOpen}
            />
          </div>
        </main>
      </div>

      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent className="glass-panel rounded-3xl border-white/10 bg-background/95 backdrop-blur-3xl sm:max-w-[425px]">
          <DialogHeader className=" space-y-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-white">Eseri Kayıttan Çıkar</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground italic">
               Bu baskıyı dijital arşivinizden kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
                "Evet, Eseri Kaldır"
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
            <DialogTitle className="font-serif text-2xl font-bold text-white">Arşiv İadesi</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground italic">
               Eser arşive geri kaydedilecek ve durumu &apos;Tamamlandı&apos; olarak güncellenecektir.
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
