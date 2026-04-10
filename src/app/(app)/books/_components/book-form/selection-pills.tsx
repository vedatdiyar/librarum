import * as React from "react";
import { X, Hash } from "lucide-react";
import { Badge, cn } from "@/components/ui";

export function SelectionPills({
  items,
  onRemove
}: {
  items: Array<{ id: string; name: string }>;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => (
        <div 
            key={item.id} 
            className="group inline-flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/3 py-1.5 pr-1.5 pl-3 transition-all duration-500 animate-in zoom-in-95 hover:border-white/10 hover:bg-white/6"
        >
          <div className="flex items-center gap-2">
             <Hash className="h-3 w-3 text-primary" />
             <span className="text-[11px] font-bold tracking-tight text-white/60 uppercase transition-colors group-hover:text-white">
                {item.name}
             </span>
          </div>
          <button
            aria-label={`Remove ${item.name}`}
            className="rounded-lg bg-white/5 p-1.5 text-white/20 transition-all duration-300 hover:bg-rose-400/10 hover:text-rose-400"
            onClick={() => onRemove(item.id)}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
