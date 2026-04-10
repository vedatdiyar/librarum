import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveAuthorIdentifier } from "@/server/catalog-service";
import { AuthorDetailPageClient } from "./_components/author-detail-page-client";

export const metadata: Metadata = {
  title: "Yazar Detayı",
};

type AuthorDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AuthorDetailPage({ params }: AuthorDetailPageProps) {
  const { id } = await params;
  const author = await resolveAuthorIdentifier(id);

  if (id !== author.slug) {
    redirect(`/authors/${author.slug}`);
  }

  return <AuthorDetailPageClient authorSlug={author.slug} />;
}
