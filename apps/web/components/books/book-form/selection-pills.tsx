import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@exlibris/ui";

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
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge className="gap-2 pr-1" key={item.id} variant="muted">
          {item.name}
          <button
            className="rounded-full p-1 text-text-secondary transition hover:bg-surface hover:text-text-primary"
            onClick={() => onRemove(item.id)}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
