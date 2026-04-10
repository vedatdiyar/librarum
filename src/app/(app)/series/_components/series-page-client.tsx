"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LibraryBig, LoaderCircle } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  cn
} from "@/components/ui";
import type { SeriesListItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";

async function fetchSeries() {
  const response = await fetch("/api/series");
  return readJsonResponse<SeriesListItem[]>(response);
}

export function SeriesPageClient() {
  const seriesQuery = useQuery({
    queryKey: ["series"],
    queryFn: fetchSeries
  });

  if (seriesQuery.isLoading) {
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
                <div className="flex h-16 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4" key={`series-skeleton-${i}`}>
                   <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/5" />
                   <div className="h-6 w-48 animate-pulse rounded-lg bg-white/5" />
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

  const series = seriesQuery.data ?? [];

  return (
    <section className="space-y-10 pb-20">
      <PageHero
        description="Kitaplığınızdaki tüm serilerin ve çok ciltli setlerin derlenmiş bir özeti. Koleksiyonunuzun gelişimini buradan takip edebilirsiniz."
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
                  <span className="font-serif text-2xl font-bold tracking-tighter text-white">{series.length}</span>
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
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="px-4 py-4 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Seri</TableHead>
                  <TableHead className="w-48 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Toplam</TableHead>
                  <TableHead className="w-48 text-[9px] font-bold tracking-wider text-foreground/40 uppercase">Kitaplıkta</TableHead>
                  <TableHead className="w-48 text-right text-[9px] font-bold tracking-wider text-foreground/40 uppercase">İlerleme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((item, idx) => (
                  <TableRow 
                    key={item.id}
                    className="group border-b border-white/2 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 last:border-0 hover:bg-white/3"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <TableCell className="px-4 py-3">
                      <Link className="flex items-center gap-4" href={`/series/${item.id}`}>
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground transition-all duration-500 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
                          <LibraryBig className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1">
                            {item.name}
                            <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-primary opacity-0 transition-all duration-700 group-hover:translate-x-0 group-hover:opacity-100" />
                            </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="px-6">
                        <span className="text-base font-bold text-foreground">{item.totalVolumes ?? "Belirsiz"}</span>
                    </TableCell>
                    <TableCell className="px-6">
                          <div className="flex flex-col">
                            <span className={cn(
                                "text-base font-bold",
                                item.completionPercentage === 100 ? "text-emerald-400" : "text-white/60"
                            )}>
                                {item.ownedCount}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="px-6 text-right">
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
          )}
        </div>
      </div>
    </section>
  );
}
