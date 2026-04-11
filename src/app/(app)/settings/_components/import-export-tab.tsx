"use client";

import { useState } from "react";
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Database,
  ArrowRightLeft
} from "lucide-react";
import { 
  Button, 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  cn
} from "@/components/ui";
import { readJsonResponse } from "@/lib/shared";
import {
  CSV_BOOK_COLUMNS,
  CSV_BOOK_COLUMN_DESCRIPTIONS
} from "@/lib/import-export";

type ImportResult = {
  added: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
};

export function ImportExportTab() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleExport = async (format: "json" | "csv") => {
    try {
      const res = await fetch(`/api/export/${format}`);
      if (!res.ok) {
        const data = await readJsonResponse<{ error?: { message?: string } }>(res);
        throw new Error(data.error?.message ?? "Dışa aktarma işlemi başarısız oldu.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `librarum-export-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Dışa aktarma işlemi başarısız oldu."
      );
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await readJsonResponse<ImportResult>(
        await fetch("/api/import", {
          method: "POST",
          body: formData
        })
      );

      setImportResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "İçe aktarma işlemi başarısız oldu."
      );
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-10 duration-1000 animate-in fade-in">
      <section className="space-y-5">
        <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">Dışa Aktar</h3>
            <p className="max-w-xl text-[13px] leading-relaxed text-foreground/80">Koleksiyon kayıtlarınızı yedeklemek veya başka ortamlara taşımak için dışa aktarın.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/2 p-5 transition-all duration-500 hover:border-white/10">
            <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-primary">
                    <FileJson className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-serif text-[15px] font-bold tracking-tight text-white">Tam Arşiv (JSON)</p>
                    <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-foreground/80 uppercase">Tam Veri Yedeği</p>
                </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                    Koleksiyon veritabanınızın tam kopyası. Başka bir kütüphaneye taşınmak veya tam yedek almak için uygundur.
                </p>
                <Button 
                    className="h-9 w-full rounded-lg border-white/10 bg-white/3 text-[10px] font-bold tracking-widest text-white/80 uppercase transition-all hover:bg-white/8 hover:text-white" 
                    onClick={() => handleExport("json")} 
                    variant="ghost"
                >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    JSON Olarak İndir
                </Button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/2 p-5 transition-all duration-500 hover:border-white/10">
            <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-2.5 text-emerald-400/70">
                    <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-serif text-[15px] font-bold tracking-tight text-white">Tablo Halinde Veri (CSV)</p>
                    <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-foreground/80 uppercase">Tablo Görünümü</p>
                </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                    Okunabilir tablo formatı. Excel veya Google Sheets gibi veri analizi araçlarıyla uyumludur.
                </p>
                <Button 
                    className="h-9 w-full rounded-lg border-white/10 bg-white/3 text-[10px] font-bold tracking-widest text-white/80 uppercase transition-all hover:bg-white/8 hover:text-white" 
                    onClick={() => handleExport("csv")} 
                    variant="ghost"
                >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    CSV Olarak İndir
                </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-white/5" />

      <section className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-serif text-lg font-bold tracking-tight text-white">Dosya Yapısı</h3>
          <p className="max-w-xl text-[13px] leading-relaxed text-foreground/80">
            Excel/CSV dosyası için gerekli sütun dizilimi. Alanlar virgülle, liste formatındaki alanlar ise noktalı virgülle ayrılmalıdır.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CSV_BOOK_COLUMNS.map((column, idx) => (
                <div
                className="group relative flex flex-col rounded-xl border border-white/5 bg-white/1 p-4 transition-all duration-500 animate-in fade-in fill-mode-both hover:bg-white/3"
                key={column}
                style={{ animationDelay: `${idx * 50}ms` }}
                >
                <p className="font-mono text-xs font-bold tracking-widest text-primary uppercase transition-colors group-hover:text-primary">{column}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-foreground">
                    {CSV_BOOK_COLUMN_DESCRIPTIONS[column]}
                </p>
                </div>
            ))}
        </div>
      </section>

      <div className="h-px w-full bg-white/5" />

      <section className="space-y-5">
        <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold tracking-tight text-white">İçe Aktar</h3>
            <p className="max-w-xl text-[13px] leading-relaxed text-foreground/80">Dışarıdaki kayıtlarınızı koleksiyonunuza dahil edin. JSON mevcut arşivi değiştirir; CSV ise verilerinize ekleme yapar.</p>
        </div>

        <div className="group relative flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-dashed border-white/5 bg-white/1 p-8 text-center transition-all duration-700 hover:border-white/10 hover:bg-white/2 lg:p-10">
          <div className="relative mb-0 rounded-xl border border-white/10 bg-white/5 p-3.5 text-primary transition-transform duration-700 group-hover:scale-105">
            <Upload className="h-6 w-6" />
          </div>
          
          <div className="relative space-y-2">
            <p className="font-serif text-lg font-bold text-white">Dosya Yükle</p>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-foreground/80">
              Bir JSON veya CSV dosyası seçin. Sistemimiz kayıtları kontrol ederek koleksiyonunuza işleyecektir.
            </p>
          </div>

          <div className="relative mt-4">
            <label className="sr-only" htmlFor="import-file-input">İçe aktarılacak JSON veya CSV dosyası seçin</label>
            <Input
              accept=".json,.csv"
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={importing}
              id="import-file-input"
              name="importFile"
              onChange={handleImport}
              type="file"
            />
            <Button 
                disabled={importing}
                className="h-10 min-w-[180px] rounded-xl bg-white text-[10px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
            >
              {importing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
              )}
              Dosya Seç
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        onOpenChange={() => {
          setImportResult(null);
          setError(null);
          setDownloadError(null);
        }}
        open={Boolean(importResult || error || downloadError)}
      >
        <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-background/95 shadow-2xl backdrop-blur-3xl">
          <DialogHeader className="space-y-4">
            <div className={cn(
                "mb-2 flex h-12 w-12 items-center justify-center rounded-2xl",
                (downloadError || error) ? "border border-destructive/20 bg-destructive/10 text-destructive" : "border border-primary/20 bg-primary/10 text-primary"
            )}>
                 {(downloadError || error) ? <AlertCircle className="h-6 w-6" /> : <Database className="h-6 w-6" />}
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-white">
              {downloadError
                ? "Dışa Aktarma Hatası"
                : error
                  ? "İçe Aktarma Hatası"
                  : "İşlem Tamamlandı"}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-foreground">
              {downloadError || error
                ? "İşlem sırasında bir hata oluştu. Aşağıdaki detayları inceleyin."
                : "Kayıtlar koleksiyonunuza başarıyla eklendi."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 p-1">
            {downloadError || error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">
                <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">{downloadError ?? error}</p>
              </div>
            ) : null}

            {importResult ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 transition-all">
                    <p className="font-serif text-4xl font-bold text-emerald-400">{importResult.added}</p>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-emerald-400/50 uppercase">Eklenen Kitaplar</p>
                  </div>
                  <div className="group relative rounded-2xl border border-white/5 bg-white/3 p-5">
                    <p className="font-serif text-4xl font-bold text-white/80">{importResult.skipped}</p>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">Atlanan / Mevcut</p>
                  </div>
                </div>

                {importResult.errors.length > 0 ? (
                  <div className="space-y-4">
                    <p className="px-1 text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">
                      Hata Detayları ({importResult.errors.length})
                    </p>
                    <div className="max-h-72 divide-y divide-white/3 overflow-y-auto rounded-2xl border border-white/10 bg-white/1">
                      {importResult.errors.map((item, index) => (
                        <div className="flex items-start gap-4 p-4" key={`${item.row}-${index}`}>
                          <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] font-bold text-foreground">
                            SATIR {item.row}
                          </span>
                          <span className="text-xs leading-relaxed text-foreground">{item.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10">
                        <Database className="h-5 w-5 text-emerald-400/40" />
                    </div>
                    <p className="text-sm text-emerald-400/40">Hatasız aktarım tamamlandı.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-8">
            <Button
              className="h-12 w-full rounded-xl border-white/10 bg-white/3 text-[11px] font-bold tracking-widest text-white/80 uppercase transition-all hover:bg-white/8"
              onClick={() => {
                setImportResult(null);
                setError(null);
                setDownloadError(null);
              }}
            >
              Görünümü Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
