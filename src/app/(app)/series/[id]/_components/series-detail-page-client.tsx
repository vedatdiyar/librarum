"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  BookMarked, 
  CircleDashed, 
  LibraryBig, 
  History, 
  Trophy,
  Terminal,
  ChevronRight
} from "lucide-react";
import { Button, cn } from "@/components/ui";
import type { SeriesDetail } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";

async function fetchSeriesDetail(seriesId: string) {
  const response = await fetch(`/api/series/${seriesId}`);
  return readJsonResponse<SeriesDetail>(response);
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/2 shadow-xl transition-transform duration-500 group-hover:scale-110">
        <Image alt="" className="object-cover opacity-30 blur-lg" fill sizes="64px" src={coverUrl} />
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

export function SeriesDetailPageClient({ seriesId }: { seriesId: string }) {
  const detailQuery = useQuery({
    queryKey: ["series-detail", seriesId],
    queryFn: () => fetchSeriesDetail(seriesId)
  });

  if (detailQuery.isLoading) {
    return (
      <section className="space-y-16 pt-24 pb-40">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />

        {/* Hero Skeleton */}
        <div className="space-y-8 py-10">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>

        <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
          <div className="space-y-12">
             <div className="h-[600px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
          </div>
          <div className="space-y-12">
             <div className="h-[300px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
             <div className="h-[400px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
          </div>
        </div>
      </section>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="pt-24 text-center">
        <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12">
            <h2 className="mb-4 font-serif text-3xl font-bold text-white">Seri Verisi Yükleme Hatası</h2>
            <p className="mx-auto max-w-md text-sm text-foreground italic">
                {detailQuery.error instanceof Error ? detailQuery.error.message : "Bu seriye ait bilgiler alınamadı."}
            </p>
            <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
                <Link href="/series">Seri Listesine Dön</Link>
            </Button>
        </div>
      </section>
    );
  }

  const detail = detailQuery.data;

  return (
    <section className="space-y-16 pt-24 pb-40">
      <div className="duration-700 animate-in fade-in slide-in-from-left-4">
        <Button asChild variant="ghost" className="group rounded-xl px-0 hover:bg-transparent">
            <Link href="/series" className="flex items-center gap-2 text-foreground transition-colors group-hover:text-primary">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Tüm Seriler</span>
            </Link>
        </Button>
      </div>

      <PageHero
        description="Bu seri kapsamındaki tüm kitaplar. Serinin tamamlanma durumunu ve eksik ciltleri buradan takip edebilirsiniz."
        kicker="Seri Detayı"
        title={detail.name}
      />

      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        <div className="space-y-12">
            <div className="glass-panel overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
                <div className="flex flex-col items-start justify-between gap-8 border-b border-white/3 bg-white/1 px-8 py-10 md:flex-row md:items-center md:px-12">
                    <div>
                        <h3 className="font-serif text-3xl font-bold tracking-tight text-white">Koleksiyondaki Ciltler</h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-foreground italic">Koleksiyonunuzda bulunan seri kitapları.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-8 md:gap-12">
                         <div className="flex items-center gap-6">
                            <div className="hidden h-14 w-px bg-white/5 md:block" />
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-4">
                                <span className="font-serif text-4xl font-bold tracking-tighter text-white">{detail.totalVolumes ?? "∞"}</span>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/3 text-primary">
                                  <LibraryBig className="h-5.5 w-5.5" />
                                </div>
                              </div>
                              <p className="line-clamp-1 text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Toplam Cilt Sayısı</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="hidden h-14 w-px bg-white/5 md:block" />
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-4">
                                <span className="font-serif text-4xl font-bold tracking-tighter text-white">{detail.ownedVolumes.length}</span>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/3 text-primary">
                                  <History className="h-5.5 w-5.5" />
                                </div>
                              </div>
                              <p className="line-clamp-1 text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Mevcut Cilt Sayısı</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="hidden h-14 w-px bg-white/5 md:block" />
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-4">
                                <span className="font-serif text-4xl font-bold tracking-tighter text-white">{detail.completionPercentage ?? 0}%</span>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/3 text-primary">
                                  <Trophy className="h-5.5 w-5.5" />
                                </div>
                              </div>
                              <p className="line-clamp-1 text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Tamamlanma Oranı</p>
                            </div>
                          </div>
                    </div>
                </div>

                <div className="space-y-4 p-4 md:p-8">
                    {detail.ownedVolumes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center text-foreground/40">
                            <LibraryBig className="mb-6 h-12 w-12 opacity-20" />
                            <p className="font-serif text-xl font-bold italic">Bu seriden henüz bir kitap eklenmemiş.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {detail.ownedVolumes.map((volume, idx) => (
                                <Link
                                    className="group relative flex items-center gap-6 rounded-2xl border border-white/2 bg-white/1 p-4 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 hover:border-white/10 hover:bg-white/4"
                                    href={`/books/${volume.slug}`}
                                    key={volume.bookId}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <BookThumb coverUrl={volume.coverUrl} title={volume.title} />
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="line-clamp-2 font-serif text-2xl leading-tight font-bold tracking-tight text-white transition-colors group-hover:text-primary">
                                                {volume.title}
                                            </p>
                                            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[9px] font-bold tracking-widest text-primary uppercase">
                                                {volume.seriesOrder ? `Cilt ${volume.seriesOrder}` : "Ardışık Dizin Eksik"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">{volume.status}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 rounded-xl p-3 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">
                                        <ChevronRight className="h-5 w-5 text-primary" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-12 delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-12">
          <div className="glass-panel overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl">
            <div className="border-b border-white/3 px-8 py-10">
              <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Eksik Ciltler</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground italic">Seri içinde henüz koleksiyona eklenmemiş olan ciltler.</p>
            </div>
            <div className="p-8">
              {detail.totalVolumes == null ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-foreground/80">
                   <CircleDashed className="mb-4 h-10 w-10 animate-spin-slow" />
                   <p className="text-[11px] font-bold tracking-[0.2em] uppercase">Toplam Cilt Sayısı Belirtilmemiş</p>
                </div>
              ) : detail.missingVolumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-emerald-400/40">
                   <Trophy className="mb-4 h-10 w-10" />
                   <p className="text-[11px] font-bold tracking-[0.2em] uppercase">Seri Tamamlandı</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {detail.missingVolumes.map((volume) => (
                    <div
                      className="group/chip relative rounded-xl border border-white/5 bg-white/2 px-4 py-2 transition-all duration-500 hover:border-white/10 hover:bg-white/5"
                      key={volume}
                    >
                      <span className="text-[11px] font-bold tracking-widest text-foreground uppercase transition-colors group-hover/chip:text-primary">Cilt {volume}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl">
            <div className="border-b border-white/3 px-8 py-10">
              <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Tamamlanma Durumu</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground italic">Serinin genel tamamlanma metriği.</p>
            </div>
            <div className="p-8">
                <div className="group glass-panel relative overflow-hidden rounded-3xl border-white/5 bg-white/1 p-8 shadow-inner transition-all duration-700 hover:border-white/10">
                   <div className="relative flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
                                <BookMarked className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Tamamlanma Oranı</p>
                                <p className="font-serif text-4xl font-bold tracking-tighter text-white">
                                    {detail.completionPercentage == null ? "0" : detail.completionPercentage}<span className="ml-1 text-xl text-foreground">%</span>
                                </p>
                            </div>
                        </div>
                        {detail.totalVolumes != null && detail.completionPercentage === 100 && (
                            <div className="rounded-full bg-emerald-400/20 p-1 text-emerald-400">
                                <Trophy className="h-5 w-5" />
                            </div>
                        )}
                   </div>

                   <div className="relative mt-8 space-y-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/3">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-2000 ease-in-out",
                                    detail.completionPercentage === 100 ? "bg-emerald-400" : "bg-primary"
                                )} 
                                style={{ width: `${detail.completionPercentage ?? 0}%` }} 
                            />
                        </div>
                        <div className="flex items-center justify-between px-1 text-[9px] font-bold tracking-widest text-foreground uppercase">
                            <span>Başlangıç</span>
                            <span>Hedef</span>
                        </div>
                   </div>
                </div>

                <div className="mt-8 flex items-center gap-3 px-1 text-foreground">
                    <Terminal className="h-3 w-3" />
                    <p className="text-[9px] font-bold tracking-[0.15em] uppercase">Seri bilgileri günceldir.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
