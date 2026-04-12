import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorDetailLoading() {
  return (
    <div className="space-y-12 pb-24">
      {/* Top Nav Skeleton */}
      <Skeleton className="h-4 w-32 rounded-full" />

      {/* Hero Skeleton */}
      <div className="space-y-12 py-10">
        <div className="flex items-center gap-6">
           <Skeleton className="h-16 w-3/4 max-w-xl rounded-2xl" />
           <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
           {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton className="h-28 rounded-3xl border border-white/5 bg-white/2" key={`author-stat-skeleton-${i}`} />
           ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
           <Skeleton className="h-[600px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
        <div className="space-y-8 lg:col-span-4">
           <Skeleton className="h-[400px] rounded-3xl border border-white/5 bg-white/2" />
           <Skeleton className="h-[300px] rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}
