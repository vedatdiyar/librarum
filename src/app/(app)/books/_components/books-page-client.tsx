"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { BooksPageClientContent } from "./books-page-client-content";

type BooksPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function BooksSkeleton() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
          <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-20 w-full animate-pulse rounded-2xl border border-white/5 bg-white/2" />

      {/* View Switcher Skeleton */}
      <div className="flex h-20 items-center justify-between rounded-2xl border border-white/5 bg-white/2 px-6" />

      {/* Table/Grid Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="h-24 w-full animate-pulse rounded-2xl border border-white/5 bg-white/2" key={`row-skeleton-${i}`} />
        ))}
      </div>
    </section>
  );
}

export function BooksPageClient({ searchParams }: BooksPageClientProps) {
  return (
    <React.Suspense
      fallback={<BooksSkeleton />}
    >
      <BooksPageClientContent searchParams={searchParams} />
    </React.Suspense>
  );
}
