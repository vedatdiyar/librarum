import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { LoansPageClient } from "./_components/loans-page-client";

export const metadata: Metadata = {
  title: appPageTitles.loans,
};

export default function LoansPage() {
  return <LoansPageClient />;
}
