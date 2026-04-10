"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  kicker: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
  action?: React.ReactNode;
  bgImage?: string;
  className?: string;
};

export function PageHero({
  kicker,
  title,
  description,
  aside,
  action,
  bgImage,
  className
}: PageHeroProps) {
  return (
    <div className={cn("relative mb-8 overflow-hidden", className)}>
      <div className="flex flex-col justify-between gap-8 pt-2 pb-1 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 duration-300 animate-in fade-in slide-in-from-left-1">
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">{kicker}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white duration-300 animate-in fade-in slide-in-from-bottom-1 md:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-foreground duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2">
              {description}
            </p>
          </div>

          {action && (
            <div className="flex flex-wrap gap-3 pt-1">
              {action}
            </div>
          )}
        </div>

        {aside && (
          <div className="shrink-0 duration-300 animate-in fade-in slide-in-from-right-2 lg:w-[300px]">
            {aside}
          </div>
        )}
      </div>
      
      <div className="mt-6 h-px w-full bg-white/5" />
    </div>
  );
}
