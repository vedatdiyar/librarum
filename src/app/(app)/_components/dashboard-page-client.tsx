"use client";

import Link from "next/link";
import { ArrowRight, Waypoints } from "lucide-react";
import { Button } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { appPageTitles } from "@/lib/navigation";
import { useDashboardData } from "../_hooks/use-dashboard-data";
import {
  BacklogWidget,
  CategoryDistributionWidget,
  FavoriteAuthorsWidget,
  RecentBooksWidget,
  SummaryStats
} from "./widgets";

function DashboardSkeleton() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8 py-10">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="flex gap-4">
            <div className="h-14 w-40 animate-pulse rounded-xl bg-white/5" />
            <div className="h-14 w-40 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="h-full min-h-[300px] animate-pulse rounded-3xl border border-white/5 bg-white/2 p-6" />
        </div>
      </div>

      {/* Summary Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/2" key={`stat-skeleton-${index}`} />
        ))}
      </div>

      {/* Widgets Grid Skeleton */}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-10">
          <div className="h-[400px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
          <div className="h-[500px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-10">
          <div className="h-[350px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
          <div className="h-[450px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </section>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center duration-1000 animate-in fade-in zoom-in-95">
      <div className="relative mb-10">
        <div className="relative rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-2xl">
            <Waypoints className="h-10 w-10 rotate-45" />
        </div>
      </div>
      <h2 className="mb-4 font-serif text-4xl font-bold tracking-tight text-foreground">Kütüphaneye ulaşılamadı.</h2>
      <p className="max-w-md leading-relaxed text-foreground italic">{message}</p>
      <Button 
        className="mt-10 rounded-xl bg-white text-black shadow-2xl transition-all duration-500 hover:bg-primary hover:text-primary-foreground" 
        onClick={() => window.location.reload()}
      >
        Yeniden Eşitle
      </Button>
    </section>
  );
}

function EmptyCollectionState() {
  return (
    <section className="duration-1000 animate-in fade-in">
      <PageHero
        action={
          <Button asChild size="lg" className="rounded-xl bg-white px-8 py-6 text-base text-black shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground">
            <Link href="/books/new">
              İlk Kitabı Ekle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
        description="Henüz kayıtlı kitap bulunmuyor. İlk kitabınızı ekleyerek ana sayfadaki özetleri, okuma sırasını ve öneri kartlarını doldurmaya başlayabilirsiniz."
        kicker="Koleksiyon"
        title={appPageTitles.home}
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
            : "Veri eşitleme hatası."
        }
      />
    );
  }

  const stats = statsQuery.data;

  if (!stats) {
    return <DashboardError message="Veri eşitleme hatası." />;
  }

  if (stats.totals.totalBooks === 0) {
    return <EmptyCollectionState />;
  }

  const categoryChartData =
    categoryDistributionQuery.data?.filter((item) => item.count > 0) ?? [];

  return (
    <section className="space-y-8 pb-24">
      <PageHero
        action={
          <>
            <Button asChild size="lg" className="h-13 rounded-2xl bg-white px-7 text-black transition-all hover:bg-primary hover:text-white">
              <Link href="/books/new">Yeni Kitap Ekle</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-13 rounded-2xl border-white/10 bg-white/5 px-7 transition-all hover:bg-white/10">
              <Link href="/books">Kitaplara Git</Link>
            </Button>
          </>
        }
        description={`Koleksiyonunuz, okuma listeniz ve tüm aktiviteleriniz tek bir ekranda.`}
        kicker="Genel Bakış"
        title={appPageTitles.home}
      />

      <div className="delay-100 duration-300 animate-in fade-in slide-in-from-bottom-4">
        <SummaryStats stats={stats} />
      </div>

      <div className="grid gap-6 lg:auto-rows-[minmax(320px,auto)] lg:grid-cols-12">
        <div className="min-w-0 delay-200 duration-300 animate-in fade-in slide-in-from-bottom-4 lg:col-span-6">
          <BacklogWidget totalUnread={stats.totals.unreadBooks} unreadBacklogQuery={unreadBacklogQuery} />
        </div>
        <div className="min-w-0 delay-250 duration-300 animate-in fade-in slide-in-from-bottom-4 lg:col-span-6">
          <RecentBooksWidget recentBooksQuery={recentBooksQuery} />
        </div>
        <div className="min-w-0 delay-300 duration-300 animate-in fade-in slide-in-from-bottom-4 lg:col-span-6">
          <CategoryDistributionWidget
            categoryChartData={categoryChartData}
            categoryDistributionQuery={categoryDistributionQuery}
          />
        </div>
        <div className="min-w-0 delay-350 duration-300 animate-in fade-in slide-in-from-bottom-4 lg:col-span-6">
          <FavoriteAuthorsWidget favoriteAuthorsQuery={favoriteAuthorsQuery} />
        </div>
      </div>
    </section>
  );
}
