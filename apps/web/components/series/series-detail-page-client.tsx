"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookMarked, CircleDashed } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exlibris/ui";
import type { SeriesDetail } from "@exlibris/types";
import { readJsonResponse } from "@exlibris/lib";
import { PageHero } from "@/components/page-hero";

async function fetchSeriesDetail(seriesId: string) {
  return readJsonResponse<SeriesDetail>(await fetch(`/api/series/${seriesId}`));
}

function BookThumb({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative h-20 w-14 overflow-hidden rounded-[8px] border border-border bg-surface-raised">
        <Image alt={`${title} kapagi`} className="object-cover" fill sizes="56px" src={coverUrl} />
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

export function SeriesDetailPageClient({ seriesId }: { seriesId: string }) {
  const detailQuery = useQuery({
    queryKey: ["series-detail", seriesId],
    queryFn: () => fetchSeriesDetail(seriesId)
  });

  if (detailQuery.isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-surface-raised" />
        <Card>
          <CardContent className="h-[240px] animate-pulse p-8">
            <div className="h-full rounded-[24px] bg-surface-raised" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="space-y-6">
        <Button asChild size="sm" variant="ghost">
          <Link href="/series">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Serilere don
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Seri detayi yuklenemedi</CardTitle>
            <CardDescription>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Seri verileri alinamadi."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const detail = detailQuery.data;

  return (
    <section className="page-stack">
      <Button asChild size="sm" variant="ghost">
        <Link href="/series">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Serilere don
        </Link>
      </Button>

      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Ozet</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <dt className="text-text-secondary">Toplam cilt</dt>
                <dd className="font-display text-2xl text-text-primary">{detail.totalVolumes ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
                <dt className="text-text-secondary">Sahip olunan</dt>
                <dd className="font-display text-2xl text-text-primary">{detail.ownedVolumes.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Tamamlanma</dt>
                <dd className="font-display text-2xl text-text-primary">
                  {detail.completionPercentage == null ? "Bilinmiyor" : `%${detail.completionPercentage}`}
                </dd>
              </div>
            </dl>
          </div>
        }
        description="Seri icindeki sahip olunan ciltleri, eksik numaralari ve tamamlama seviyesini bu ekranda takip edebilirsin."
        kicker="Series Detail"
        title={detail.name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Sahip olunan ciltler</CardTitle>
            <CardDescription>Numarali olanlar once, numarasizlar sonda listelenir.</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.ownedVolumes.length === 0 ? (
              <div className="empty-panel">
                <p className="text-sm leading-7 text-text-secondary">Bu seride kitap bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detail.ownedVolumes.map((volume) => (
                  <Link
                    className="interactive-row flex items-center gap-4 p-3"
                    href={`/books/${volume.bookId}`}
                    key={volume.bookId}
                  >
                    <BookThumb coverUrl={volume.coverUrl} title={volume.title} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="line-clamp-2 font-display text-xl text-text-primary">
                          {volume.title}
                        </p>
                        <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
                          {volume.seriesOrder ? `Cilt ${volume.seriesOrder}` : "No bilinmiyor"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{volume.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Eksik ciltler</CardTitle>
              <CardDescription>Yalniz toplam cilt sayisi tanimli serilerde hesaplanir.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.totalVolumes == null ? (
                <div className="empty-panel min-h-[180px]">
                  <p className="text-sm leading-7 text-text-secondary">
                    Bu seri icin toplam cilt sayisi tanimli degil.
                  </p>
                </div>
              ) : detail.missingVolumes.length === 0 ? (
                <div className="empty-panel min-h-[180px]">
                  <p className="text-sm leading-7 text-text-secondary">
                    Bilinen cilt numaralarina gore eksik cilt gorunmuyor.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.missingVolumes.map((volume) => (
                    <div
                      className="rounded-full border border-border bg-surface-raised px-4 py-2 text-sm text-text-primary"
                      key={volume}
                    >
                      Cilt {volume}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Tamamlanma</CardTitle>
              <CardDescription>Bilinen cilt numaralarina gore hesaplanir.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="panel-muted p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-[18px] border border-accent/25 bg-accent/10 p-3 text-accent">
                        <BookMarked className="h-4 w-4" />
                      </span>
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-text-secondary">
                        Tamamlanma orani
                      </p>
                      <p className="font-display text-3xl text-text-primary">
                        {detail.completionPercentage == null ? "Bilinmiyor" : `%${detail.completionPercentage}`}
                      </p>
                    </div>
                  </div>
                  {detail.totalVolumes != null ? (
                    <CircleDashed className="h-5 w-5 text-accent" />
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
