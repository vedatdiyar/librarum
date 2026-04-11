"use client";

import * as React from "react";
import { Star, X } from "lucide-react";
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

  const stars = [1, 2, 3, 4, 5];

  const RATING_LABELS: Record<number, string> = {
    1: "Berbat",
    2: "Kötü",
    3: "Eh işte",
    4: "İyi",
    5: "Harika"
  };

  const handleRating = (val: number) => {
    if (value === val) {
      onChange(null);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="relative flex flex-col gap-8 select-none">
      <div
        aria-label="Kitap puanı seçici"
        className="flex items-center gap-2"
        onMouseLeave={() => setHoveredValue(null)}
        role="group"
      >
        {stars.map((index) => {
          const isFull = activeValue >= index;
          const fillPercentage = isFull ? 100 : 0;
          
          return (
            <button
              aria-pressed={value === index}
              aria-label={`Puan: ${index}`}
              key={index}
              className="group relative h-12 w-12 transition-all duration-300 hover:scale-110 active:scale-95"
              onBlur={() => setHoveredValue(null)}
              onClick={() => handleRating(index)}
              onFocus={() => setHoveredValue(index)}
              onMouseEnter={() => setHoveredValue(index)}
              type="button"
            >
              {/* Star Background (Empty State) */}
              <Star
                className={cn(
                  "h-full w-full stroke-[1px] transition-colors duration-300",
                  activeValue >= index 
                    ? "text-transparent" 
                    : "text-white/10 group-hover:text-white/20"
                )}
                fill="currentColor"
              />

              {/* Star Fill (Letterboxd Orange/Gold) */}
              <div
                className="absolute inset-0 overflow-hidden text-primary transition-all duration-300 ease-out"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className="h-12 w-12 stroke-[1px]"
                  fill="currentColor"
                />
              </div>

              {/* Visual "Pulse" or subtle glow for the hovered value */}
              {hoveredValue !== null && hoveredValue >= index && (
                <div className="absolute inset-0 -z-10 rounded-full bg-primary/5" />
              )}
            </button>
          );
        })}

        {/* Clear Button */}
        <div 
            className={cn(
                "ml-4 transition-all duration-500",
                value !== null ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"
            )}
        >
            <button
                onClick={() => onChange(null)}
                className="group flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/2 text-white/20 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
                title="Puanı Sıfırla"
                type="button"
            >
                <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
            </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
            <div className={cn(
                "flex h-8 items-center gap-2 rounded-full border px-4 transition-all duration-500",
                value 
                    ? "border-primary/20 bg-primary/5 text-primary" 
                    : "border-white/5 bg-white/2 text-white/20"
            )}>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                    {value ? RATING_LABELS[value] || "ÖZEL PUAN" : "PUANLANMADI"}
                </span>
            </div>
        </div>
        <div className="h-px flex-1 bg-linear-to-r from-white/5 via-white/2 to-transparent" />
      </div>
    </div>
  );
}
