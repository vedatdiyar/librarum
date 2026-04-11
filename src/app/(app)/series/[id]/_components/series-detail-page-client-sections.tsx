"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookMarked, 
  Check, 
  History, 
  LibraryBig, 
  LoaderCircle, 
  Pencil, 
  Trophy, 
  X,
  ChevronRight,
  CircleDashed,
  Terminal
} from "lucide-react";
import { Button, Input, cn } from "@/components/ui";
import type { SeriesDetail } from "@/types";
import { BOOK_STATUS_LABELS } from "@/lib/constants/books";


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

export function SeriesDetailPageClientLoading() {
  return (
    <div className="space-y-12 pb-24">
      <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-6">
           <div className="h-16 w-3/4 max-w-xl rounded-2xl bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
           {Array.from({ length: 3 }).map((_, i) => (
              <div className="h-28 rounded-3xl border border-white/5 bg-white/2" key={`stat-skeleton-${i}`} />
           ))}
        </div>
      </div>
      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        <div className="h-[600px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
        <div className="space-y-12">
           <div className="h-[300px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
           <div className="h-[400px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}

export function SeriesDetailPageClientError({ message }: { message: string }) {
  return (
    <div className="glass-panel flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border-rose-400/20 bg-rose-400/5 p-12 text-center">
      <div className="mb-6 rounded-2xl bg-rose-400/10 p-4">
        <X className="h-8 w-8 text-rose-400" />
      </div>
      <h2 className="mb-4 font-serif text-3xl font-bold text-white">Seri Verisi Yükleme Hatası</h2>
      <p className="mx-auto max-w-md text-sm text-foreground italic">{message}</p>
      <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
        <Link href="/series">Seri Listesine Dön</Link>
      </Button>
    </div>
  );
}

export function SeriesDetailPageClientBackLink() {
  return (
    <nav className="flex items-center justify-between duration-700 animate-in fade-in slide-in-from-top-4">
      <Button asChild variant="ghost" className="group -ml-2 rounded-xl px-2 hover:bg-white/10">
        <Link href="/series" className="flex items-center gap-2 text-white transition-colors group-hover:text-primary">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Seri Koleksiyonuna Dön</span>
        </Link>
      </Button>
    </nav>
  );
}

export function SeriesDetailPageClientHero({
  series,
  isEditing,
  nameDraft,
  setNameDraft,
  nameInputRef,
  onStartEditing,
  onSubmit,
  onCancel,
  isPending,
  errorMessage
}: {
  series: SeriesDetail;
  isEditing: boolean;
  nameDraft: string;
  setNameDraft: (value: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  onStartEditing: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  errorMessage: string | null;
}) {
  return (
    <header className="space-y-12">
      <div className="space-y-10">
        <div className="space-y-8 duration-1000 animate-in fade-in fill-mode-both slide-in-from-left-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
                 Seri Kaydı
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-6 duration-500 animate-in zoom-in-95">
                  <div className="space-y-2">
                    <label className="sr-only" htmlFor="edit-series-name">Seri Adını Düzenle</label>
                    <Input
                      aria-label="Seri Adı"
                      className="h-20 border-none bg-transparent p-0 font-serif text-3xl font-bold tracking-tight text-white ring-0 outline-none focus-visible:ring-0 md:text-5xl lg:text-6xl"
                      id="edit-series-name"
                      onChange={(event) => setNameDraft(event.target.value)}
                      ref={nameInputRef}
                      value={nameDraft}
                    />
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                    <Button onClick={onSubmit} className="h-12 rounded-xl bg-white px-8 text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary" disabled={isPending}>
                      {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Güncelle
                    </Button>
                    <Button
                      onClick={onCancel}
                      className="h-12 rounded-xl border-white/10 bg-white/3 px-8 text-[11px] font-bold tracking-widest text-white/40 uppercase transition-all hover:bg-white/8 hover:text-white"
                      variant="ghost"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Vazgeç
                    </Button>
                  </div>
                  {errorMessage ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] font-bold tracking-tight text-destructive uppercase">{errorMessage}</div> : null}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <h1 className="font-serif text-3xl leading-tight font-bold tracking-tight wrap-break-word text-white md:text-5xl lg:text-6xl">
                    {series.name}
                  </h1>
                  <Button 
                    onClick={onStartEditing} 
                    className="h-10 w-10 shrink-0 rounded-xl border-white/10 bg-white/5 p-0 text-white transition-all hover:bg-white/10 hover:text-primary" 
                    variant="ghost"
                    title="Seriyi Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
           </div>

           <div className="grid w-full grid-cols-2 gap-4 delay-200 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-6 lg:grid-cols-3">
            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <LibraryBig className="h-5 w-5" />
               </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Koleksiyon</p>
                  <p className="font-serif text-3xl font-bold text-white">{series.ownedVolumes.length}</p>
               </div>
            </div>

            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <History className="h-5 w-5" />
               </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Toplam Cilt</p>
                  <p className="font-serif text-3xl font-bold text-white">{series.totalVolumes ?? "∞"}</p>
               </div>
            </div>

            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <Trophy className="h-5 w-5" />
               </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase">Tamamlanma Oranı</p>
                  <p className="font-serif text-3xl font-bold text-white">{series.completionPercentage ?? 0}%</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SeriesDetailPageClientVolumesSection({ series }: { series: SeriesDetail }) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
      <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
        <div>
          <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Koleksiyondaki Ciltler</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/80 italic">Kütüphanenizde bu seriye ait bulunan tüm kitaplar.</p>
        </div>
      </div>

      <div className="p-6 md:p-8 lg:p-10">
        {series.ownedVolumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-foreground/80">
            <LibraryBig className="mb-6 h-12 w-12 opacity-80" />
            <p className="font-serif text-xl font-bold italic">Henüz bir eser eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {series.ownedVolumes.map((volume, index) => (
              <Link
                className="group relative flex h-full items-center gap-6 rounded-2xl border border-white/5 bg-white/2 p-4 transition-all duration-500 hover:border-primary/20 hover:bg-white/5"
                href={`/books/${volume.slug}`}
                key={volume.bookId}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BookThumb coverUrl={volume.coverUrl} title={volume.title} />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="line-clamp-1 font-serif text-xl font-bold tracking-tight text-white transition-colors group-hover:text-primary">{volume.title}</p>
                        {volume.seriesOrder && (
                            <div className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[8px] font-bold tracking-widest text-primary uppercase">
                                Cilt {volume.seriesOrder}
                            </div>
                        )}
                    </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-80">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-[9px] font-bold tracking-widest text-foreground uppercase">{BOOK_STATUS_LABELS[volume.status]}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 rounded-xl p-2 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SeriesDetailPageClientStatusSection({ series }: { series: SeriesDetail }) {
  return (
    <div className="space-y-12 delay-500 duration-1000 animate-in fade-in fill-mode-both slide-in-from-right-12">
        <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl">
            <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
                <h3 className="font-serif text-xl font-bold tracking-tight text-white">Eksik Ciltler</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/80 italic">Henüz kütüphanenize eklenmemiş olan eksik ciltler.</p>
            </div>
            <div className="p-8">
                {series.totalVolumes == null ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-foreground/90">
                        <CircleDashed className="mb-4 h-8 w-8 animate-spin-slow" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">Toplam Cilt Belirtilmemiş</p>
                    </div>
                ) : series.missingVolumes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-emerald-400/80">
                        <Trophy className="mb-4 h-10 w-10" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">Seri Tamamlandı</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {series.missingVolumes.map((num) => (
                            <div key={num} className="group/chip relative rounded-lg border border-white/5 bg-white/2 px-3 py-1.5 transition-all duration-500 hover:border-white/10 hover:bg-white/5">
                                <span className="text-[10px] font-bold tracking-widest text-foreground uppercase transition-colors group-hover/chip:text-primary">Cilt {num}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl">
            <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
                <h3 className="font-serif text-xl font-bold tracking-tight text-white">İlerleme</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/80 italic">Serinin genel tamamlanma durumu.</p>
            </div>
            <div className="p-8">
                <div className="group glass-panel relative overflow-hidden rounded-2xl border-white/5 bg-white/1 p-6 shadow-inner transition-all duration-700 hover:border-white/10">
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
                                <BookMarked className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold tracking-widest text-foreground/80 uppercase">Tamamlanma Oranı</p>
                                <p className="font-serif text-3xl font-bold text-white">
                                    {series.completionPercentage ?? 0}<span className="ml-1 text-sm text-foreground/80">%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-2000 ease-in-out",
                                    series.completionPercentage === 100 ? "bg-emerald-400" : "bg-primary"
                                )} 
                                style={{ width: `${series.completionPercentage ?? 0}%` }} 
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 px-1 text-foreground/80">
                    <Terminal className="h-3 w-3" />
                    <p className="text-[9px] font-bold tracking-widest uppercase">Veriler kütüphane kayıtlarıyla anlık olarak senkronize edilir.</p>
                </div>
            </div>
        </div>
    </div>
  );
}
