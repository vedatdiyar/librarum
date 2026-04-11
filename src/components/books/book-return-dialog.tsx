"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, History, CheckCircle2, XCircle } from "lucide-react";
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  cn 
} from "@/components/ui";
import type { BookDetail, BookStatus } from "@/types";
import { readJsonResponse } from "@/lib/shared";

import { BOOK_STATUS_LABELS } from "@/lib/constants/books";

const RETURN_STATUS_OPTIONS: Array<{ value: Exclude<BookStatus, "loaned" | "lost">; label: string; description: string }> = [
  { 
    value: "owned", 
    label: BOOK_STATUS_LABELS.owned, 
    description: "Kitabı ana koleksiyon durumuna döndürür." 
  },
  { 
    value: "completed", 
    label: BOOK_STATUS_LABELS.completed, 
    description: "Kitabı okundu/değerlendirildi olarak işaretler." 
  },
  { 
    value: "abandoned", 
    label: BOOK_STATUS_LABELS.abandoned, 
    description: "Kitabı yarım bırakılmış olarak arşive kaldırır." 
  }
];

type BookReturnDialogProps = {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function BookReturnDialog({
  bookId,
  open,
  onOpenChange,
  onSuccess
}: BookReturnDialogProps) {
  const queryClient = useQueryClient();
  const [returnStatus, setReturnStatus] =
    React.useState<Exclude<BookStatus, "loaned" | "lost">>("owned");

  const returnMutation = useMutation({
    mutationFn: async (nextStatus: Exclude<BookStatus, "loaned" | "lost">) =>
      readJsonResponse<BookDetail>(
        await fetch(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            status: nextStatus,
            loanedTo: null,
            loanedAt: null
          })
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["book-detail", bookId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      onOpenChange(false);
      onSuccess?.();
    }
  });

  React.useEffect(() => {
    if (!open) {
      setReturnStatus("owned");
    }
  }, [open]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="glass-panel max-w-xl overflow-hidden rounded-[40px] border-white/10 bg-background/95 p-0 shadow-2xl backdrop-blur-3xl">
        <div className="space-y-8 p-10">
            <DialogHeader className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                        <History className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="font-serif text-3xl font-bold tracking-tight text-white">
                            İade İşlemi
                        </DialogTitle>
                        <DialogDescription className="text-[13px] leading-relaxed text-foreground italic">
                            Kitabın ödünç kaydını kapatın. Kişi verileri ve tarih markerları senkronizasyonun ardından temizlenecektir.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="grid gap-3">
                {RETURN_STATUS_OPTIONS.map((option) => (
                <button
                    className={cn(
                    "group flex flex-col gap-1 rounded-2xl border p-5 text-left transition-all duration-500",
                    returnStatus === option.value
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/5 bg-white/1 hover:border-white/10 hover:bg-white/3"
                    )}
                    key={option.value}
                    onClick={() => setReturnStatus(option.value)}
                    type="button"
                >
                    <span className={cn(
                        "text-[11px] font-bold tracking-[0.2em] uppercase transition-colors",
                        returnStatus === option.value ? "text-primary" : "text-white/40 group-hover:text-white/60"
                    )}>
                        {option.label}
                    </span>
                    <span className="text-[10px] tracking-wider text-foreground italic">
                        {option.description}
                    </span>
                </button>
                ))}
            </div>

            {returnMutation.isError ? (
                <div className="flex items-center gap-2 px-1 text-rose-400">
                    <History className="h-3 w-3 rotate-180" />
                    <p className="text-[10px] font-bold tracking-tight uppercase">
                        {returnMutation.error instanceof Error ? returnMutation.error.message : "Orchestration failure during return."}
                    </p>
                </div>
            ) : null}

            <DialogFooter className="flex-col gap-4 pt-4 sm:flex-row">
                <Button
                    className="order-2 h-12 flex-1 rounded-2xl border-white/10 bg-white/3 text-[11px] font-bold tracking-widest text-white/40 uppercase transition-all hover:bg-white/8 hover:text-white sm:order-1"
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Vazgeç
                </Button>
                <Button 
                    className="order-1 h-12 flex-1 rounded-2xl bg-white text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary sm:order-2"
                    disabled={returnMutation.isPending}
                    onClick={() => returnMutation.mutate(returnStatus)}
                >
                    {returnMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        İadeyi Senkronize Et
                    </div>
                    )}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
