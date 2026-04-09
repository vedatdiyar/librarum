"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, BookCopy, BookOpen, BrainCircuit, Clock3, LoaderCircle, UserRound, Waypoints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@/components/ui";
import type { CategoryDistributionPoint, StatsSnapshot } from "@/types";

const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });

const CHART_COLORS = ["#1f635d", "#6f8f7a", "#d3b88c", "#8fa6a0", "#7b6f67"];
const CHART_MARGIN = { top: 8, right: 0, left: -24, bottom: 0 };
const TOOLTIP_STYLE = {
  border: "1px solid rgba(221, 214, 201, 1)",
  borderRadius: "18px",
  background: "rgba(252, 251, 247, 0.96)",
  color: "rgba(21, 23, 24, 1)",
  boxShadow: "0 16px 44px -24px rgba(26, 35, 36, 0.22)"
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
    <div className="empty-panel animate-in fade-in duration-300">
      <p className="flex items-center gap-3 text-sm leading-6 text-text-secondary">
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
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
  tintClassName,
  delayClass = ""
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tintClassName: string;
  delayClass?: string;
}) {
  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/70 bg-card/95 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        delayClass
      )}
      surface="raised"
    >
      <CardContent className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              {label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-text-primary">
              {value}
            </p>
          </div>

          <div className={cn("flex h-12 w-12 items-center justify-center rounded-[18px]", tintClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-text-secondary">{helper}</p>
      </CardContent>
    </Card>
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
      <div className="relative h-16 w-12 overflow-hidden rounded-xl border border-border/70 bg-card">
        <Image alt={`${title} kapagi`} className="object-cover" fill sizes="48px" src={coverUrl} />
      </div>
    );
  }

  return (
    <div className="book-placeholder h-16 w-12 rounded-xl p-1.5">
      <span className="line-clamp-3 text-center text-[9px] leading-3 text-text-primary/40">{title}</span>
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
    <Card className={cn("overflow-hidden border-border/70 bg-card/95", className)} surface="raised">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/60 pb-5">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2 max-w-xl">{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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
        helper={`${stats.totals.totalCopies} adet fiziksel nusha envantere kayitli.`}
        icon={BookCopy}
        label="Toplam kitap"
        tintClassName="bg-accent text-accent-foreground"
        value={stats.totals.totalBooks}
      />
      <SnapshotCard
        delayClass="stagger-2"
        helper={`${stats.totals.completedBooks} kitap tamamlandi.`}
        icon={BookOpen}
        label="Tamamlama orani"
        tintClassName="bg-primary text-primary-foreground"
        value={`%${completionRate}`}
      />
      <SnapshotCard
        delayClass="stagger-3"
        helper="Okunmayi bekleyen mevcut raf listesi."
        icon={Clock3}
        label="Bekleyenler"
        tintClassName="bg-secondary text-secondary-foreground"
        value={stats.totals.unreadBooks}
      />
      <SnapshotCard
        delayClass="stagger-4"
        helper={`${stats.totals.favoriteAuthorsCount} yazar favori olarak isaretli.`}
        icon={Waypoints}
        label="Oduncte"
        tintClassName="bg-muted text-text-primary"
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
          className="inline-flex items-center gap-1 text-sm font-semibold tracking-[-0.02em] text-primary transition hover:text-primary/80"
          href="/books"
        >
          Tumunu gor
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
      description="Yakinda okunacaklar listesi. Arsivde bekleyen kayitlara hizli erisim saglar."
      title={`Okuma sirasi (${totalUnread})`}
    >
      {unreadBacklogQuery.isLoading ? (
        <WidgetState isLoading message="Bekleyenler yukleniyor..." />
      ) : unreadBacklogQuery.isError ? (
        <WidgetState
          message={
            unreadBacklogQuery.error instanceof Error
              ? unreadBacklogQuery.error.message
              : "Bekleyenler alinamadi."
          }
        />
      ) : unreadBacklogQuery.data && unreadBacklogQuery.data.items.length > 0 ? (
        <div className="space-y-3">
          {unreadBacklogQuery.data.items.map((book: any) => (
            <Link className="interactive-row group" href={`/books/${book.id}`} key={book.id}>
              <div className="flex min-w-0 items-center gap-4">
                <BookThumb coverUrl={book.coverUrl} title={book.title} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-lg font-semibold tracking-[-0.03em] text-text-primary transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                    {formatAuthors(book.authors)}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                Sirada
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Bekleyen bir kitap kalmadi." />
      )}
    </DashboardSection>
  );
}

export function AiSuggestionsWidget() {
  return (
    <Card className="overflow-hidden border-primary/10 bg-linear-to-r from-accent via-card to-card" surface="raised">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <BrainCircuit className="h-6 w-6" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              AI Workspace
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
              Oneri paneli yeni dashboard ile hizalandi.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              Okuma oncelikleri, eksik ciltler ve bagislanabilecek kitaplar icin AI katmanini ayni sade tasarim diliyle kullanabilirsin.
            </p>
          </div>
        </div>

        <Link
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/92"
          href="/ai-suggestions"
        >
          AI onerilerini ac
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function RecentBooksWidget({ recentBooksQuery }: { recentBooksQuery: any }) {
  return (
    <DashboardSection
      description="Son eklenenler. Arsive yeni giren kayitlari takip etmek icin kullan."
      title="Son kayitlar"
    >
      {recentBooksQuery.isLoading ? (
        <WidgetState isLoading message="Son kayitlar yukleniyor..." />
      ) : recentBooksQuery.isError ? (
        <WidgetState
          message={
            recentBooksQuery.error instanceof Error
              ? recentBooksQuery.error.message
              : "Son kayitlar alinamadi."
          }
        />
      ) : recentBooksQuery.data && recentBooksQuery.data.items.length > 0 ? (
        <div className="space-y-3">
          {recentBooksQuery.data.items.map((book: any) => (
            <Link className="interactive-row group" href={`/books/${book.id}`} key={book.id}>
              <div className="flex min-w-0 items-center gap-4">
                <BookThumb coverUrl={book.coverUrl} title={book.title} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-lg font-semibold tracking-[-0.03em] text-text-primary">
                    {book.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                    {formatAuthors(book.authors)}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                Yeni
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Henuz kaydedilmis kitap yok." />
      )}
    </DashboardSection>
  );
}

export function FavoriteAuthorsWidget({ favoriteAuthorsQuery }: { favoriteAuthorsQuery: any }) {
  return (
    <DashboardSection
      description="Puanlamalarina gore one cikan isimler."
      title="Favori yazarlar"
    >
      {favoriteAuthorsQuery.isLoading ? (
        <WidgetState isLoading message="Favori yazarlar yukleniyor..." />
      ) : favoriteAuthorsQuery.isError ? (
        <WidgetState
          message={
            favoriteAuthorsQuery.error instanceof Error
              ? favoriteAuthorsQuery.error.message
              : "Favori yazarlar alinamadi."
          }
        />
      ) : favoriteAuthorsQuery.data && favoriteAuthorsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {favoriteAuthorsQuery.data.map((author: any) => (
            <div className="panel-muted flex items-center justify-between gap-4" key={author.id}>
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-accent text-accent-foreground">
                  <UserRound className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-[-0.03em] text-text-primary">
                    {author.name}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    {author.ratedBooks} kitap puanlandi
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-card px-3 py-2 text-sm font-semibold tracking-[-0.02em] text-primary">
                {author.averageRating.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <WidgetState message="Henuz puanlanmis kitap bulunmuyor." />
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
      description="Koleksiyonun kategori bazli yogunlugunu gosterir."
      title="Kategori dagilimi"
    >
      {categoryDistributionQuery.isLoading ? (
        <WidgetState isLoading message="Kategori dagilimi yukleniyor..." />
      ) : categoryDistributionQuery.isError ? (
        <WidgetState
          message={
            categoryDistributionQuery.error instanceof Error
              ? categoryDistributionQuery.error.message
              : "Kategori dagilimi alinamadi."
          }
        />
      ) : categoryChartData.length > 0 ? (
        <div className="space-y-6">
          <div className="h-[260px] w-full rounded-[22px] bg-muted/35 p-2">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={categoryChartData} margin={CHART_MARGIN}>
                <CartesianGrid stroke="rgba(221, 214, 201, 0.9)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "rgba(106, 104, 95, 1)", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "rgba(106, 104, 95, 1)", fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(31, 99, 93, 0.08)" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      key={`${entry.name}-${index}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categoryChartData.map((entry, index) => (
              <div className="panel-muted flex items-center justify-between px-4 py-3" key={entry.name}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-text-primary">{entry.name}</span>
                </div>

                <span className="text-sm font-semibold tracking-[-0.02em] text-text-secondary">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <WidgetState message="Kategori verisi henuz olusmadi." />
      )}
    </DashboardSection>
  );
}
