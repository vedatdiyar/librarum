"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, cn } from "@librarum/ui";
import type { BookDetail, BookStatus } from "@librarum/types";
import { readJsonResponse } from "@librarum/lib";

const RETURN_STATUS_OPTIONS: Array<{ value: Exclude<BookStatus, "loaned" | "lost">; label: string }> = [
  { value: "owned", label: "Sahibim" },
  { value: "completed", label: "Okudum" },
  { value: "abandoned", label: "Yarim Biraktim" }
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
      <DialogContent className="w-[min(92vw,560px)]">
        <DialogHeader className="pr-10">
          <DialogTitle>Odunc kaydini kapat</DialogTitle>
          <DialogDescription>
            Bu kitabi hangi duruma alalim? Secimden sonra odunc alan ve tarih bilgileri temizlenecek.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid gap-3">
            {RETURN_STATUS_OPTIONS.map((option) => (
              <button
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm transition",
                  returnStatus === option.value
                    ? "border-border/80 bg-surface-elevated text-text-primary"
                    : "border-border/80 bg-surface text-text-secondary hover:border-border hover:text-text-primary"
                )}
                key={option.value}
                onClick={() => setReturnStatus(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {returnMutation.isError ? (
            <p className="text-sm text-destructive">
              {returnMutation.error instanceof Error
                ? returnMutation.error.message
                : "Iade islemi tamamlanamadi."}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Vazgec
          </Button>
          <Button onClick={() => returnMutation.mutate(returnStatus)} variant="primary">
            {returnMutation.isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Guncelleniyor
              </>
            ) : (
              "Durumu guncelle"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
