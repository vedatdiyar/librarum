import { Skeleton } from "@/components/ui/skeleton";

export default function BooksLoading() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <Skeleton className="h-20 w-full rounded-2xl border border-white/5 bg-white/2" />

      {/* Table/Grid Container Skeleton */}
      <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-white/1">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-white/3 px-8 py-6 md:flex-row md:items-center">
              <div className="space-y-2">
                  <Skeleton className="h-7 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-64 rounded-full" />
              </div>
              <div className="h-12 w-32 rounded-xl bg-white/5" />
          </div>

          <div className="space-y-4 px-4 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton className="h-24 w-full rounded-2xl" key={`book-row-skeleton-${i}`} />
            ))}
          </div>
      </div>
    </section>
  );
}
