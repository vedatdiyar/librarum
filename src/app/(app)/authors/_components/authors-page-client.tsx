"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parsePage } from "../../books/_hooks/use-books-page-data";
import { ArrowRight, LoaderCircle, UserRound, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  cn,
  Button,
  Pagination
} from "@/components/ui";
import type { AuthorListItem } from "@/types";
import { readJsonResponse } from "@/lib/helpers";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";
import { useState } from "react";

interface AuthorsResponse {
  items: AuthorListItem[];
  totalItems: number;
  totalPages: number;
  page: number;
}

async function fetchAuthors(page: number, limit: number = 40) {
  const response = await fetch(`/api/authors?page=${page}&limit=${limit}`);
  return readJsonResponse<AuthorsResponse>(response);
}

function formatAverageRating(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
}

export function AuthorsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPage = parsePage(searchParams);
  const currentLimit = 50;

  const authorsQuery = useQuery({
    queryKey: ["authors", currentPage, currentLimit],
    queryFn: () => fetchAuthors(currentPage, currentLimit)
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/authors?${params.toString()}`, { scroll: false });
  };


  if (authorsQuery.isLoading) {
    return (
      <section className="space-y-10 pb-20">
        {/* Hero Skeleton */}
        <div className="space-y-8 py-10">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-16 w-3/4 rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>

        {/* Table Container Skeleton */}
        <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-white/2">
            <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-8 py-6 md:flex-row md:items-center">
                <div>
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="mt-2 h-4 w-80 rounded-full" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden h-10 w-px bg-white/5 md:block" />
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-12 rounded-lg" />
                            <Skeleton className="h-9 w-9 rounded-xl" />
                        </div>
                        <Skeleton className="h-3 w-20 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-4 py-8">
              {Array.from({ length: 10 }).map((_, i) => (
                <div className="flex h-16 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4 shadow-sm" key={`author-skeleton-client-row-${i}`}>
                   <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                   <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48 rounded-lg" />
                   </div>
                   <Skeleton className="h-4 w-12 rounded-full" />
                   <Skeleton className="ml-8 h-6 w-16 rounded-lg" />
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

  const authors = authorsQuery.data?.items ?? [];
  const totalPages = authorsQuery.data?.totalPages ?? 1;
  const totalItems = authorsQuery.data?.totalItems ?? 0;

  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Dijital arşivinizde yer alan yazarların kapsamlı listesi. Alfabetik olarak sıralanmış; kitap sayısı ve puan ortalaması detaylarını içerir."
        kicker="Yazarlar"
        title={appPageTitles.authors}
      />

      <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-white/2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-6 py-6 md:flex-row md:items-center md:px-8">
            <div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white">Kayıtlı Yazarlar</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground/60 italic">Koleksiyondaki yazarların ve genel puanlama verilerinin özeti.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden h-10 w-px bg-white/5 md:block" />
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-bold tracking-tighter text-white">{totalItems}</span>
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
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Yazar</TableHead>
                    <TableHead className="w-20 text-center md:w-32">Kitaplar</TableHead>
                    <TableHead className="w-28 text-right md:w-40">Puan Ort.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author, idx) => (
                    <TableRow
                      key={author.id}
                      className="group animate-in fade-in fill-mode-both slide-in-from-left-4"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <TableCell>
                        <Link
                          className="flex items-center gap-3 md:gap-4"
                          href={`/authors/${author.slug}`}
                        >
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary md:h-10 md:w-10 md:rounded-xl">
                            <UserRound className="h-4 w-4 md:h-5 md:w-5" />
                          </div>
                          <div className="flex flex-col">
                              <span className="flex items-center gap-2 font-serif text-base font-bold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1 md:text-lg">
                              {author.name}
                              {author.averageRating && author.averageRating >= 4.5 && (
                                  <Trophy className="h-3 w-3 shrink-0 text-primary/80 md:h-3.5 md:w-3.5" />
                              )}
                              <ArrowRight className="h-3 w-3 shrink-0 -translate-x-1 text-primary opacity-0 transition-all duration-700 group-hover:translate-x-0 group-hover:opacity-100 md:h-3.5 md:w-3.5" />
                              </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-white/50 md:text-sm">{author.bookCount}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right">
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
              
              <Pagination
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={currentLimit}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
