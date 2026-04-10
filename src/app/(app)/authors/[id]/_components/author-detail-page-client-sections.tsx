"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart3, Check, History, LoaderCircle, Pencil, Trophy, X, LibraryBig } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import type { AuthorDetail } from "@/types";

const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function formatAverageRating(value: number | null) {
  return value == null ? "—" : value.toFixed(2);
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

export function AuthorDetailPageClientLoading() {
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
        <div className="h-11 w-48 animate-pulse rounded-xl bg-white/5" />
      </div>

      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        <div className="space-y-12">
           <div className="h-[600px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-12">
           <div className="h-[400px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
           <div className="h-[300px] animate-pulse rounded-[40px] border border-white/5 bg-white/2" />
        </div>
      </div>
    </section>
  );
}

export function AuthorDetailPageClientError({ message }: { message: string }) {
  return (
    <section className="pt-24 text-center">
      <div className="glass-panel rounded-[40px] border-rose-400/20 bg-rose-400/5 p-12">
        <h2 className="mb-4 font-serif text-3xl font-bold text-foreground">Yazar Eşitleme Hatası</h2>
        <p className="mx-auto max-w-md text-sm text-foreground italic">{message}</p>
        <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
          <Link href="/authors">Kayıt Defterine Dön</Link>
        </Button>
      </div>
    </section>
  );
}

export function AuthorDetailPageClientBackLink() {
  return (
    <div className="duration-700 animate-in fade-in slide-in-from-left-4">
      <Button asChild className="group rounded-xl px-0 hover:bg-transparent" variant="ghost">
        <Link href="/authors" className="flex items-center gap-2 text-foreground transition-colors group-hover:text-primary">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Yazar Kaydı</span>
        </Link>
      </Button>
    </div>
  );
}

export function AuthorDetailPageClientHero({
  author,
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
  author: AuthorDetail;
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
    <PageHero
      action={
        isEditing ? (
          <div className="w-full max-w-2xl space-y-6 duration-500 animate-in zoom-in-95">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="edit-author-name">Yazar Adını Düzenle</label>
              <Input
                aria-label="Yazar Adı"
                className="h-16 rounded-2xl border-white/10 bg-white/2 px-6 font-serif text-3xl font-bold transition-all focus:border-primary/40 focus:bg-white/4"
                id="edit-author-name"
                name="authorName"
                onChange={(event) => setNameDraft(event.target.value)}
                ref={nameInputRef}
                value={nameDraft}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Button onClick={onSubmit} className="h-12 rounded-xl bg-white px-8 text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary">
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Değişikliği Uygula
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
          <Button onClick={onStartEditing} className="h-11 rounded-xl border-white/10 bg-white/3 px-6 text-[11px] font-bold tracking-widest text-white/40 uppercase transition-all hover:bg-white/8 hover:text-white" variant="ghost">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Yazar Kaydını Düzenle
          </Button>
        )
      }
      description="Bu yazara atfedilen tüm dizinlenmiş arşiv girişlerinin listesi. Alan odaklı dağılımı ve seri eşlemelerini içerir."
      kicker="Yazar Bilgileri"
      title={author.name}
    />
  );
}

