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
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@exlibris/ui";

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
      if (!res.ok) throw new Error("Kategori eklenemedi");
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
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Yeni Kategori Ekle</h3>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Kategori adı..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName) createMutation.mutate(newName);
            }}
          />
          <Button 
            onClick={() => createMutation.mutate(newName)}
            disabled={!newName || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Ekle
          </Button>
        </div>
      </Card>

      {categories && categories.length > 0 ? (
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{category.name}</p>
                <p className="text-sm text-text-secondary">{category.bookCount} kitap</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setDeleteConfirm(category)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">Henuz kategori yok</p>
              <p className="text-sm leading-6 text-text-secondary">
                Koleksiyonunu daha rahat filtrelemek icin ilk kategorini simdi ekleyebilirsin.
              </p>
            </div>
            <Button onClick={() => inputRef.current?.focus()} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Ilk kategoriyi ekle
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Sil?</DialogTitle>
            <DialogDescription>
              {deleteConfirm && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">
                       Bu kategori <strong>{deleteConfirm.bookCount}</strong> kitapta kullanılıyor. 
                       Silinirse bu kitapların kategorisi boş kalır.
                    </p>
                  </div>
                  <p><strong>{deleteConfirm.name}</strong> kategorisini silmek istediğinizden emin misiniz?</p>
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
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Kategoriyi Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
