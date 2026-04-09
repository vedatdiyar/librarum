import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui";
import type { DuplicateCheckResponse } from "@/types";

interface DuplicateDialogProps {
  duplicateResult: Extract<DuplicateCheckResponse, { isDuplicate: true }> | null;
  setDuplicateResult: (result: null) => void;
  isSubmitting: boolean;
  onConfirm: (resolution: "ignore" | "increase_copy") => void;
}

export function DuplicateDialog({
  duplicateResult,
  setDuplicateResult,
  isSubmitting,
  onConfirm
}: DuplicateDialogProps) {
  return (
    <Dialog
      onOpenChange={(open) => !open && setDuplicateResult(null)}
      open={Boolean(duplicateResult)}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Bu Kitap Zaten Var
          </DialogTitle>
          <DialogDescription>
            Koleksiyonunuzda &quot;<strong>{duplicateResult?.existingBook.title}</strong>&quot; adlı
            benzer bir kayıt bulundu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="panel-muted p-4">
            <p className="text-sm leading-6 text-text-secondary">
              Mevcut kopyayi artirmak mi istersiniz yoksa yine de yeni bir kayit mi
              olusturacaksiniz?
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            onClick={() => onConfirm("ignore")}
            variant="secondary"
          >
            Yeni Kayit Olustur
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            onClick={() => onConfirm("increase_copy")}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Kopya Sayisini Artir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
