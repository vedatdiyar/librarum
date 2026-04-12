import {
  AlertTriangle,
  LoaderCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui";

export function BookFormActions(props: Record<string, any>) {
  const { layout, isSubmitting, mode, onCancel, onOpenChange, submitError } = props;
  const actionsClassName =
    layout === "page"
      ? "mt-12 rounded-[32px] border border-white/8 bg-white/3 px-4 py-8 md:px-6"
      : "mt-12 border-t border-white/5 bg-transparent px-6 py-8 md:-mx-8 md:px-8";
  const actionsInnerClassName =
    layout === "page"
      ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      : "mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end";

  return (
    <>
      <div className={actionsClassName}>
        <div className={actionsInnerClassName}>
          <p className="max-w-md text-sm leading-relaxed text-foreground/70">
            Kayıt işlemi tamamlandığında; yinelenen denetimi, bilgi güncelleme ve kapak seçimi süreçleri mevcut işleyişe uygun olarak korunur.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-2xl border-white/10 bg-white/3 px-8 text-[11px] font-bold tracking-widest text-white/60 uppercase transition-all hover:bg-white/8 hover:text-white"
              disabled={isSubmitting}
              onClick={onCancel ?? (() => onOpenChange?.(false))}
              variant="ghost"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Vazgeç
            </Button>
            <Button
              className="h-12 rounded-2xl bg-white px-10 text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {mode === "add" ? "Kaydet" : "Güncelle"}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {submitError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-rose-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
          <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">{submitError}</p>
        </div>
      ) : null}
    </>
  );
}
