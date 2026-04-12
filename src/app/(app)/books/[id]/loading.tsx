import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailLoading() {
  return (
    <div className="space-y-8 pb-24">
      {/* Back Link Skeleton */}
      <Skeleton className="mb-4 h-4 w-32 rounded-full" />

      <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
        {/* Cover Skeleton */}
        <div className="space-y-10">
          <Skeleton className="aspect-2/3 w-full max-w-[320px] rounded-2xl border border-white/5 bg-white/2 shadow-2xl lg:max-w-none" />
          <Skeleton className="h-24 w-full rounded-2xl border border-white/5 bg-white/2" />
        </div>

        {/* Identity & Meta Skeleton */}
        <div className="space-y-12">
          <div className="space-y-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-3/4 rounded-2xl" />
              <Skeleton className="h-8 w-1/2 rounded-xl" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" key={`meta-skeleton-placeholder-${i}`} />
             ))}
          </div>

          <Skeleton className="h-[400px] w-full rounded-3xl border border-white/5 bg-white/2" />
        </div>
      </div>
    </div>
  );
}
