import * as React from "react";
import { AlertTriangle, RefreshCcw, PlusCircle, CheckCircle2 } from "lucide-react";
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
      <DialogContent className="glass-panel overflow-hidden rounded-[40px] border-white/10 bg-background/95 p-0 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] backdrop-blur-3xl duration-500 animate-in zoom-in-95 sm:max-w-[540px]">
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]" />
        
        <div className="space-y-8 p-10">
            <DialogHeader className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="font-serif text-3xl font-bold tracking-tight text-white">
                            Yinelenen Kayıt Denetimi
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed text-foreground italic">
                            Ana arşivde bu eserle eşleşen bir kayıt tespit edildi.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="glass-panel rounded-3xl border-white/5 bg-white/1 p-6 shadow-inner">
                <div className="mb-3 flex items-center gap-3">
                    <div className="h-1 w-1 rounded-full bg-amber-500" />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Mevcut Kayıt Bilgisi</p>
                </div>
                <p className="font-serif text-2xl leading-tight font-bold tracking-tight text-white">
                    {duplicateResult?.existingBook.title}
                </p>
                <div className="mt-4 border-t border-white/3 pt-4">
                    <p className="text-[12px] leading-relaxed text-foreground italic">
                        Mevcut kayda ait envanter sayısını artırmak mı istersiniz, yoksa bağımsız yeni bir kayıt mı oluşturmak istersiniz?
                    </p>
                </div>
            </div>

            <DialogFooter className="flex-col gap-4 pt-4 sm:flex-row">
                <Button
                    className="order-2 h-12 flex-1 rounded-2xl border-white/10 bg-white/3 text-[11px] font-bold tracking-widest text-white/40 uppercase transition-all hover:bg-white/8 hover:text-white sm:order-1"
                    disabled={isSubmitting}
                    onClick={() => onConfirm("ignore")}
                    variant="ghost"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Bağımsız Kayıt Ekle
                </Button>
                <Button
                    className="order-1 h-12 flex-1 rounded-2xl bg-white text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-amber-500 sm:order-2"
                    disabled={isSubmitting}
                    onClick={() => onConfirm("increase_copy")}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Kopya Sayısını Artır
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
