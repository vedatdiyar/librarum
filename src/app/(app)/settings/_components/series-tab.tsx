"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
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

// Custom Hook for Series Logic
function useSeriesLogic() {
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

  return {
    seriesList,
    isLoading,
    newName,
    setNewName,
    newTotal,
    setNewTotal,
    editingSeries,
    setEditingSeries,
    deleteConfirm,
    setDeleteConfirm,
    inputRef,
    createMutation,
    updateMutation,
    deleteMutation
  };
}

interface SeriesCreateFormProps {
  newName: string;
  setNewName: (name: string) => void;
  newTotal: string;
  setNewTotal: (total: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  createMutation: UseMutationResult<any, Error, { name: string; totalVolumes: number | null }>;
}

function SeriesCreateForm({ 
  newName, 
  setNewName, 
  newTotal, 
  setNewTotal, 
  inputRef, 
  createMutation 
}: SeriesCreateFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-serif text-lg font-bold tracking-tight text-white">Seri Ekle</h3>
        <p className="text-sm text-foreground/80">Çok ciltli setleri veya kitap serilerini tek bir çatıda toplayın.</p>
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
  );
}

interface SeriesItemProps {
  series: Series;
  editingSeries: Series | null;
  setEditingSeries: (series: Series | null) => void;
  setDeleteConfirm: (series: Series | null) => void;
  updateMutation: UseMutationResult<any, Error, { id: string; name: string; totalVolumes: number | null }>;
}

function SeriesItem({ 
  series, 
  editingSeries, 
  setEditingSeries, 
  setDeleteConfirm, 
  updateMutation 
}: SeriesItemProps) {
  const isEditing = editingSeries?.id === series.id;

  return (
    <div className="group grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-white/4 md:grid-cols-[1fr_140px_140px_112px] md:py-3">
      <div className="min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2 md:block">
            <Input 
              id={`edit-series-name-${series.id}`}
              value={editingSeries.name}
              onChange={(e) => setEditingSeries({ ...editingSeries, name: e.target.value })}
              className="h-9 rounded-lg border-white/10 bg-white/5 text-sm"
              placeholder="Seri Adı"
            />
            <div className="md:hidden">
              <Input 
                type="number"
                id={`edit-series-total-mobile-${series.id}`}
                value={editingSeries.totalVolumes ?? ""}
                onChange={(e) => setEditingSeries({ 
                  ...editingSeries, 
                  totalVolumes: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="h-9 w-full rounded-lg border-white/10 bg-white/5 text-sm"
                placeholder="Cilt Sayısı"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 md:block">
            <p className="truncate font-serif text-base font-bold text-white transition-colors group-hover:text-primary">{series.name}</p>
            <div className="flex items-center gap-2 text-[10px] font-medium text-foreground/60 md:hidden">
              <span>{series.totalVolumes ? `${series.totalVolumes} Cilt` : "—"}</span>
              <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
              <span>{series.bookCount} kitap</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="hidden md:block">
        {isEditing ? (
          <Input 
            type="number"
            id={`edit-series-total-${series.id}`}
            value={editingSeries.totalVolumes ?? ""}
            onChange={(e) => setEditingSeries({ 
              ...editingSeries, 
              totalVolumes: e.target.value ? parseInt(e.target.value) : null 
            })}
            className="h-9 w-28 rounded-lg border-white/10 bg-white/5 text-sm"
            placeholder="Cilt"
          />
        ) : (
          <p className="text-xs font-medium text-foreground/80">
            {series.totalVolumes ? `${series.totalVolumes} Cilt` : "—"}
          </p>
        )}
      </div>

      <div className="hidden md:block">
        <p className="text-xs font-medium text-foreground/80">{series.bookCount} kitap</p>
      </div>

      <div className="flex justify-end gap-1">
        {isEditing ? (
          <div className="flex flex-col gap-1 md:flex-row">
            <Button 
                size="icon" 
                className="h-8 w-8 bg-primary/20 text-primary hover:bg-primary/30 md:h-9 md:w-9"
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
                className="h-8 w-8 text-foreground/80 hover:bg-white/5 md:h-9 md:w-9"
                onClick={() => setEditingSeries(null)}
            >
                <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-lg text-foreground/80 transition-all hover:bg-white/5 hover:text-white md:opacity-0 md:group-hover:opacity-100"
              onClick={() => setEditingSeries(series)}
              >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-lg text-foreground/80 transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
              onClick={() => setDeleteConfirm(series)}
              >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface SeriesDeleteDialogProps {
  deleteConfirm: Series | null;
  setDeleteConfirm: (series: Series | null) => void;
  deleteMutation: UseMutationResult<any, Error, string>;
}

function SeriesDeleteDialog({ 
  deleteConfirm, 
  setDeleteConfirm, 
  deleteMutation 
}: SeriesDeleteDialogProps) {
  return (
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
  );
}

export function SeriesTab() {
  const {
    seriesList,
    isLoading,
    newName,
    setNewName,
    newTotal,
    setNewTotal,
    editingSeries,
    setEditingSeries,
    deleteConfirm,
    setDeleteConfirm,
    inputRef,
    createMutation,
    updateMutation,
    deleteMutation
  } = useSeriesLogic();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SeriesCreateForm 
        newName={newName}
        setNewName={setNewName}
        newTotal={newTotal}
        setNewTotal={setNewTotal}
        inputRef={inputRef}
        createMutation={createMutation}
      />

      <div className="h-px w-full bg-white/5" />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Mevcut Seriler</h3>
            <span className="text-xs font-bold tracking-[0.16em] text-foreground/80 uppercase">{seriesList?.length ?? 0} Seri</span>
        </div>

        {seriesList && seriesList.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/5 bg-white/2">
              <div className="hidden grid-cols-[1fr_140px_140px_112px] border-b border-white/5 bg-white/2 px-6 py-3 md:grid">
                <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Seri</span>
                <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Cilt Sayısı</span>
                <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Kitap Sayısı</span>
                <span className="sr-only">İşlemler</span>
              </div>
              <div className="divide-y divide-white/2">
                {seriesList.map((series) => (
                    <SeriesItem 
                      key={series.id}
                      series={series}
                      editingSeries={editingSeries}
                      setEditingSeries={setEditingSeries}
                      setDeleteConfirm={setDeleteConfirm}
                      updateMutation={updateMutation}
                    />
                ))}
              </div>
            </div>
        ) : (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 p-12 duration-700 animate-in fade-in">
                <p className="mb-4 font-serif text-lg font-bold text-white/80">Kayıtlı Seri Bulunmuyor</p>
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

      <SeriesDeleteDialog 
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}
