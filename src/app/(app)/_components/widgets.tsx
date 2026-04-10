"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, BookCopy, BookOpen, BrainCircuit, Clock3, LoaderCircle, UserRound, Waypoints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@/components/ui";
import { StatCard } from "@/components/stat-card";
import type { CategoryDistributionPoint, StatsSnapshot } from "@/types";

const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });

const CHART_COLORS = ["#EBD5A9", "#D4AF37", "#C5A059", "#AD9A74", "#8E733E"];
const CHART_MARGIN = { top: 20, right: 0, left: -24, bottom: 0 };
const TOOLTIP_STYLE = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--popover)",
  backdropFilter: "blur(12px)",
  color: "var(--popover-foreground)",
  boxShadow: "var(--shadow-lg)"
};

function formatAuthors(authors: Array<{ name: string }>) {
  return authors.map((author) => author.name).join(", ") || "Yazar belirtilmedi";
}

export function WidgetState({
  message,
  isLoading
}: {
  message: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/5 bg-white/1 p-8 text-center duration-500 animate-in fade-in">
      {isLoading ? (
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="h-2 w-2 rounded-full bg-white/10" />
      )}
      <p className="max-w-[200px] text-sm leading-relaxed font-medium text-foreground">
        {message}
      </p>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  helper,
  icon: Icon,
  delayClass = ""
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  delayClass?: string;
}) {
  return (
    <StatCard
      description={helper}
      icon={Icon as any}
      label={label}
      value={value}
      className={cn("duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-4", delayClass)}
    />
  );
}

