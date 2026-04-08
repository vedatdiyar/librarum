"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
import {
  BookCopy,
  BookOpen,
  BrainCircuit,
  Clock3,
  LoaderCircle,
  UserRound,
  Waypoints
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn
} from "@exlibris/ui";
import type {
  BookListResponse,
  CategoryDistributionPoint,
  FavoriteAuthor,
  StatsSnapshot
} from "@exlibris/types";

const CHART_COLORS = [
  "#7ea596",
  "#5f8074",
  "#8ea49c",
  "#6a7771",
  "#4d635c",
  "#a4bbb1"
];

export function WidgetState({
  message,
  isLoading
}: {
  message: string;
  isLoading?: boolean;
}) {
  return (
    <div className="empty-panel min-h-[160px]">
      <p className="flex items-center gap-2 text-sm leading-6 text-text-secondary">
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {message}
      </p>
    </div>
  );
}

export function SnapshotCard({
  label,
  value,
  icon: Icon,
  toneClassName
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  toneClassName: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">{label}</p>
          <p className="font-display text-4xl text-text-primary">{value}</p>
        </div>
        <div className={cn("rounded-[18px] border p-3", toneClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BookThumb({
  title,
  coverUrl
}: {
  title: string;
  coverUrl: string | null;
}) {
  if (coverUrl) {
    return (
      <div className="relative h-20 w-14 overflow-hidden rounded-[8px] border border-border bg-surface-raised">
        <Image
          alt={`${title} kapagi`}
          className="object-cover"
          fill
          sizes="56px"
          src={coverUrl}
        />
      </div>
    );
  }

  return (
    <div className="book-placeholder h-20 w-14 rounded-[8px] p-2">
      <span className="line-clamp-3 font-display text-[10px] leading-4 text-text-primary">
        {title}
      </span>
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
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SummaryStats({ stats }: { stats: StatsSnapshot }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SnapshotCard
        icon={BookCopy}
        label="Toplam kitap"
        toneClassName="border-accent/30 bg-accent/12 text-accent"
        value={stats.totals.totalBooks}
      />
      <SnapshotCard
        icon={BookOpen}
        label="Okunan"
        toneClassName="border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        value={stats.totals.completedBooks}
      />
      <SnapshotCard
        icon={Clock3}
        label="Bekleyen"
        toneClassName="border-sky-400/30 bg-sky-400/10 text-sky-200"
        value={stats.totals.unreadBooks}
      />
      <SnapshotCard
        icon={Waypoints}
        label="Ödünç verilen"
        toneClassName="border-violet-400/30 bg-violet-400/10 text-violet-200"
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
          className="text-sm text-text-secondary transition hover:text-text-primary"
          href="/books"
        >
          Tümünü gör
        </Link>
      }
      description="Sahip olduğun ama henüz okunmamış kitaplardan son 5 kayıt."
      title={`Bekleyenler (${totalUnread})`}
    >
      {unreadBacklogQuery.isLoading ? (
        <WidgetState isLoading message="Bekleyenler yükleniyor..." />
      ) : unreadBacklogQuery.isError ? (
        <WidgetState
          message={
            unreadBacklogQuery.error instanceof Error
              ? unreadBacklogQuery.error.message
              : "Bekleyenler alınamadı."
          }
        />
      ) : unreadBacklogQuery.data && unreadBacklogQuery.data.items.length > 0 ? (
        <div className="space-y-3">
          {unreadBacklogQuery.data.items.map((book: any) => (
            <Link
              className="interactive-row flex items-center gap-4 p-3"
              href={`/books/${book.id}`}
              key={book.id}
            >
              <BookThumb coverUrl={book.coverUrl} title={book.title} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-display text-xl text-text-primary">
                  {book.title}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                  {book.authors.map((author: any) => author.name).join(", ") || "Yazar belirtilmedi"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Henüz bekleyen kitap yok." />
      )}
    </DashboardSection>
  );
}

export function AiSuggestionsWidget() {
  return (
    <DashboardSection
      action={
        <span className="rounded-full border border-border/80 bg-surface-raised px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Yakında
        </span>
      }
      description="Aylık AI okuma önerileri sonraki adımda bu alana bağlanacak."
      title="Yapay Zeka Önerileri"
    >
      <div className="panel-muted p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-[18px] border border-accent/25 bg-accent/10 p-3 text-accent">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <p className="font-display text-2xl text-text-primary">
              Bu ayki öneriler yükleniyor...
            </p>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary">
              Okuma ritmin, favori yazarların ve bekleyenler desenin bir sonraki adımda
              burada anlamlı bir listeye dönecek.
            </p>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}

export function RecentBooksWidget({ recentBooksQuery }: { recentBooksQuery: any }) {
  return (
    <DashboardSection
      description="Koleksiyona en son eklenen 5 kitap."
      title="Son Eklenenler"
    >
      {recentBooksQuery.isLoading ? (
        <WidgetState isLoading message="Son eklenenler yükleniyor..." />
      ) : recentBooksQuery.isError ? (
        <WidgetState
          message={
            recentBooksQuery.error instanceof Error
              ? recentBooksQuery.error.message
              : "Son eklenenler alınamadı."
          }
        />
      ) : recentBooksQuery.data && recentBooksQuery.data.items.length > 0 ? (
        <div className="space-y-3">
          {recentBooksQuery.data.items.map((book: any) => (
            <Link
              className="interactive-row flex items-center gap-4 p-3"
              href={`/books/${book.id}`}
              key={book.id}
            >
              <BookThumb coverUrl={book.coverUrl} title={book.title} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-display text-xl text-text-primary">
                  {book.title}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                  {book.authors.map((author: any) => author.name).join(", ") || "Yazar belirtilmedi"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <WidgetState message="Henüz kaydedilmiş kitap yok." />
      )}
    </DashboardSection>
  );
}

export function FavoriteAuthorsWidget({ favoriteAuthorsQuery }: { favoriteAuthorsQuery: any }) {
  return (
    <DashboardSection
      description="En yüksek ortalama puana sahip yazarlar."
      title="Favori Yazarlar"
    >
      {favoriteAuthorsQuery.isLoading ? (
        <WidgetState isLoading message="Favori yazarlar yükleniyor..." />
      ) : favoriteAuthorsQuery.isError ? (
        <WidgetState
          message={
            favoriteAuthorsQuery.error instanceof Error
              ? favoriteAuthorsQuery.error.message
              : "Favori yazarlar alınamadı."
          }
        />
      ) : favoriteAuthorsQuery.data && favoriteAuthorsQuery.data.length > 0 ? (
        <div className="space-y-3">
          {favoriteAuthorsQuery.data.map((author: any) => (
            <div
              className="panel-muted flex items-center justify-between gap-4 p-4"
              key={author.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-[18px] border border-accent/25 bg-accent/10 p-3 text-accent">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl text-text-primary">
                    {author.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {author.ratedBooks} kitap üzerinden
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-text-primary">
                  {author.averageRating.toFixed(2)}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                  ortalama
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <WidgetState message="Henüz puanlanmış kitap bulunmuyor." />
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
      description="Kategorilere göre kitap dağılımı."
      title="Kategori Dağılımı"
    >
      {categoryDistributionQuery.isLoading ? (
        <WidgetState isLoading message="Kategori dağılımı yükleniyor..." />
      ) : categoryDistributionQuery.isError ? (
        <WidgetState
          message={
            categoryDistributionQuery.error instanceof Error
              ? categoryDistributionQuery.error.message
              : "Kategori dağılımı alınamadı."
          }
        />
      ) : categoryChartData.length > 0 ? (
        <div className="space-y-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 12, right: 8, left: -20, bottom: 12 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "rgba(150,159,154,1)", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "rgba(150,159,154,1)", fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid rgba(44,52,52,1)",
                    borderRadius: "18px",
                    background: "rgba(18,22,23,0.96)",
                    color: "rgba(235,239,236,1)"
                  }}
                  cursor={{ fill: "rgba(126,165,150,0.08)" }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
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

          <div className="grid gap-2 sm:grid-cols-2">
            {categoryChartData.map((entry, index) => (
              <div
                className="panel-muted flex items-center justify-between px-4 py-3"
                key={entry.name}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-text-primary">{entry.name}</span>
                </div>
                <span className="text-sm text-text-secondary">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <WidgetState message="Kategori verisi henüz oluşmadı." />
      )}
    </DashboardSection>
  );
}
