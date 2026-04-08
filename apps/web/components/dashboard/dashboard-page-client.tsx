"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@exlibris/ui";
import { PageHero } from "@/components/page-hero";
import { useDashboardData } from "./use-dashboard-data";
import {
  SummaryStats,
  BacklogWidget,
  AiSuggestionsWidget,
  RecentBooksWidget,
  FavoriteAuthorsWidget,
  CategoryDistributionWidget
} from "./widgets";

function DashboardSkeleton() {
  return (
    <section className="page-stack">
      <div className="page-hero rounded-[24px] p-8">
        <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
        <div className="mt-6 h-14 w-72 animate-pulse rounded-2xl bg-surface-raised" />
        <div className="mt-4 h-6 w-[32rem] max-w-full animate-pulse rounded-xl bg-surface-raised" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <div className="space-y-4 p-6">
              <div className="h-5 w-24 animate-pulse rounded-full bg-surface-raised" />
              <div className="h-10 w-20 animate-pulse rounded-2xl bg-surface-raised" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card>
          <div className="h-[420px] animate-pulse p-6">
            <div className="h-full rounded-[24px] bg-surface-raised" />
          </div>
        </Card>
        <Card>
          <div className="h-[420px] animate-pulse p-6">
            <div className="h-full rounded-[24px] bg-surface-raised" />
          </div>
        </Card>
      </div>
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel Bakış yüklenemedi</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
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
              İlk kitabını ekle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Sessiz kataloglama</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Kapaklar, seriler, favori yazarlar ve AI önerileri ilk kayıtlardan sonra
              otomatik olarak şekillenmeye başlayacak.
            </p>
          </div>
        }
        description="ExLibris ilk kitabını bekliyor. Koleksiyon oluşmaya başladığında bekleyenler, özet, favori yazarlar ve kategori dağılımı burada canlanacak."
        kicker="Genel Bakış"
        title="Kütüphaneniz boş"
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
            : "Genel Bakış verileri alınamadı."
        }
      />
    );
  }

  const stats = statsQuery.data;

  if (!stats) {
    return <DashboardError message="Genel Bakış verileri alınamadı." />;
  }

  if (stats.totals.totalBooks === 0) {
    return <EmptyCollectionState />;
  }

  const categoryChartData =
    categoryDistributionQuery.data?.filter((item) => item.count > 0) ?? [];

  return (
    <section className="page-stack">
      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Kısa özet</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <dt className="text-text-secondary">Toplam kitap</dt>
                <dd className="font-display text-2xl text-text-primary">
                  {stats.totals.totalBooks}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <dt className="text-text-secondary">Toplam kopya</dt>
                <dd className="font-display text-2xl text-text-primary">
                  {stats.totals.totalCopies}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Favori yazar sayısı</dt>
                <dd className="font-display text-2xl text-text-primary">
                  {stats.totals.favoriteAuthorsCount}
                </dd>
              </div>
            </dl>
          </div>
        }
        description="Bekleyenler, son eklenenler, favori yazarlar ve kategori dağılımı tek bakışta burada. Genel Bakış koleksiyonun bugünkü ritmini sakin ve net bir yüzeyde topluyor."
        kicker="Genel Bakış"
        title="Koleksiyonun bugün nasıl görünüyor"
      />

      <SummaryStats stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          <BacklogWidget
            totalUnread={stats.totals.unreadBooks}
            unreadBacklogQuery={unreadBacklogQuery}
          />
          <AiSuggestionsWidget />
        </div>

        <div className="space-y-6">
          <RecentBooksWidget recentBooksQuery={recentBooksQuery} />
          <FavoriteAuthorsWidget favoriteAuthorsQuery={favoriteAuthorsQuery} />
          <CategoryDistributionWidget
            categoryChartData={categoryChartData}
            categoryDistributionQuery={categoryDistributionQuery}
          />
        </div>
      </div>
    </section>
  );
}
