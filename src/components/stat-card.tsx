import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, description, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn(
      "glass-panel group relative flex flex-col overflow-hidden rounded-3xl border-white/5 bg-white/1 p-6 transition-all duration-500 hover:bg-white/2 md:p-8",
      className
    )}>
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/3 text-primary ring-1 ring-white/5 transition-transform duration-500 group-hover:scale-110">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-primary/80 uppercase">
              {label}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-serif text-4xl font-bold tracking-tighter text-white md:text-5xl">
            {value}
          </p>
          <p className="text-[10px] font-normal tracking-[0.2em] text-foreground uppercase">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