function BookThumb({
  title,
  coverUrl
}: {
  title: string;
  coverUrl: string | null;
}) {
  if (coverUrl) {
    return (
      <div className="relative h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/2 shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:border-white/20">
        <Image alt="" className="object-cover opacity-30 blur-md" fill sizes="48px" src={coverUrl} />
        <Image alt={`${title} kapagi`} className="relative object-contain" fill sizes="48px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/2 p-2 transition-all duration-500 group-hover:scale-105">
      <span className="line-clamp-3 text-center text-[8px] font-medium tracking-tighter text-foreground uppercase">{title}</span>
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel flex h-full min-w-0 flex-col rounded-[28px] border-white/5 bg-white/1", className)}>
      <div className="flex flex-row items-center justify-between border-b border-white/5 px-6 py-5">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-[11px] font-medium tracking-widest text-foreground uppercase">{description}</p>
        </div>
        {action}
      </div>
      <div className="min-w-0 p-6 pt-5">{children}</div>
    </div>
  );
}

export function SummaryStats({ stats }: { stats: StatsSnapshot }) {
  const completionRate =
    stats.totals.totalBooks > 0
      ? Math.round((stats.totals.completedBooks / stats.totals.totalBooks) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SnapshotCard
        delayClass="stagger-1"
        helper={`${stats.totals.totalCopies} kayıtlı eser.`}
        icon={BookCopy}
        label="Kütüphane"
        value={stats.totals.totalBooks}
      />
      <SnapshotCard
        delayClass="stagger-2"
        helper={`${stats.totals.completedBooks} kitap okundu.`}
        icon={BookOpen}
        label="Tamamlama Oranı"
        value={`%${completionRate}`}
      />
      <SnapshotCard
        delayClass="stagger-3"
        helper="Okunmayı bekleyen kitaplar."
        icon={Clock3}
        label="Okunacaklar"
        value={stats.totals.unreadBooks}
      />
      <SnapshotCard
        delayClass="stagger-4"
        helper={`Kütüphane dışındaki kitaplar.`}
        icon={Waypoints}
        label="Ödünçte"
        value={stats.totals.loanedBooks}
      />
    </div>
  );
}

export function BacklogWidget({
  unreadBacklogQuery,
  totalUnread
}: {
  unreadBacklogQuery: any;
  totalUnread: number;
}) {
  return (
    <DashboardSection
      action={
        <Link
          className="group flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-primary uppercase transition-colors hover:text-primary"
          href="/books"
        >
          Hepsini Gör
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      }
      description="Sırada bekleyen kitaplarınız"
      title={`Okunacaklar (${totalUnread})`}
    >
      {unreadBacklogQuery.isLoading ? (
        <WidgetState isLoading message="Liste yükleniyor..." />
      ) : unreadBacklogQuery.isError ? (
        <WidgetState
          message="Sıra getirilemedi"
        />
      ) : unreadBacklogQuery.data && unreadBacklogQuery.data.items.length > 0 ? (
        <div className="space-y-2">
          {unreadBacklogQuery.data.items.map((book: any, idx: number) => (
            <Link 
              className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-300 animate-in fade-in fill-mode-both slide-in-from-left-4 hover:border-white/5 hover:bg-white/3" 
              href={`/books/${book.slug}`} 
              key={book.id}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex min-w-0 items-center gap-4">
                <BookThumb coverUrl={book.coverUrl} title={book.title} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium tracking-tight text-foreground">
                    {formatAuthors(book.authors)}
                  </p>
                </div>
              </div>

              <div className="shrink-0 translate-x-4 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Bekleyen kitap yok. Yeni bir eser eklemeye ne dersiniz?" />
      )}
    </DashboardSection>
  );
}

export function AiSuggestionsWidget() {
  return (
    <DashboardSection
      action={
        <Link
          className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-primary uppercase transition-colors hover:text-white"
          href="/ai-suggestions"
        >
          Aç
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
      description="Eksik eserler, okuma önceliği ve tavsiyeler"
      title="Akıllı Öneriler"
    >
      <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
            Akıllı Öneriler
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
            Kütüphanenizdeki eksikleri tamamlayın, okuma önceliklerinizi belirleyin ve akıllı koleksiyon önerilerine göz atın.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition-all hover:bg-primary hover:text-white"
          href="/ai-suggestions"
        >
          Önerileri İncele
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </DashboardSection>
  );
}

export function RecentBooksWidget({ recentBooksQuery }: { recentBooksQuery: any }) {
  return (
    <DashboardSection
      description="Koleksiyonunuza son eklenen eserler"
      title="Son Eklenenler"
    >
      {recentBooksQuery.isLoading ? (
        <WidgetState isLoading message="Kitaplar listeleniyor..." />
      ) : recentBooksQuery.isError ? (
        <WidgetState
          message="Gelenler getirilemedi"
        />
      ) : recentBooksQuery.data && recentBooksQuery.data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {recentBooksQuery.data.items.map((book: any, idx: number) => (
            <Link 
                className="group flex flex-col items-center rounded-xl border border-transparent p-4 text-center transition-all duration-500 animate-in fade-in fill-mode-both zoom-in-95 hover:border-white/5 hover:bg-white/3" 
                href={`/books/${book.slug}`} 
                key={book.id}
                style={{ animationDelay: `${idx * 150}ms` }}
            >
                <div className="relative mb-4">
                    <BookThumb coverUrl={book.coverUrl} title={book.title} />
                </div>
                <div className="w-full min-w-0">
                    <p className="line-clamp-1 text-xs font-bold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
                        {book.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[10px] font-medium tracking-tighter text-foreground uppercase">
                        {formatAuthors(book.authors)}
                    </p>
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Henüz yeni bir kitap eklenmemiş." />
      )}
    </DashboardSection>
  );
}

export function FavoriteAuthorsWidget({ favoriteAuthorsQuery }: { favoriteAuthorsQuery: any }) {
  return (
    <DashboardSection
      description="En çok okuduğunuz yazarlar"
      title="Favori Yazarlar"
    >
      {favoriteAuthorsQuery.isLoading ? (
        <WidgetState isLoading message="Yazarlar listeleniyor..." />
      ) : favoriteAuthorsQuery.isError ? (
        <WidgetState
          message="Bir hata ile karşılaşıldı"
        />
      ) : favoriteAuthorsQuery.data && favoriteAuthorsQuery.data.length > 0 ? (
        <div className="space-y-2">
          {favoriteAuthorsQuery.data.map((author: any, idx: number) => (
            <Link 
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/1 p-4 transition-all duration-500 animate-in fade-in fill-mode-both slide-in-from-right-4 hover:border-primary/20" 
                href={`/authors/${author.slug}`}
                key={author.id}
                style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-foreground transition-all duration-500 group-hover:border-primary/30 group-hover:text-primary">
                  <UserRound className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {author.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold tracking-widest text-foreground uppercase">
                    {author.ratedBooks} değerlendirme
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <div className="font-serif text-lg font-bold text-primary transition-transform group-hover:scale-110">
                    {author.averageRating.toFixed(1)}
                </div>
                <div className="text-[10px] font-bold tracking-tighter text-foreground uppercase">Puan</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Henüz favori yazar yok." />
      )}
    </DashboardSection>
  );
}

export function CategoryDistributionWidget({
  categoryDistributionQuery,
  categoryChartData
}: {
  categoryDistributionQuery: any;
  categoryChartData: CategoryDistributionPoint[];
}) {
  return (
    <DashboardSection
      description="Koleksiyonunuzun konu dağılımı"
      title="Kategori Dağılımı"
    >
      {categoryDistributionQuery.isLoading ? (
        <WidgetState isLoading message="Kategoriler analiz ediliyor..." />
      ) : categoryDistributionQuery.isError ? (
        <WidgetState
          message="Kategoriler incelenirken hata oluştu"
        />
      ) : categoryChartData.length > 0 ? (
        <div className="space-y-8">
          <div className="h-[240px] w-full min-w-0 rounded-2xl border border-white/5 bg-white/1 p-4 shadow-inner">
            <ResponsiveContainer height="100%" minHeight={240} minWidth={0} width="100%">
              <BarChart data={categoryChartData} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "var(--foreground)", fontSize: 9, fontWeight: 700, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "var(--foreground)", fontSize: 9, fontWeight: 700 }}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255, 255, 255, 0.02)" }} wrapperStyle={{ outline: 'none' }} />
                <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      key={`${entry.name}-${index}`}
                      className="transition-opacity duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categoryChartData.map((entry, index) => (
              <div 
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/1 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-white/3" 
                  key={entry.name}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-xs font-bold text-foreground transition-colors group-hover:text-primary">{entry.name}</span>
                </div>

                <span className="font-serif text-[11px] font-bold text-foreground transition-colors group-hover:text-primary">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <WidgetState message="Henüz kategori verisi bulunmuyor." />
      )}
    </DashboardSection>
  );
}
