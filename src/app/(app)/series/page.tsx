import type { Metadata } from "next";
import { Suspense } from "react";
import { appPageTitles } from "@/lib/navigation";
import { SeriesPageClient, SeriesSkeleton } from "./_components/series-page-client";

export const metadata: Metadata = {
  title: appPageTitles.series,
};

type SeriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  return (
    <Suspense fallback={<SeriesSkeleton />}>
      <SeriesPageClient searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
