import type { Metadata } from "next";
import { appPageTitles } from "@/lib/navigation";
import { BooksPageClient } from "./_components/books-page-client";

export const metadata: Metadata = {
  title: appPageTitles.books,
};

type BooksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  return <BooksPageClient searchParams={resolvedSearchParams} />;
}
