import { AuthorDetailPageClient } from "@/components/authors/author-detail-page-client";

type AuthorDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AuthorDetailPage({ params }: AuthorDetailPageProps) {
  const { id } = await params;

  return <AuthorDetailPageClient authorId={id} />;
}
