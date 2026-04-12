import { Skeleton } from "@/components/ui/skeleton";

export default function NewBookLoading() {
  return (
    <section className="space-y-6 pb-24 md:space-y-10">
      {/* Hero Skeleton */}
      <div className="space-y-8 py-10">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Sidebar Skeleton (Right on Desktop, First on Mobile) */}
        <div className="order-first hidden space-y-6 xl:order-last xl:block xl:self-start">
           <Skeleton className="aspect-2/3 w-full rounded-[32px] border border-white/5 bg-white/2" />
           <Skeleton className="h-64 w-full rounded-[28px] border border-white/5 bg-white/2" />
        </div>

        {/* Form Sections Skeleton */}
        <div className="min-w-0 space-y-8">
           {Array.from({ length: 3 }).map((_, i) => (
              <div className="glass-panel overflow-hidden rounded-[32px] border border-white/5 bg-white/1 p-8" key={`form-section-skel-${i}`}>
                 <div className="mb-8 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                       <Skeleton className="h-6 w-48 rounded-lg" />
                       <Skeleton className="h-4 w-80 rounded-full" />
                    </div>
                 </div>
                 <div className="grid gap-6 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                       <div className="space-y-2" key={`field-skel-${i}-${j}`}>
                          <Skeleton className="h-3 w-20 rounded-full" />
                          <Skeleton className="h-12 w-full rounded-xl" />
                       </div>
                    ))}
                 </div>
              </div>
           ))}
           
           {/* Actions Skeleton */}
           <div className="flex justify-end gap-4">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 w-48 rounded-xl" />
           </div>
        </div>
      </div>
    </section>
  );
}
