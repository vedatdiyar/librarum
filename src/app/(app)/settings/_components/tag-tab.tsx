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
} from "@/components/ui";

interface Tag {
  id: string;
  name: string;
  bookCount: number;
}

export function TagTab() {
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Tag | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Etiketler yüklenemedi");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Etiket eklenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewName("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Etiket silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
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
        <h3 className="text-xl font-semibold mb-4">Yeni Etiket Ekle</h3>
        <div className="flex flex-col gap-3 md:flex-row md:gap-2">
          <Input
            ref={inputRef}
            placeholder="Etiket adı..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName) createMutation.mutate(newName);
            }}
          />
          <Button 
            className="w-full md:w-auto"
            onClick={() => createMutation.mutate(newName)}
            disabled={!newName || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Ekle
          </Button>
        </div>
      </Card>

      {tags && tags.length > 0 ? (
        <div className="grid gap-4">
          {tags.map((tag) => (
            <Card key={tag.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-lg truncate">{tag.name}</p>
                <p className="text-sm text-text-secondary">{tag.bookCount} kitap</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                className="shrink-0"
                onClick={() => setDeleteConfirm(tag)}
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
              <p className="text-lg font-medium">Henuz etiket yok</p>
              <p className="text-sm leading-6 text-text-secondary">
                Okuma listelerini hizli ayirmak icin ilk etiketini ekleyip filtrelerde kullanabilirsin.
              </p>
            </div>
            <Button onClick={() => inputRef.current?.focus()} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Ilk etiketi ekle
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etiketi Sil?</DialogTitle>
            <DialogDescription>
              {deleteConfirm && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">
                       Bu etiket <strong>{deleteConfirm.bookCount}</strong> kitapta kullanılıyor. 
                       Silinirse bu kitapların etiketi kaldırılır.
                    </p>
                  </div>
                  <p><strong>{deleteConfirm.name}</strong> etiketini silmek istediğinizden emin misiniz?</p>
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
              {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Etiketi Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