export function AuthorDetailPageClientVolumesSection({ author }: { author: AuthorDetail }) {
  const books = author.books;
  return (
    <div className="glass-panel overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
      <div className="flex flex-col items-start justify-between gap-8 border-b border-white/3 bg-white/1 px-8 py-10 md:flex-row md:items-center md:px-12">
        <div>
          <h3 className="font-serif text-3xl font-bold tracking-tight text-white">Eser Arşivi</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground italic">Bu yazar altında kaydedilmiş eserlerin kapsamlı listesi.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-8 md:gap-12">
           <div className="flex items-center gap-6">
              <div className="hidden h-14 w-px bg-white/5 md:block" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-4xl font-bold tracking-tighter text-white">{author.bookCount}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/3 text-primary">
                    <LibraryBig className="h-5.5 w-5.5" />
                  </div>
                </div>
                <p className="line-clamp-1 text-[10px] font-bold tracking-[0.3em] text-primary/80 uppercase">Arşiv Yoğunluğu</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden h-14 w-px bg-white/5 md:block" />
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-4xl font-bold tracking-tighter text-white">{formatAverageRating(author.averageRating)}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/3 text-primary">
                    <Trophy className="h-5.5 w-5.5" />
                  </div>
                </div>
                <p className="line-clamp-1 text-[10px] font-bold tracking-[0.3em] text-primary/80 uppercase">Entelektüel Ortalama</p>
              </div>
            </div>
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-8">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-foreground/40">
            <LibraryBig className="mb-6 h-12 w-12 opacity-20" />
            <p className="font-serif text-xl font-bold italic">Mevcut listede eser bulunamadı.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {books.map((book, index) => (
              <Link
                className="group relative flex items-center gap-6 rounded-2xl border border-white/2 bg-white/1 p-4 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-left-4 hover:border-white/10 hover:bg-white/4"
                href={`/books/${book.slug}`}
                key={book.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BookThumb coverUrl={book.coverUrl} title={book.title} />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="line-clamp-2 font-serif text-2xl leading-tight font-bold tracking-tight text-white transition-colors group-hover:text-primary">{book.title}</p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      <span className="text-[10px] font-bold tracking-widest text-foreground uppercase">{book.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-foreground uppercase">{book.rating == null ? "Puansız" : `${book.rating.toFixed(1)} Hakimiyet`}</span>
                    </div>
                    {book.series ? (
                      <div className="flex items-center gap-2 rounded-md border border-white/5 bg-white/5 px-2 py-0.5">
                        <LibraryBig className="h-2.5 w-2.5 text-foreground" />
                        <span className="text-[9px] font-bold tracking-widest text-foreground uppercase">
                          {book.series.name}
                          {book.series.seriesOrder ? ` • Cilt ${book.series.seriesOrder}` : ""}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 rounded-xl p-3 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">
                  <ArrowLeft className="h-4 w-4 rotate-180 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthorDetailPageClientDomainSection({
  categoryData
}: {
  categoryData: Array<AuthorDetail["categoryDistribution"][number]>;
}) {
  return (
    <div className="glass-panel min-w-0 overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl">
      <div className="border-b border-white/3 px-8 py-10">
        <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Alan Varyansı</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-foreground italic">Koleksiyon içindeki alanlar arası dağılım.</p>
      </div>
      <div className="p-8">
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-foreground/80">
            <BarChart3 className="mb-4 h-10 w-10" />
            <p className="text-sm font-bold tracking-widest uppercase">Alan Verisi Yok</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer height="100%" minHeight={280} minWidth={0} width="100%">
                <BarChart data={categoryData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis axisLine={false} dataKey="name" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      background: "rgba(0,0,0,0.8)",
                      backdropFilter: "blur(12px)",
                      color: "white"
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={`${entry.name}-${entry.count}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {categoryData.map((item, index) => (
                <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/2 px-5 py-4 transition-all hover:bg-white/4" key={`${item.name}-${item.count}`}>
                  <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-[13px] font-bold tracking-tight text-white/60 transition-colors group-hover:text-white">{item.name}</span>
                  </div>
                  <span className="font-serif text-lg font-bold text-white/40">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthorDetailPageClientContinuitySection({ relatedSeries }: { relatedSeries: AuthorDetail["relatedSeries"] }) {
  return (
    <div className="glass-panel overflow-hidden rounded-[40px] border-white/5 bg-white/1 shadow-2xl">
      <div className="border-b border-white/3 px-8 py-10">
        <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Süreklilik Eşlemeleri</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-foreground italic">Çok ciltli setlerdeki yazar varlığı.</p>
      </div>
      <div className="space-y-3 p-4 md:p-6">
        {relatedSeries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-foreground/80">
            <LibraryBig className="mb-4 h-10 w-10" />
            <p className="text-sm font-bold tracking-widest uppercase">Eşleşme Saptanmadı</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {relatedSeries.map((series) => (
              <Link
                className="group flex items-center justify-between gap-6 rounded-2xl border border-white/2 bg-white/1 p-6 transition-all duration-500 hover:border-white/10 hover:bg-white/4"
                href={`/series/${series.id}`}
                key={series.id}
              >
                <div className="space-y-1.5">
                  <p className="font-serif text-xl leading-tight font-bold tracking-tight text-white transition-colors group-hover:text-primary">{series.name}</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase italic">
                    {series.totalVolumes ? `${series.ownedCount} / ${series.totalVolumes} arşivlenmiş baskı` : `${series.ownedCount} arşivlenmiş baskı`}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/5 bg-white/3 p-3 text-foreground transition-all duration-700 group-hover:bg-primary/10 group-hover:text-primary">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
