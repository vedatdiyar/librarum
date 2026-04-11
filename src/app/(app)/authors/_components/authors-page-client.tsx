"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, UserRound, Trophy } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  cn 
} from "@/components/ui";
import type { AuthorListItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";

async function fetchAuthors() {
  const response = await fetch("/api/authors");
  return readJsonResponse<AuthorListItem[]>(response);
}

function formatAverageRating(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
}

export function AuthorsPageClient() {
  const authorsQuery = useQuery({
    queryKey: ["authors"],
    queryFn: fetchAuthors
  });

  if (authorsQuery.isLoading) {
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
                <div className="flex h-16 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4" key={`author-skeleton-${i}`}>
                   <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/5" />
                   <div className="h-6 w-48 animate-pulse rounded-lg bg-white/5" />
                </div>
              ))}
           </div>
        </div>
      </section>
    );
  }

  if (authorsQuery.isError) {
    return (
      <section className="pt-24">
        <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold text-white">Kayıt Eşitleme Hatası</h2>
          <p className="mx-auto max-w-md text-sm text-foreground italic">
             {authorsQuery.error instanceof Error
                ? authorsQuery.error.message
                : "Yazar kaydı kütüphane listesinden alınamadı."}
          </p>
          <button 
            onClick={() => authorsQuery.refetch()} 
            className="mt-8 rounded-xl border border-white/5 bg-white/3 px-6 py-2 text-[11px] font-bold tracking-widest text-white/60 transition-all hover:bg-white/8"
          >
            Protokolü Yeniden Başlat
          </button>
        </div>
      </section>
    );
  }

  const authors = authorsQuery.data ?? [];

  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Dijital arşivinizde yer alan tüm yazarların kapsamlı listesi. Alfabetik olarak sıralanmış; kitap sayısı ve puan ortalaması detaylarını içerir."
        kicker="Yazarlar"
        title={appPageTitles.authors}
      />

      <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-6 py-6 md:flex-row md:items-center md:px-8">
            <div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white">Kayıtlı Yazarlar</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground/60 italic">Koleksiyondaki yazarların ve genel puanlama verilerinin özeti.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden h-10 w-px bg-white/5 md:block" />
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-bold tracking-tighter text-white">{authors.length}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                </div>
                <p className="line-clamp-1 text-[11px] font-bold tracking-wide text-primary/70">Toplam Yazar</p>
              </div>
            </div>
        </div>

        <div className="px-2 py-2 pb-8 md:px-4">
          {authors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-foreground/40">
               <UserRound className="mb-6 h-12 w-12 opacity-20" />
               <p className="font-serif text-xl font-bold">Henüz hiçbir yazar kaydedilmemiş.</p>
               <p className="mt-2 text-sm italic">Koleksiyonunuza yeni kitaplar ekleyerek başlayın.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="px-4 py-4 text-[11px] font-bold tracking-wide text-foreground/40">Yazar</TableHead>
                  <TableHead className="w-32 text-[11px] font-bold tracking-wide text-foreground/40">Kitaplar</TableHead>
                  <TableHead className="w-40 text-right text-[11px] font-bold tracking-wide text-foreground/40">Puan Ortalaması</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author, idx) => (
                  <TableRow 
                    key={author.id}
                    className="group border-b border-white/2 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 last:border-0 hover:bg-white/3"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <TableCell className="px-4 py-3">
                      <Link
                        className="flex items-center gap-4"
                        href={`/authors/${author.slug}`}
                      >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1">
                            {author.name}
                            {author.averageRating && author.averageRating >= 4.5 && (
                                <Trophy className="h-3.5 w-3.5 text-primary/80" />
                            )}
                            <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-primary opacity-0 transition-all duration-700 group-hover:translate-x-0 group-hover:opacity-100" />
                            </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="px-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white/50">{author.bookCount}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                        <div className="flex items-center justify-end gap-3 transition-transform duration-500 group-hover:scale-105">
                            <div className="flex flex-col items-end">
                                <span className={cn(
                                    "font-serif text-lg font-bold tracking-tight",
                                    author.averageRating && author.averageRating >= 4 ? "text-primary" : "text-white/60"
                                )}>
                                    {formatAverageRating(author.averageRating)}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </section>
  );
}
