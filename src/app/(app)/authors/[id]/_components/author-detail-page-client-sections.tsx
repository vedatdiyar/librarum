"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart3, Check, History, LoaderCircle, Pencil, Trophy, X, LibraryBig } from "lucide-react";
import { Button, ChartFrame, Input, Skeleton } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import type { AuthorDetail } from "@/types";
import { BOOK_STATUS_LABELS } from "@/lib/constants/books";

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

export function AuthorDetailPageClientLoading() {
  return (
    <div className="space-y-12 pb-24">
      {/* Top Nav Skeleton */}
      <Skeleton className="h-4 w-32 rounded-full" />

      {/* Hero Skeleton */}
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-6">
           <Skeleton className="h-16 w-3/4 max-w-xl rounded-2xl" />
           <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
           {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton className="h-28 rounded-3xl border border-white/5 bg-white/2" key={`stat-skeleton-client-${i}`} />
           ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
           <Skeleton className="h-[600px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-8 lg:col-span-4">
           <Skeleton className="h-[400px] rounded-3xl border border-white/5 bg-white/2" />
           <Skeleton className="h-[300px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}

export function AuthorDetailPageClientError({ message }: { message: string }) {
  return (
    <div className="glass-panel flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border-rose-400/20 bg-rose-400/5 p-12 text-center">
      <div className="mb-6 rounded-2xl bg-rose-400/10 p-4">
        <X className="h-8 w-8 text-rose-400" />
      </div>
      <h2 className="mb-4 font-serif text-3xl font-bold text-foreground">Yazar Bilgileri Yüklenemedi</h2>
      <p className="mx-auto max-w-md text-sm text-foreground italic">{message}</p>
      <Button asChild className="mt-8 rounded-xl bg-white text-black transition-all hover:bg-primary" variant="ghost">
        <Link href="/authors">Yazarlar Listesine Dön</Link>
      </Button>
    </div>
  );
}

export function AuthorDetailPageClientBackLink() {
  return (
    <nav className="flex items-center justify-between duration-700 animate-in fade-in slide-in-from-top-4">
      <Button asChild variant="ghost" className="group -ml-2 rounded-xl px-2 hover:bg-muted/40">
        <Link href="/authors" className="flex items-center gap-2 text-white transition-colors group-hover:text-primary">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Yazarlar Koleksiyonuna Dön</span>
        </Link>
      </Button>
    </nav>
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
  const initial = author.name.charAt(0).toUpperCase();

  return (
    <header className="space-y-12">
      {/* Author Identity & Actions */}
      <div className="space-y-10">
        <div className="space-y-8 duration-1000 animate-in fade-in fill-mode-both slide-in-from-left-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
                 Kütüphane Kaydı
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-6 duration-500 animate-in zoom-in-95">
                  <div className="space-y-2">
                    <label className="sr-only" htmlFor="edit-author-name">Yazar Adını Düzenle</label>
                    <Input
                      aria-label="Yazar Adı"
                      className="h-20 border-none bg-transparent p-0 font-serif text-3xl font-bold tracking-tight text-white ring-0 outline-none focus-visible:ring-0 md:text-5xl lg:text-6xl"
                      id="edit-author-name"
                      name="authorName"
                      onChange={(event) => setNameDraft(event.target.value)}
                      ref={nameInputRef}
                      value={nameDraft}
                    />
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                    <Button onClick={onSubmit} className="h-12 rounded-xl bg-white px-8 text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary">
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
                    {author.name}
                  </h1>
                  <Button 
                    onClick={onStartEditing} 
                    className="h-10 w-10 shrink-0 rounded-xl border-white/10 bg-white/5 p-0 text-white transition-all hover:bg-white/10 hover:text-primary" 
                    variant="ghost"
                    title="Yazarı Düzenle"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
           </div>
        <div className="grid w-full grid-cols-2 gap-4 delay-200 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-6 lg:grid-cols-4">
            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <LibraryBig className="h-5 w-5" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase">Toplam Eser</p>
                  <p className="font-serif text-3xl font-bold text-white">{author.bookCount}</p>
               </div>
            </div>

            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <Trophy className="h-5 w-5" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase">Genel Puan</p>
                  <p className="font-serif text-3xl font-bold text-white">{formatAverageRating(author.averageRating)}</p>
               </div>
            </div>

            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <BarChart3 className="h-5 w-5" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase">Tür Sayısı</p>
                  <p className="font-serif text-3xl font-bold text-white">{author.categoryDistribution.filter(c => c.count > 0).length}</p>
               </div>
            </div>

            <div className="glass-panel group flex flex-col items-start gap-4 rounded-3xl border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3">
               <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-black">
                  <History className="h-5 w-5" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase">Aktif Seriler</p>
                  <p className="font-serif text-3xl font-bold text-white">{author.relatedSeries.length}</p>
               </div>
            </div>
        </div>
      </div>
      </div>
    </header>
  );
}

export function AuthorDetailPageClientVolumesSection({ author }: { author: AuthorDetail }) {
  const books = author.books;
  return (
    <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl delay-300 duration-1000 animate-in fade-in fill-mode-both slide-in-from-bottom-12">
      <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
        <div>
          <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Eserleri</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground italic">Yazarın kütüphanenizde kayıtlı olan tüm kitapları.</p>
        </div>
      </div>

      <div className="p-6 md:p-8 lg:p-10">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-foreground/40">
            <LibraryBig className="mb-6 h-12 w-12 opacity-20" />
            <p className="font-serif text-xl font-bold italic">Henüz bir eser eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((book, index) => (
              <Link
                className="group relative flex h-full items-center gap-6 rounded-2xl border border-white/5 bg-white/2 p-4 transition-all duration-500 hover:border-primary/20 hover:bg-white/5"
                href={`/books/${book.slug}`}
                key={book.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BookThumb coverUrl={book.coverUrl} title={book.title} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="line-clamp-1 font-serif text-xl font-bold tracking-tight text-white transition-colors group-hover:text-primary">{book.title}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 opacity-60">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-[9px] font-bold tracking-widest text-foreground uppercase">{BOOK_STATUS_LABELS[book.status]}</span>
                    </div>
                    {book.rating != null && (
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3 w-3 shrink-0 text-primary" />
                        <span className="text-[9px] font-bold tracking-widest text-foreground uppercase">{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
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
    <div className="glass-panel min-w-0 overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl">
      <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
        <h3 className="font-serif text-xl font-bold tracking-tight text-white">Tür Dağılımı</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground italic">Eserlerin kategorilere göre kütüphanedeki ağırlığı.</p>
      </div>
      <div className="p-8 md:p-10">
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-foreground/80">
            <BarChart3 className="mb-4 h-10 w-10" />
            <p className="text-sm font-bold tracking-widest uppercase">Veri bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-8">
            <ChartFrame height={280}>
              <ResponsiveContainer height="100%" minHeight={280} minWidth={0} width="100%">
                <BarChart data={categoryData} margin={{ top: 12, right: 8, left: -20, bottom: 55 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    axisLine={false} 
                    dataKey="name" 
                    interval={0} 
                    tick={{ 
                      fill: "var(--foreground)", 
                      fontSize: 9, 
                      fontWeight: 700, 
                      opacity: 0.8,
                      angle: -35,
                      textAnchor: 'end'
                    }} 
                    tickLine={false} 
                  />
                  <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 700, opacity: 0.6 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      background: "rgba(20,20,20,0.9)",
                      backdropFilter: "blur(12px)",
                      padding: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                    }}
                    itemStyle={{
                      color: "#c5a059",
                      fontSize: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }}
                    labelStyle={{
                      color: "white",
                      marginBottom: "4px",
                      fontWeight: "bold"
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="count" name="Kitap Sayısı" fill="#c5a059" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell 
                        fill={["#c5a059", "#e0d0b0", "#eadabf", "#fff", "#c5a059"][index % 5]} 
                        key={`${entry.name}-${entry.count}`} 
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
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
    <div className="glass-panel overflow-hidden rounded-3xl border-white/5 bg-white/1 shadow-2xl">
      <div className="border-b border-white/5 bg-white/2 px-8 py-8 md:px-10">
        <h3 className="font-serif text-xl font-bold tracking-tight text-white">Seriler</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground italic">Yazarın eserlerinin yer aldığı seriler.</p>
      </div>
      <div className="space-y-4 p-8 md:p-10">
        {relatedSeries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-foreground/80">
            <LibraryBig className="mb-4 h-10 w-10" />
            <p className="text-sm font-bold tracking-widest uppercase">Seri kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {relatedSeries.map((series) => (
              <Link
                className="group flex items-center justify-between gap-6 rounded-2xl border border-white/2 bg-white/1 p-6 transition-all duration-500 hover:border-white/10 hover:bg-white/4"
                href={`/series/${series.slug}`}
                key={series.id}
              >
                <div className="space-y-1.5">
                  <p className="font-serif text-xl leading-tight font-bold tracking-tight text-white transition-colors group-hover:text-primary">{series.name}</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase italic">
                    {series.totalVolumes ? `${series.ownedCount} / ${series.totalVolumes} kitap` : `${series.ownedCount} kitap`}
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
