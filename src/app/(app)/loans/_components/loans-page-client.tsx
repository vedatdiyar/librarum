"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText, History, User, Calendar, ArrowRight } from "lucide-react";
import { 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  cn
} from "@/components/ui";
import type { BookListResponse } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { BookReturnDialog } from "@/components/books/book-return-dialog";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";

async function fetchLoanedBooks() {
  const response = await fetch("/api/books?status=loaned");
  return readJsonResponse<BookListResponse>(response);
}

function formatLoanDate(value: string | null) {
  if (!value) {
    return "Bilinmeyen Zaman";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/2 shadow-xl transition-transform duration-500 group-hover:scale-110">
        <Image alt="" className="object-cover opacity-30 blur-lg" fill src={coverUrl} />
        <Image alt={`${title} cover`} className="relative object-contain" fill sizes="64px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/2 p-2 transition-all duration-500">
      <span className="line-clamp-3 text-center text-[7px] font-bold tracking-tighter text-foreground uppercase">{title}</span>
    </div>
  );
}

export function LoansPageClient() {
  const [selectedBookId, setSelectedBookId] = React.useState<string | null>(null);
  const loansQuery = useQuery({
    queryKey: ["books", "loans"],
    queryFn: fetchLoanedBooks
  });

  if (loansQuery.isLoading) {
    return (
      <section className="space-y-10 pb-20">
        {/* Hero Skeleton */}
        <div className="space-y-8 py-10">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>

        {/* Table Container Skeleton */}
        <div className="rounded-3xl border border-white/5 bg-white/2 p-6">
           <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-2">
                 <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
                 <div className="h-4 w-80 animate-pulse rounded-full bg-white/5" />
              </div>
              <div className="h-12 w-40 animate-pulse rounded-xl bg-white/5" />
           </div>

           <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="flex h-20 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4" key={`loan-skeleton-${i}`}>
                   <div className="h-12 w-10 shrink-0 animate-pulse rounded-xl bg-white/5" />
                   <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/2 animate-pulse rounded-lg bg-white/5" />
                      <div className="h-3 w-1/4 animate-pulse rounded-full bg-white/5" />
                   </div>
                   <div className="h-9 w-28 animate-pulse rounded-xl bg-white/5" />
                </div>
              ))}
           </div>
        </div>
      </section>
    );
  }

  if (loansQuery.isError) {
    return (
      <section className="pt-24 text-center">
        <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12">
            <h2 className="mb-4 font-serif text-3xl font-bold text-white">Ödünç Kaydı Hatası</h2>
            <p className="mx-auto max-w-md text-sm text-foreground italic">
                {loansQuery.error instanceof Error ? loansQuery.error.message : "Güncel ödünç listesi alınamadı."}
            </p>
            <Button onClick={() => loansQuery.refetch()} variant="ghost" className="mt-8 rounded-xl border border-white/5 hover:bg-white/3">Yeniden Dene</Button>
        </div>
      </section>
    );
  }

  const items = loansQuery.data?.items ?? [];

  return (
    <>
      <section className="space-y-10 pb-20">
        <PageHero
          description="Şu anda kütüphane dışında olan tüm eserlerin listesi. Kimde olduklarını ve iade tarihlerini buradan takip edebilirsiniz."
          kicker="Ödünç Listesi"
          title={appPageTitles.loans}
        />

        <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-8">
            <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-6 py-6 md:flex-row md:items-center md:px-8">
                <div>
                   <h3 className="font-serif text-xl font-bold tracking-tight text-white">Aktif Ödünçler</h3>
                   <p className="mt-1 text-[12px] leading-relaxed text-foreground/60 italic">Kütüphane dışında bulunan kitapların listesi.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden h-10 w-px bg-white/5 md:block" />
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold tracking-tighter text-white">{items.length}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                        <History className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="line-clamp-1 text-[9px] font-bold tracking-wider text-primary/70 uppercase">Aktif Emanet Kaydı</p>
                  </div>
                </div>
            </div>

            <div className="px-2 py-2 pb-8 md:px-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center text-foreground/40">
                        <History className="mb-6 h-12 w-12 opacity-20" />
                        <p className="font-serif text-xl font-bold italic">Şu anda ödünç verilmiş kitap bulunmuyor.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Eser Bilgisi</TableHead>
                                <TableHead className="text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Kimde?</TableHead>
                                <TableHead className="text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Verildiği Tarih</TableHead>
                                <TableHead className="w-40 text-right text-[9px] font-bold tracking-wider text-foreground/40 uppercase">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((book, idx) => (
                                <TableRow 
                                    key={book.id}
                                    className="group border-b border-white/2 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 last:border-0 hover:bg-white/3"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-6">
                                            <BookThumb coverUrl={book.coverUrl} title={book.title} />
                                            <div className="flex flex-col space-y-1.5">
                                                <Link
                                                    className="flex items-center gap-3 font-serif text-2xl leading-tight font-bold tracking-tight text-white transition-colors group-hover:text-primary"
                                                    href={`/books/${book.slug}`}
                                                >
                                                    {book.title}
                                                    <ArrowRight className="h-4 w-4 -translate-x-2 text-primary opacity-0 transition-all duration-700 group-hover:translate-x-0 group-hover:opacity-100" />
                                                </Link>
                                                <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">
                                                    {book.authors.map((author) => author.name).join(", ") || "Bilinmeyen Yazar"}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg border border-white/5 bg-white/2 p-2 text-foreground">
                                                <User className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-base font-bold tracking-tight text-foreground">{book.loanedTo ?? "İsimsiz"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg border border-white/5 bg-white/2 p-2 text-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground">{formatLoanDate(book.loanedAt)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Button 
                                            onClick={() => setSelectedBookId(book.id)} 
                                            className="h-10 rounded-xl bg-white px-6 text-[9px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
                                        >
                                            <BookOpenText className="mr-2 h-3.5 w-3.5" />
                                            Eseri İade Edildi
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
      </section>

      {selectedBookId ? (
        <BookReturnDialog
          bookId={selectedBookId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBookId(null);
            }
          }}
          open={Boolean(selectedBookId)}
        />
      ) : null}
    </>
  );
}
