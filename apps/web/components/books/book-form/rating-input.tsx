import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@librarum/ui";

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
    <div className="space-y-3">
      <div
        aria-label="Puan seçin"
        className="flex flex-wrap items-center gap-2"
        onMouseLeave={() => setHoveredValue(null)}
        role="group"
      >
        {Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((starValue) => {
          const filled = activeValue >= starValue;
          return (
            <button
              key={starValue}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition",
                filled
                  ? "border-accent/35 bg-accent/12 text-accent"
                  : "border-border/80 bg-surface text-text-secondary hover:border-border"
              )}
              onClick={() => onChange(value === starValue ? null : starValue)}
              onMouseEnter={() => setHoveredValue(starValue)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <Star className={cn("h-4 w-4", filled && "fill-current")} />
                {starValue.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-secondary">
        Mevcut puan: {value ? value.toFixed(1) : "Degerlendirilmedi"}
      </p>
    </div>
  );
}
