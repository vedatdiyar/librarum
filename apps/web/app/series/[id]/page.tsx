import { SeriesDetailPageClient } from "@/components/series/series-detail-page-client";

type SeriesDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;

  return <SeriesDetailPageClient seriesId={id} />;
}
