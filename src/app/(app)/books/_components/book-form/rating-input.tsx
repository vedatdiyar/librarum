"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/components/ui";

export function RatingInput({
  value,
  onChange
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);
  const activeValue = hoveredValue ?? value ?? 0;

  return (
    <div className="space-y-4">
      <div
        aria-label="Puan seçin"
        className="flex flex-wrap gap-2"
        onMouseLeave={() => setHoveredValue(null)}
        role="group"
      >
        {Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((starValue) => {
          const isSelected = value === starValue;
          const isHighlighted = activeValue >= starValue;
          
          return (
            <button
              key={starValue}
              className={cn(
                "group relative flex h-10 w-16 items-center justify-center rounded-xl border transition-all duration-200",
                isSelected
                  ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_-5px_var(--primary)]"
                  : isHighlighted
                    ? "border-primary/30 bg-primary/5 text-primary/80"
                    : "border-border/60 bg-surface/40 text-text-secondary hover:border-border hover:bg-surface/80 hover:text-text-primary"
              )}
              onClick={() => onChange(isSelected ? null : starValue)}
              onMouseEnter={() => setHoveredValue(starValue)}
              type="button"
            >
              <div className="flex flex-col items-center">
                <Star 
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110", 
                    isHighlighted ? "fill-primary" : "fill-transparent"
                  )} 
                />
                <span className="mt-0.5 text-[11px] font-medium">{starValue.toFixed(1)}</span>
              </div>
              
              {isSelected && (
                <div className="absolute -inset-pxunded-xl border border-primary/20 bg-primary/5 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-linear-to-r from-border/50 to-transparent" />
        <p className="font-meta text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
          Skor: <span className="text-text-primary">{value ? value.toFixed(1) : "—"}</span>
        </p>
      </div>
    </div>
  );
}
