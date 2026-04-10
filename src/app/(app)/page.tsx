import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { DashboardPageClient } from "./_components/dashboard-page-client";

export const metadata: Metadata = {
  title: appPageTitles.home
};

export default function HomePage() {
  return <DashboardPageClient />;
}
