import { Skeleton } from "@/components/ui/skeleton";

export default function SeriesDetailLoading() {
  return (
    <div className="space-y-12 pb-24">
      {/* Back Link Skeleton */}
      <Skeleton className="h-4 w-32 rounded-full" />

      {/* Hero Skeleton */}
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-6">
           <Skeleton className="h-16 w-3/4 max-w-xl rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
           {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton className="h-28 rounded-3xl border border-white/5 bg-white/2" key={`series-detail-stat-skeleton-${i}`} />
           ))}
        </div>
      </div>

      <div className="grid gap-12 xl:grid-cols-[1fr_420px]">
        {/* Main Content Skeleton */}
        <Skeleton className="h-[600px] rounded-3xl border border-white/5 bg-white/2" />
        
        {/* Sidebar Skeletons */}
        <div className="space-y-12">
           <Skeleton className="h-[300px] rounded-3xl border border-white/5 bg-white/2" />
           <Skeleton className="h-[400px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}
