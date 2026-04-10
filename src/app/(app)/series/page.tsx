import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { SeriesPageClient } from "./_components/series-page-client";

export const metadata: Metadata = {
  title: appPageTitles.series,
};

export default function SeriesPage() {
  return <SeriesPageClient />;
}
