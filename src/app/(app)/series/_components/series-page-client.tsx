"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parsePage } from "../../books/_hooks/use-books-page-data";
import { ArrowRight, LibraryBig, LoaderCircle, ChevronLeft, ChevronRight } from "lucide-react";
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
import type { SeriesListItem } from "@/types";
import { readJsonResponse } from "@/lib/helpers";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";
import { useState } from "react";

interface SeriesResponse {
  items: SeriesListItem[];
  totalItems: number;
  totalPages: number;
  page: number;
}

async function fetchSeries(page: number, limit: number = 40) {
  const response = await fetch(`/api/series?page=${page}&limit=${limit}`);
  return readJsonResponse<SeriesResponse>(response);
}

export function SeriesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPage = parsePage(searchParams);
  const currentLimit = 50;

  const seriesQuery = useQuery({
    queryKey: ["series", currentPage, currentLimit],
    queryFn: () => fetchSeries(currentPage, currentLimit)
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`/series?${params.toString()}`, { scroll: false });
  };


  if (seriesQuery.isLoading) {
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
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="flex h-16 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4 shadow-sm" key={`series-skeleton-client-row-${i}`}>
                   <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                   <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48 rounded-lg" />
                   </div>
                   <div className="flex items-center gap-8">
                      <Skeleton className="hidden h-4 w-12 rounded-full sm:block" />
                      <Skeleton className="hidden h-4 w-12 rounded-full sm:block" />
                      <div className="flex flex-col items-end gap-1">
                          <Skeleton className="h-5 w-16 rounded-lg" />
                          <Skeleton className="h-1 w-24 rounded-full" />
                      </div>
                   </div>
                </div>
              ))}
            </div>
        </div>
      </section>
    );
  }

  if (seriesQuery.isError) {
    return (
      <section className="pt-24">
        <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold text-white">Veri Yükleme Hatası</h2>
          <p className="mx-auto max-w-md text-sm text-foreground italic">
             {seriesQuery.error instanceof Error
                ? seriesQuery.error.message
                : "Seri listesi yüklenirken bir sorun oluştu."}
          </p>
          <button 
            onClick={() => seriesQuery.refetch()} 
            className="mt-8 rounded-xl border border-white/5 bg-white/3 px-6 py-2 text-[11px] font-bold tracking-widest text-white/60 uppercase transition-all hover:bg-white/8"
          >
            Yeniden Dene
          </button>
        </div>
      </section>
    );
  }

  const series = seriesQuery.data?.items ?? [];
  const totalPages = seriesQuery.data?.totalPages ?? 1;
  const totalItems = seriesQuery.data?.totalItems ?? 0;

  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Koleksiyonunuzdaki tüm serilerin ve çok ciltli setlerin derlenmiş bir özeti. Koleksiyonunuzun gelişimini buradan takip edebilirsiniz."
        kicker="Seri Koleksiyonu"
        title={appPageTitles.series}
      />

      <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-6 py-6 md:flex-row md:items-center md:px-8">
            <div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white">Koleksiyon Serileri</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground/60 italic">Serilerinizin alfabetik dökümü ve güncel tamamlanma oranları.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden h-10 w-px bg-white/5 md:block" />
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl font-bold tracking-tighter text-white">{totalItems}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                    <LibraryBig className="h-5 w-5" />
                  </div>
                </div>
                <p className="line-clamp-1 text-[9px] font-bold tracking-wider text-primary/70 uppercase">Kayıtlı Seri</p>
              </div>
            </div>
        </div>

        <div className="px-2 py-2 pb-8 md:px-4">
          {series.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center text-foreground/40">
               <LibraryBig className="mb-6 h-12 w-12 opacity-20" />
               <p className="font-serif text-xl font-bold italic">Listede herhangi bir seri bulunamadı.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Seri</TableHead>
                    <TableHead className="hidden w-32 text-center sm:table-cell md:w-48">Toplam</TableHead>
                    <TableHead className="hidden w-32 text-center sm:table-cell md:w-48">Koleksiyonda</TableHead>
                    <TableHead className="w-32 text-right md:w-48">İlerleme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="group animate-in fade-in fill-mode-both slide-in-from-left-4"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <TableCell>
                        <Link className="flex items-center gap-3 md:gap-4" href={`/series/${item.slug}`}>
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary md:h-10 md:w-10 md:rounded-xl">
                            <LibraryBig className="h-4 w-4 md:h-5 md:w-5" />
                          </div>
                          <div className="flex flex-col">
                              <span className="flex items-center gap-2 font-serif text-base font-bold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1 md:text-lg">
                              {item.name}
                              <ArrowRight className="h-3 w-3 -translate-x-1 text-primary opacity-0 transition-all duration-700 group-hover:translate-x-0 group-hover:opacity-100 md:h-3.5 md:w-3.5" />
                              </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell md:px-6">
                          <span className="text-sm font-bold text-foreground md:text-base">{item.totalVolumes ?? "Belirsiz"}</span>
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell md:px-6">
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                  "text-sm font-bold md:text-base",
                                  item.completionPercentage === 100 ? "text-emerald-400" : "text-white/60"
                              )}>
                                  {item.ownedCount}
                              </span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right md:px-6">
                          <div className="flex flex-col items-end">
                              <div className="mb-1 flex items-center gap-2">
                                  <span className={cn(
                                      "font-serif text-xl font-bold tracking-tight",
                                      item.completionPercentage === 100 ? "text-emerald-400" : "text-white/80"
                                  )}>
                                      {item.completionPercentage == null ? "0" : item.completionPercentage}
                                  </span>
                                  <span className="text-[10px] font-medium text-foreground/40">%</span>
                              </div>
                              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/3">
                                  <div
                                      className={cn(
                                          "h-full transition-all duration-1000",
                                          item.completionPercentage === 100 ? "bg-emerald-400" : "bg-primary"
                                      )}
                                      style={{ width: `${item.completionPercentage ?? 0}%` }}
                                  />
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
