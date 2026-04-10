import type { Metadata } from "next";
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

  return <SeriesDetailPageClient seriesId={id} />;
}
