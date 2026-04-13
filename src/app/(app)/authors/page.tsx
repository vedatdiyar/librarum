import type { Metadata } from "next";
import { Suspense } from "react";
import { appPageTitles } from "@/lib/navigation";
import { AuthorsPageClient, AuthorsSkeleton } from "./_components/authors-page-client";

export const metadata: Metadata = {
  title: appPageTitles.authors,
};

type AuthorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  return (
    <Suspense fallback={<AuthorsSkeleton />}>
      <AuthorsPageClient searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
