import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8 py-10">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/5" />
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="flex gap-4">
            <div className="h-14 w-40 animate-pulse rounded-xl bg-white/5" />
            <div className="h-14 w-40 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="h-full min-h-[300px] animate-pulse rounded-3xl border border-white/5 bg-white/2 p-6" />
        </div>
      </div>

      {/* Summary Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-32 rounded-2xl border border-white/5 bg-white/2" key={`stat-skeleton-${index}`} />
        ))}
      </div>

      {/* Widgets Grid Skeleton */}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-10">
          <Skeleton className="h-[400px] rounded-3xl border border-white/5 bg-white/2" />
          <Skeleton className="h-[500px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-10">
          <Skeleton className="h-[350px] rounded-3xl border border-white/5 bg-white/2" />
          <Skeleton className="h-[450px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </section>
  );
}
