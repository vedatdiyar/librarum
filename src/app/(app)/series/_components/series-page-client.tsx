"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LibraryBig } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import type { SeriesListItem } from "@/types";
import { readJsonResponse } from "@/lib/shared";
import { PageHero } from "@/components/page-hero";

async function fetchSeries() {
  return readJsonResponse<SeriesListItem[]>(await fetch("/api/series"));
}

export function SeriesPageClient() {
  const seriesQuery = useQuery({
    queryKey: ["series"],
    queryFn: fetchSeries
  });

  if (seriesQuery.isLoading) {
    return (
      <section className="page-stack">
        <div className="page-hero rounded-[24px] p-8">
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface-raised" />
          <div className="mt-6 h-14 w-72 animate-pulse rounded-2xl bg-surface-raised" />
        </div>
      </section>
    );
  }

  if (seriesQuery.isError) {
    return (
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seriler yüklenemedi</CardTitle>
            <CardDescription>
              {seriesQuery.error instanceof Error
                ? seriesQuery.error.message
                : "Seri listesi alınamadı."}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const series = seriesQuery.data ?? [];

  return (
    <section className="page-stack">
      <PageHero
        aside={
          <div className="page-metric">
            <p className="page-metric-label">Toplam seri</p>
            <p className="page-metric-value">{series.length}</p>
          </div>
        }
        description="Tüm seriler alfabetik olarak listelenir; toplam cilt, sahip olunan cilt ve varsa tamamlanma oranları tek bakışta görülür."
        kicker="Seriler"
        title="Koleksiyondaki seriler"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Tüm seriler</CardTitle>
          <CardDescription>Alfabetik sıra ile listelenir.</CardDescription>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <div className="empty-panel">
              <p className="text-sm leading-7 text-text-secondary">
                Henüz seri kaydı oluşmadı.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seri</TableHead>
                  <TableHead className="w-40">Toplam cilt</TableHead>
                  <TableHead className="w-40">Sahip olunan</TableHead>
                  <TableHead className="w-40">Tamamlanma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link className="group inline-flex items-center gap-3" href={`/series/${item.id}`}>
                        <span className="rounded-[18px] border border-accent/25 bg-accent/10 p-3 text-accent">
                          <LibraryBig className="h-4 w-4" />
                        </span>
                        <span className="flex items-center gap-2 font-display text-2xl text-text-primary transition group-hover:text-text-secondary">
                          {item.name}
                          <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{item.totalVolumes ?? "—"}</TableCell>
                    <TableCell>{item.ownedCount}</TableCell>
                    <TableCell>
                      {item.completionPercentage == null ? "Bilinmiyor" : `%${item.completionPercentage}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
