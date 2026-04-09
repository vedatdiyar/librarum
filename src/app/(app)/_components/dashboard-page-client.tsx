"use client";

import Link from "next/link";
import { ArrowRight, Waypoints } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { useDashboardData } from "../_hooks/use-dashboard-data";
import {
  AiSuggestionsWidget,
  BacklogWidget,
  CategoryDistributionWidget,
  FavoriteAuthorsWidget,
  RecentBooksWidget,
  SummaryStats
} from "./widgets";

function DashboardSkeleton() {
  return (
    <section className="page-stack pb-12">
      <Card className="h-[320px] animate-pulse" surface="raised" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card className="h-[168px] animate-pulse" key={`stat-skeleton-${index}`} surface="raised" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <Card className="h-[360px] animate-pulse" surface="raised" />
          <Card className="h-[360px] animate-pulse" surface="raised" />
        </div>
        <div className="space-y-6">
          <Card className="h-[320px] animate-pulse" surface="raised" />
          <Card className="h-[360px] animate-pulse" surface="raised" />
        </div>
      </div>

      <Card className="h-[180px] animate-pulse" surface="raised" />
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="mb-8 rounded-full bg-destructive/10 p-6 text-destructive ring-8 ring-destructive/5">
        <Waypoints className="h-10 w-10 rotate-45" />
      </div>
      <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text-primary">Veriler yuklenemedi</h2>
      <p className="mt-4 max-w-md text-text-secondary">{message}</p>
      <Button className="mt-8" onClick={() => window.location.reload()} variant="secondary">
        Yeniden dene
      </Button>
    </section>
  );
}

function EmptyCollectionState() {
  return (
    <section className="page-stack">
      <PageHero
        action={
          <Button asChild size="lg">
            <Link href="/books/new">
              Ilk kitabi ekle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
        aside={
          <div className="glass-elevated rounded-[28px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              Hazirlik
            </p>
            <p className="mt-4 text-base font-semibold tracking-[-0.03em] text-text-primary">
              Ilk kayittan sonra dashboard dolmaya baslayacak.
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Son eklenenler, favori yazarlar ve kategori dagilimi otomatik olarak burada gorunecek.
            </p>
          </div>
        }
        description="Koleksiyonunu kurmaya baslamak icin ilk kitabi ekle. Modern dashboard yapisi, arsiv buyudukce kendi ritmini gosterecek."
        kicker="Bos Koleksiyon"
        title="Kutuphane hazir, raflar seni bekliyor."
      />
    </section>
  );
}

export function DashboardPageClient() {
  const {
    statsQuery,
    unreadBacklogQuery,
    recentBooksQuery,
    favoriteAuthorsQuery,
    categoryDistributionQuery
  } = useDashboardData();

  if (statsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsQuery.isError) {
    return (
      <DashboardError
        message={
          statsQuery.error instanceof Error
            ? statsQuery.error.message
            : "Genel bakis verileri alinamadi."
        }
      />
    );
  }

  const stats = statsQuery.data;

  if (!stats) {
    return <DashboardError message="Genel bakis verileri alinamadi." />;
  }

  if (stats.totals.totalBooks === 0) {
    return <EmptyCollectionState />;
  }

  const completionRate =
    stats.totals.totalBooks > 0
      ? Math.round((stats.totals.completedBooks / stats.totals.totalBooks) * 100)
      : 0;

  const categoryChartData =
    categoryDistributionQuery.data?.filter((item) => item.count > 0) ?? [];

  return (
    <section className="page-stack pb-12">
      <PageHero
        action={
          <>
            <Button asChild size="lg">
              <Link href="/books/new">Yeni kitap ekle</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/books">Kutuphane gorunumu</Link>
            </Button>
          </>
        }
        aside={
          <div className="glass-elevated flex h-full flex-col rounded-[28px] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
              Bugunun Ozeti
            </p>

            <div className="mt-5 grid gap-3">
              <div className="page-metric">
                <p className="page-metric-label">Toplam nusha</p>
                <p className="page-metric-value">{stats.totals.totalCopies}</p>
              </div>

              <div className="page-metric">
                <p className="page-metric-label">Tamamlama orani</p>
                <p className="page-metric-value">%{completionRate}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] bg-muted/65 p-4">
              <p className="text-sm font-semibold tracking-[-0.02em] text-text-primary">
                {stats.totals.unreadBooks} kitap hala sirada, {stats.totals.loanedBooks} kitap ise oduncte.
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Dashboard artik okuma temposunu, arastirma alanlarini ve operasyon durumunu tek yerde tutuyor.
              </p>
            </div>
          </div>
        }
        description="Koleksiyonun durumu, bekleyen okumalar ve arsivindeki ana egilimler tek bir sakin dashboard akisinda toplandi."
        kicker="Overview"
        title="Kutuphanenin tamami tek bakista."
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SummaryStats stats={stats} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <BacklogWidget totalUnread={stats.totals.unreadBooks} unreadBacklogQuery={unreadBacklogQuery} />
          <RecentBooksWidget recentBooksQuery={recentBooksQuery} />
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <FavoriteAuthorsWidget favoriteAuthorsQuery={favoriteAuthorsQuery} />
          <CategoryDistributionWidget
            categoryChartData={categoryChartData}
            categoryDistributionQuery={categoryDistributionQuery}
          />
        </div>
      </div>

      <AiSuggestionsWidget />
    </section>
  );
}
