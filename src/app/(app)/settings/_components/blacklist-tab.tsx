"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldAlert,
  User,
  Library,
  Tag as TagIcon
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card,
  Badge
} from "@/components/ui";

interface Preference {
  id: string;
  type: "author" | "category" | "tag";
  value: string;
}

export function BlacklistTab() {
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"author" | "category" | "tag">("author");
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery<Preference[]>({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await fetch("/api/preferences");
      if (!res.ok) throw new Error("Tercihler yüklenemedi");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value })
      });
      if (!res.ok) throw new Error("Tercih eklenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      setNewValue("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/preferences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Tercih silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "author": return <User className="w-3 h-3 mr-1" />;
      case "category": return <Library className="w-3 h-3 mr-1" />;
      case "tag": return <TagIcon className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "author": return "Yazar";
      case "category": return "Kategori";
      case "tag": return "Etiket";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-2">AI Kara Liste</h3>
        <p className="text-sm text-text-secondary mb-6">
          Buraya eklediğiniz yazar, kategori veya etiketler AI kitap önerilerinde filtrelenir ve size önerilmez.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex w-fit rounded-xl border border-border/80 bg-surface-raised p-1">
            {(["author", "category", "tag"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  newType === t ? "bg-surface-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {getTypeText(t)}
              </button>
            ))}
          </div>
          
          <div className="flex-1 flex gap-2">
            <Input 
              placeholder={`${getTypeText(newType)} adı...`} 
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newValue) createMutation.mutate({ type: newType, value: newValue });
              }}
            />
            <Button 
              onClick={() => createMutation.mutate({ type: newType, value: newValue })}
              disabled={!newValue || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Ekle
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {prefs?.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border/80 bg-surface-raised/40 py-12 text-center">
            <ShieldAlert className="w-12 h-12 text-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-text-secondary">Henüz kara listeye eklenmiş bir tercih yok.</p>
          </div>
        ) : (
          prefs?.map((pref) => (
            <Card key={pref.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Badge variant="muted" className="flex shrink-0 items-center">
                  {getTypeIcon(pref.type)}
                  {getTypeText(pref.type)}
                </Badge>
                <p className="font-medium truncate">{pref.value}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="shrink-0 text-text-secondary hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteMutation.mutate(pref.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
