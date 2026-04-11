"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle 
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

interface Category {
  id: string;
  name: string;
  bookCount: number;
}

export function CategoryTab() {
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Kategoriler yüklenemedi");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Kategori oluşturulamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Kategori silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Kategori Ekle</h3>
            <p className="text-sm text-foreground/80">Koleksiyonunuzun yapısını düzenlemek için yeni kategoriler belirleyin.</p>
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="sr-only" htmlFor="category-name-input">Yeni kategori adı</label>
          <Input
            ref={inputRef}
            id="category-name-input"
            name="categoryName"
            placeholder="Koleksiyon ismi (örn. Roman, Tarih, Felsefe)..." 
            value={newName}
            className="h-9 rounded-lg border-white/5 bg-white/2 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8 md:max-w-md"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName) createMutation.mutate(newName);
            }}
          />
          <Button 
            className="h-9 rounded-lg bg-white px-5 text-[10px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
            onClick={() => createMutation.mutate(newName)}
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
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Mevcut Kategoriler</h3>
            <span className="text-xs font-bold tracking-[0.16em] text-foreground/80 uppercase">{categories?.length ?? 0} Kategori</span>
        </div>

        {categories && categories.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/5 bg-white/2">
              <div className="grid grid-cols-[1fr_140px_88px] border-b border-white/5 bg-white/2 px-6 py-3">
                <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Koleksiyon</span>
                <span className="text-[11px] font-bold tracking-[0.14em] text-foreground/80 uppercase">Kitap Sayısı</span>
                <span className="sr-only">İşlemler</span>
              </div>
              <div className="divide-y divide-white/2">
                {categories.map((category, idx) => (
                    <div 
                        key={category.id} 
                        className="group grid grid-cols-[1fr_140px_88px] items-center px-6 py-3 transition-colors hover:bg-white/4"
                    >
                        <p className="font-serif text-base font-bold text-white transition-colors group-hover:text-primary">{category.name}</p>
                        <p className="text-xs font-medium text-foreground/80">{category.bookCount} kitap</p>
                        <div className="flex justify-end">
                          <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-9 w-9 rounded-lg text-foreground/80 transition-all hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteConfirm(category)}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                ))}
              </div>
            </div>
        ) : (
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 p-12 duration-700 animate-in fade-in">
                <p className="mb-4 font-serif text-lg font-bold text-white/80">Koleksiyon Henüz Boş</p>
                <p className="mb-8 max-w-xs text-center text-sm leading-relaxed text-foreground">
                    Henüz herhangi bir kategori eklenmemiş.
                </p>
                <Button 
                    onClick={() => inputRef.current?.focus()} 
                    variant="ghost"
                    className="rounded-xl border border-white/5 hover:bg-white/3"
                >
                    İlk Kategoriyi Ekle
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
            <DialogTitle className="font-serif text-2xl font-bold text-white">Kategoriyi Sil?</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground">
               {deleteConfirm && (
                <div className="mt-4 flex flex-col gap-6">
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 opacity-60" />
                    <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">
                       Dikkat: Bu kategori şu anda <strong>{deleteConfirm.bookCount}</strong> kitap ile ilişkilendirilmiş durumda. 
                       Silme işlemi bu kitapları kategorisiz bırakacaktır.
                    </p>
                  </div>
                  <p><strong>{deleteConfirm.name}</strong> kategorisinin silinmesini onaylıyor musunuz?</p>
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
