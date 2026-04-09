import { BookDetailPageClient } from "./_components/book-detail-page-client";

type BookDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  return <BookDetailPageClient bookId={id} />;
}
