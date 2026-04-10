import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { AuthorsPageClient } from "./_components/authors-page-client";

export const metadata: Metadata = {
  title: appPageTitles.authors,
};

export default function AuthorsPage() {
  return <AuthorsPageClient />;
}
