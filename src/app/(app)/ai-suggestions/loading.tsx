import { Skeleton } from "@/components/ui/skeleton";

export default function AiSuggestionsLoading() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-14 w-48 rounded-2xl bg-white/5" />
      </div>

      {/* Stats Preview Skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`ai-stat-skel-${i}`} className="glass-panel flex items-center gap-4 rounded-3xl border-white/5 bg-white/1 p-6">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="space-y-8 rounded-[32px] border border-white/5 bg-white/1 p-8" key={`ai-section-skel-${i}`}>
             <div className="flex justify-between gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-48 rounded-xl" />
                  <Skeleton className="h-4 w-64 rounded-full" />
                </div>
                <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
             </div>
             <div className="space-y-4">
               {Array.from({ length: 2 }).map((_, j) => (
                 <Skeleton className="h-32 w-full rounded-2xl border border-white/5 bg-white/2" key={`ai-item-skel-${i}-${j}`} />
               ))}
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
