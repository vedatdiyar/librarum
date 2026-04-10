import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveBookIdentifier } from "@/server/books-service";
import { BookDetailPageClient } from "./_components/book-detail-page-client";

export const metadata: Metadata = {
  title: "Eser Detayı",
};

type BookDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const book = await resolveBookIdentifier(id);

  if (id !== book.slug) {
    redirect(`/books/${book.slug}`);
  }

  return <BookDetailPageClient bookSlug={book.slug} />;
}
