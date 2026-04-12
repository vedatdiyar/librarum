import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <section className="space-y-10 pb-20">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-20 w-fit rounded-2xl" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Tabs Skeleton */}
        <div className="no-scrollbar overflow-x-auto pb-1">
          <div className="flex h-10 w-fit gap-1 rounded-xl border border-white/5 bg-white/3 p-1 backdrop-blur-xl">
             {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-full w-32 rounded-lg" key={`tab-skel-${i}`} />
             ))}
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/1 p-6 shadow-2xl md:p-8">
           <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-80 rounded-full" />
                 </div>
                 <Skeleton className="h-12 w-32 rounded-xl" />
              </div>

              <div className="space-y-4">
                 {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton className="h-24 w-full rounded-3xl" key={`settings-row-skel-${i}`} />
                 ))}
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
