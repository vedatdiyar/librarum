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
  Card,
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
      if (!res.ok) throw new Error("Seri eklenemedi");
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
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Yeni Seri Ekle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            ref={inputRef}
            placeholder="Seri adı..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-2">
            <Input 
              type="number"
              placeholder="Toplam cilt sayısı (opsiyonel)" 
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
            />
            <Button 
              onClick={() => createMutation.mutate({ 
                name: newName, 
                totalVolumes: newTotal ? parseInt(newTotal) : null 
              })}
              disabled={!newName || createMutation.isPending}
              className="shrink-0"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Ekle
            </Button>
          </div>
        </div>
      </Card>

      {seriesList && seriesList.length > 0 ? (
        <div className="grid gap-4">
          {seriesList.map((series) => (
            <Card key={series.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1 w-full">
                {editingSeries?.id === series.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <Input 
                      value={editingSeries.name}
                      onChange={(e) => setEditingSeries({ ...editingSeries, name: e.target.value })}
                      className="h-9"
                    />
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={editingSeries.totalVolumes ?? ""}
                        onChange={(e) => setEditingSeries({ 
                          ...editingSeries, 
                          totalVolumes: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        className="h-9"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => updateMutation.mutate({
                          id: editingSeries.id,
                          name: editingSeries.name,
                          totalVolumes: editingSeries.totalVolumes
                        })}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setEditingSeries(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-lg truncate max-w-[200px] sm:max-w-none">{series.name}</p>
                    {series.totalVolumes && (
                      <span className="rounded-full border border-border/80 bg-surface-raised px-2 py-0.5 text-xs">
                        {series.totalVolumes} Cilt
                      </span>
                    )}
                  </div>
                )}
                {!editingSeries || editingSeries.id !== series.id ? (
                  <p className="text-sm text-text-secondary">{series.bookCount} kitap koleksiyonda</p>
                ) : null}
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setEditingSeries(series)}
                  disabled={!!editingSeries}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDeleteConfirm(series)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">Henuz seri yok</p>
              <p className="text-sm leading-6 text-text-secondary">
                Ciltli ya da devam eden koleksiyonlari takip etmek icin ilk serini ekleyebilirsin.
              </p>
            </div>
            <Button onClick={() => inputRef.current?.focus()} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Ilk seriyi ekle
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seriyi Sil?</DialogTitle>
            <DialogDescription>
              {deleteConfirm && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">
                       Bu seri <strong>{deleteConfirm.bookCount}</strong> kitapta kullanılıyor. 
                       Silinirse kitaplar seriden çıkarılır ama kütüphaneden silinmez.
                    </p>
                  </div>
                  <p><strong>{deleteConfirm.name}</strong> serisini silmek istediğinizden emin misiniz?</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Vazgeç</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Seriyi Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
