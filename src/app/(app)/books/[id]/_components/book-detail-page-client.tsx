"use client";

import * as React from "react";
import Image from "next/image";
import { Copy, LoaderCircle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui";
import { useBookDetailData } from "../_hooks/use-book-detail-data";
import { BookMetaSection, BookStatusAndNotesSection } from "./detail-sections";

function DetailSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-[380px,1fr]">
      <div className="space-y-8">
        <div className="aspect-[2/3] w-full animate-pulse rounded-[32px] bg-surface-raised" />
        <div className="h-40 animate-pulse rounded-[26px] bg-surface-raised" />
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-full bg-surface-raised" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-surface-raised" />
        </div>
        <div className="h-96 animate-pulse rounded-[26px] bg-surface-raised" />
      </div>
    </div>
  );
}

function DetailError({ message }: { message: string }) {
  return (
    <div className="rounded-[26px] border border-destructive/25 bg-destructive/10 p-8 text-center">
      <p className="text-lg text-destructive">{message}</p>
    </div>
  );
}

type BookDetailPageClientProps = {
  bookId: string;
};

export function BookDetailPageClient({ bookId }: BookDetailPageClientProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);

  const { bookQuery, deleteMutation, invalidateBookQueries } = useBookDetailData(bookId);

  async function handleReturn() {
    setIsReturning(true);
    try {
      const response = await fetch(`/api/books/${bookId}/return`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Iade islemi basarisiz oldu.");
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
            : "Kitap detaylari yuklenirken bir hata olustu."
        }
      />
    );
  }

  const book = bookQuery.data;

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-[380px,1fr]">
        <aside className="space-y-8">
          <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-[32px] border border-border/55 bg-surface-raised shadow-panel transition-colors duration-200 hover:border-accent/30">
            {book.coverUrl ? (
              <Image
                alt={book.title}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 380px) 100vw, 380px"
                src={book.coverUrl}
              />
            ) : (
              <div className="book-placeholder h-full p-8 pb-12">
                <div className="flex h-full flex-col justify-end">
                  <p className="font-display text-4xl leading-tight text-text-primary">
                    {book.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="panel-muted p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Eklenme</p>
                <p className="text-sm font-medium text-text-primary">
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  }).format(new Date(book.createdAt))}
                </p>
              </div>
              <Button
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  void navigator.clipboard.writeText(bookId);
                }}
                size="icon"
                variant="secondary"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-12 pb-12">
          <section className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
                {book.category?.name || "Kategori belirtilmedi"}
              </p>
              <h1 className="font-display text-5xl leading-tight text-text-primary sm:text-7xl">
                {book.title}
              </h1>
            </div>

            <BookMetaSection book={book} />
          </section>

          <BookStatusAndNotesSection
            book={book}
            bookId={bookId}
            invalidateBookQueries={invalidateBookQueries}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            setIsReturnDialogOpen={setIsReturnDialogOpen}
          />
        </main>
      </div>

      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kitabi sil</DialogTitle>
            <DialogDescription>
              Bu kitabi koleksiyonunuzdan silmek istediginize emin misiniz? Bu islem geri alinamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="secondary"
            >
              Vazgec
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Evet, sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsReturnDialogOpen} open={isReturnDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Iade al</DialogTitle>
            <DialogDescription>
              Kitap iade edildi olarak işlenecek ve durumu &apos;Okudum&apos; olarak güncellenecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isReturning} onClick={() => setIsReturnDialogOpen(false)} variant="secondary">
              Vazgec
            </Button>
            <Button disabled={isReturning} onClick={handleReturn} variant="primary">
              {isReturning ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Isleniyor...
                </>
              ) : (
                "Iade al"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
