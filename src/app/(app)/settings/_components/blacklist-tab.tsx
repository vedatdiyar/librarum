"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldAlert,
  User,
  Library
} from "lucide-react";
import { 
  Button, 
  Input, 
  cn
} from "@/components/ui";

interface Preference {
  id: string;
  type: "author" | "category";
  value: string;
}

export function BlacklistTab() {
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"author" | "category">("author");
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
      if (!res.ok) throw new Error("Dışlama eklenemedi");
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
      if (!res.ok) throw new Error("Dışlama kaldırılamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "author": return <User className="h-3.5 w-3.5" />;
      case "category": return <Library className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "author": return "Yazar";
      case "category": return "Alan";
      default: return type;
    }
  };

  return (
    <div className="space-y-8 duration-1000 animate-in fade-in">
      <div className="space-y-5">
        <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Yapay Zeka Sınırları</h3>
            <p className="max-w-xl text-[13px] leading-relaxed text-foreground/80">
                Yapay zeka motorunuz için anlamsal çerçeveyi belirleyin. Buraya eklenen yazarlar veya alanlar, keşif ve öneri listelerinizden tamamen hariç tutulur.
            </p>
        </div>
        
        <div className="glass-panel rounded-4xl border border-white/5 bg-white/1 p-6 shadow-inner">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                    <label className="px-1 text-[9px] font-bold tracking-[0.3em] text-foreground/80 uppercase">Hedef Varlık Türü</label>
                    <div className="flex w-fit rounded-lg border border-white/5 bg-white/5 p-1 backdrop-blur-xl">
                      {(["author", "category"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={cn(
                                "rounded-lg px-5 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-500",
                                newType === t 
                                    ? "bg-white text-black shadow-lg" 
                                    : "text-foreground/80 hover:text-white"
                            )}
                        >
                            {getTypeText(t)}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="w-full flex-1 space-y-2.5">
                    <label className="px-1 text-[9px] font-bold tracking-[0.3em] text-foreground/80 uppercase" htmlFor="blacklist-value-input">Tanımlayıcı Adı</label>
                    <Input 
                        id="blacklist-value-input"
                        name="blacklistValue"
                        placeholder={`Keşiften hariç tutulacak ${getTypeText(newType).toLowerCase()} ismini girin...`} 
                        value={newValue}
                        className="h-9 rounded-lg border-white/5 bg-white/2 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && newValue) createMutation.mutate({ type: newType, value: newValue });
                        }}
                    />
                </div>
                <Button 
                    onClick={() => createMutation.mutate({ type: newType, value: newValue })}
                    disabled={!newValue || createMutation.isPending}
                    className="h-9 w-full rounded-lg bg-white px-5 text-[10px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary sm:w-auto"
                >
                    {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="mr-2 h-3.5 w-3.5" />}
                    Dışla
                </Button>
            </div>
        </div>
      </div>

      <div className="h-px w-full bg-white/5" />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Aktif Kısıtlamalar</h3>
            <span className="text-xs font-bold tracking-[0.16em] text-foreground/80 uppercase">{prefs?.length ?? 0} Varlık Filtrelendi</span>
        </div>

        {prefs?.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-4xl border-dashed border-white/5 p-12 duration-700 animate-in fade-in">
            <div className="mb-4 rounded-2xl border border-white/5 bg-white/2 p-4 text-foreground/80">
                <ShieldAlert className="h-8 w-8" />
            </div>
            <p className="mb-2 font-serif text-lg font-bold text-white/80">Sınırsız Keşif</p>
            <p className="max-w-sm text-center text-sm leading-relaxed text-foreground/80">Yapay zeka motoru şu anda herhangi bir kısıtlama olmadan çalışıyor.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-white/2">
            <div className="grid grid-cols-[120px_1fr_112px] border-b border-white/5 bg-white/2 px-6 py-3">
              <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Tür</span>
              <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Değer</span>
              <span className="sr-only">İşlemler</span>
            </div>
            <div className="divide-y divide-white/2">
              {prefs?.map((pref, idx) => (
                   <div 
                      key={pref.id} 
                      className="group grid grid-cols-[120px_1fr_112px] items-center px-6 py-3 transition-colors hover:bg-white/4"
                  >
                      <div className="flex items-center gap-2.5 text-foreground/80">
                           {getTypeIcon(pref.type)}
                           <span className="text-[11px] font-bold tracking-[0.12em] uppercase">{getTypeText(pref.type)}</span>
                      </div>
                      
                      <p className="font-serif text-base font-bold text-white transition-colors group-hover:text-primary">{pref.value}</p>

                      <div className="flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-9 w-9 rounded-lg text-foreground/80 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteMutation.mutate(pref.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
