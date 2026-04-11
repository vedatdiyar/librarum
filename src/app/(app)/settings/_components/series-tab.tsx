"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Pencil,
  Check,
  X
} from "lucide-react";
import { 
  Button, 
  Input, 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui";

interface Series {
  id: string;
  name: string;
  totalVolumes: number | null;
  bookCount: number;
}

export function SeriesTab() {
  const [newName, setNewName] = useState("");
  const [newTotal, setNewTotal] = useState<string>("");
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Series | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const { data: seriesList, isLoading } = useQuery<Series[]>({
    queryKey: ["series"],
    queryFn: async () => {
      const res = await fetch("/api/series");
      if (!res.ok) throw new Error("Seriler yüklenemedi");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, totalVolumes }: { name: string; totalVolumes: number | null }) => {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, totalVolumes })
      });
      if (!res.ok) throw new Error("Seri oluşturulamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      setNewName("");
      setNewTotal("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, totalVolumes }: { id: string; name: string; totalVolumes: number | null }) => {
      const res = await fetch(`/api/series/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, totalVolumes })
      });
      if (!res.ok) throw new Error("Seri güncellenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      setEditingSeries(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Seri silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      setDeleteConfirm(null);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Seri Ekle</h3>
            <p className="text-sm text-foreground/70">Çok ciltli setleri veya kitap serilerini tek bir çatıda toplayın.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <div className="flex flex-col gap-1.5">
            <label className="sr-only" htmlFor="series-name-input">Seri Adı</label>
            <Input
              ref={inputRef}
              id="series-name-input"
              name="seriesName"
              placeholder="Seri ismi (örn. Harry Potter, Ansiklopedi)..." 
              value={newName}
              className="h-9 w-full rounded-lg border-white/5 bg-white/2 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="sr-only" htmlFor="series-total-volumes-input">Cilt Sayısı</label>
            <Input 
              type="number"
              id="series-total-volumes-input"
              name="seriesTotalVolumes"
              placeholder="Cilt sayısı" 
              value={newTotal}
              className="h-9 rounded-lg border-white/5 bg-white/2 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
              onChange={(e) => setNewTotal(e.target.value)}
            />
          </div>
          <Button 
            className="h-9 rounded-lg bg-white px-5 text-[10px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
            onClick={() => createMutation.mutate({ 
              name: newName, 
              totalVolumes: newTotal ? parseInt(newTotal) : null 
            })}
            disabled={!newName || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
            Ekle
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-white/5" />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Mevcut Seriler</h3>
            <span className="text-[10px] font-bold tracking-[0.2em] text-foreground/50 uppercase">{seriesList?.length ?? 0} Seri</span>
        </div>

        {seriesList && seriesList.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/5 bg-white/2">
              <div className="grid grid-cols-[1fr_120px_120px_100px] border-b border-white/5 bg-white/2 px-6 py-2">
                <span className="text-[9px] font-bold tracking-[0.2em] text-foreground/40 uppercase">Seri</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-foreground/40 uppercase">Cilt Sayısı</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-foreground/40 uppercase">Kitap Sayısı</span>
                <span className="sr-only">İşlemler</span>
              </div>
              <div className="divide-y divide-white/2">
                {seriesList.map((series, idx) => (
                    <div 
                        key={series.id} 
                        className="group grid grid-cols-[1fr_120px_120px_100px] items-center px-6 py-2 transition-colors hover:bg-white/4"
                    >
                        <div className="min-w-0">
                          {editingSeries?.id === series.id ? (
                            <Input 
                              id={`edit-series-name-${series.id}`}
                              value={editingSeries.name}
                              onChange={(e) => setEditingSeries({ ...editingSeries, name: e.target.value })}
                              className="h-8 rounded-lg border-white/10 bg-white/5 text-xs"
                              placeholder="Seri Adı"
                            />
                          ) : (
                            <p className="truncate font-serif text-[15px] font-bold text-white transition-colors group-hover:text-primary">{series.name}</p>
                          )}
                        </div>
                        
                        <div>
                          {editingSeries?.id === series.id ? (
                            <Input 
                              type="number"
                              id={`edit-series-total-${series.id}`}
                              value={editingSeries.totalVolumes ?? ""}
                              onChange={(e) => setEditingSeries({ 
                              ...editingSeries, 
                              totalVolumes: e.target.value ? parseInt(e.target.value) : null 
                              })}
                              className="h-8 w-24 rounded-lg border-white/10 bg-white/5 text-xs"
                              placeholder="Cilt"
                            />
                          ) : (
                            <p className="text-[10px] font-medium text-foreground/50">
                              {series.totalVolumes ? `${series.totalVolumes} Cilt` : "—"}
                            </p>
                          )}
                        </div>

                        <div>
                           <p className="text-[10px] font-medium text-foreground/50">{series.bookCount} kitap</p>
                        </div>

                        <div className="flex justify-end gap-1">
                          {editingSeries?.id === series.id ? (
                            <>
                              <Button 
                                  size="icon" 
                                  className="h-8 w-8 bg-primary/20 text-primary hover:bg-primary/30"
                                  onClick={() => updateMutation.mutate({
                                  id: editingSeries.id,
                                  name: editingSeries.name,
                                  totalVolumes: editingSeries.totalVolumes
                                  })}
                                  disabled={updateMutation.isPending}
                              >
                                  <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-foreground/20 hover:bg-white/5"
                                  onClick={() => setEditingSeries(null)}
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg text-foreground/10 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/5 hover:text-white"
                                onClick={() => setEditingSeries(series)}
                                >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg text-foreground/10 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteConfirm(series)}
                                >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                    </div>
                ))}
              </div>
            </div>
        ) : (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 p-12 duration-700 animate-in fade-in">
                <p className="mb-4 font-serif text-lg font-bold text-white/40">Kayıtlı Seri Bulunmuyor</p>
                <p className="mb-8 max-w-xs text-center text-sm leading-relaxed text-foreground">
                    Kitap serilerini takip etmek için yeni bir seri oluşturun.
                </p>
                <Button 
                    onClick={() => inputRef.current?.focus()} 
                    variant="ghost"
                    className="rounded-xl border border-white/5 hover:bg-white/3"
                >
                    İlk Seriyi Ekle
                </Button>
            </div>
        )}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="glass-panel rounded-3xl border-white/10 bg-background/95 backdrop-blur-3xl sm:max-w-[425px]">
          <DialogHeader className="space-y-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-white">Seriyi Sil?</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground">
               {deleteConfirm && (
                <div className="mt-4 flex flex-col gap-6">
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 opacity-60" />
                    <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">
                       Uyarı: Bu seri şu anda <strong>{deleteConfirm.bookCount}</strong> kitap ile ilişkilendirilmiş durumda. 
                       Silme işlemi, bu kitapların seri bilgisini kaldıracaktır.
                    </p>
                  </div>
                  <p><strong>{deleteConfirm.name}</strong> serisinin listeden silinmesini onaylıyor musunuz?</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="rounded-xl border-white/5 bg-white/3 hover:bg-white/8">Vazgeç</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl shadow-2xl"
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
