import type { Metadata } from "next";
import { DashboardPageClient } from "./_components/dashboard-page-client";

export const metadata: Metadata = {
  title: {
    absolute: "Librarum"
  }
};

export default function HomePage() {
  return <DashboardPageClient />;
}
