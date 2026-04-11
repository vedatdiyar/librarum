"use client";

import * as React from "react";
import { X, Hash, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SelectionPills({
  items,
  onRemove,
  onEdit
}: {
  items: Array<{ id: string; name: string }>;
  onRemove: (id: string) => void;
  onEdit?: (id: string, newName: string) => void;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (items.length === 0) {
    return null;
  }

  const handleStartEdit = (item: { id: string; name: string }) => {
    if (!onEdit) return;
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const handleSaveEdit = () => {
    if (editingId && onEdit && editValue.trim()) {
      onEdit(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item) => {
        const isEditing = editingId === item.id;
        
        return (
          <div 
              key={item.id} 
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/3 py-1.5 transition-all duration-300 animate-in zoom-in-95 hover:border-white/10 hover:bg-white/6",
                isEditing ? "border-primary/40 bg-white/10 px-2 ring-2 ring-primary/20" : "pr-1.5 pl-3"
              )}
          >
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  id={`selection-pill-edit-${item.id}`}
                  name="selectionPillEdit"
                  aria-label={`${item.name} etiketini duzenle`}
                  className="h-5 w-32 bg-transparent text-[11px] font-bold tracking-tight text-white uppercase outline-none"
                  onBlur={handleSaveEdit}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  value={editValue}
                />
                <button
                  className="rounded-lg bg-emerald-400/10 p-1 text-emerald-400 hover:bg-emerald-400/20"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur
                    handleSaveEdit();
                  }}
                  type="button"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                aria-label={`${item.name} etiketini duzenle`}
                className={cn(
                  "m-0 flex items-center gap-2 border-0 bg-transparent p-0 text-left",
                  onEdit && "cursor-text"
                )}
                onClick={() => handleStartEdit(item)}
                type="button"
              >
                 <Hash className="h-3 w-3 text-primary" />
                 <span className="text-[11px] font-bold tracking-tight text-white/60 uppercase transition-colors group-hover:text-white">
                    {item.name}
                 </span>
              </button>
            )}
            {!isEditing && (
              <button
                aria-label={`Remove ${item.name}`}
                className="rounded-lg bg-white/5 p-1.5 text-white/20 transition-all duration-300 hover:bg-rose-400/10 hover:text-rose-400"
                onClick={() => onRemove(item.id)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
