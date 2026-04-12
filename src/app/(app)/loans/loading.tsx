import { Skeleton } from "@/components/ui/skeleton";

export default function LoansLoading() {
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

      {/* Table Container Skeleton */}
      <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-white/2 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-white/3 bg-white/3 px-8 py-6 md:flex-row md:items-center">
              <div>
                 <Skeleton className="h-7 w-48 rounded-lg" />
                 <Skeleton className="mt-2 h-4 w-64 rounded-full" />
              </div>
              <div className="flex items-center gap-6">
                 <div className="hidden h-10 w-px bg-white/5 md:block" />
                 <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-8 w-12 rounded-lg" />
                       <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded-full" />
                 </div>
              </div>
          </div>

          <div className="space-y-4 px-4 py-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="flex h-20 items-center gap-4 rounded-xl border border-white/2 bg-white/2 px-4 shadow-sm" key={`loan-skeleton-row-${i}`}>
                   <Skeleton className="h-16 w-12 shrink-0 rounded-xl" />
                   <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/2 rounded-lg" />
                      <Skeleton className="h-3 w-1/4 rounded-full" />
                   </div>
                   <div className="flex items-center gap-8">
                       <Skeleton className="hidden h-6 w-32 rounded-xl sm:block" />
                       <Skeleton className="hidden h-6 w-32 rounded-xl md:block" />
                       <Skeleton className="h-9 w-24 rounded-xl" />
                   </div>
                </div>
              ))}
          </div>
      </div>
    </section>
  );
}
