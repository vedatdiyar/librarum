import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/server/api";
import { resolveSeriesIdentifier } from "@/server/catalog-service";
import { SeriesDetailPageClient } from "./_components/series-detail-page-client";

export const metadata: Metadata = {
  title: "Seri Detayı",
};

type SeriesDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;

  let series;

  try {
    series = await resolveSeriesIdentifier(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  if (id !== series.slug) {
    redirect(`/series/${series.slug}`);
  }

  return <SeriesDetailPageClient seriesSlug={series.slug} />;
}
