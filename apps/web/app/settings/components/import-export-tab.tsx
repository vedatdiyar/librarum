"use client";

import { useState } from "react";
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet,
  AlertCircle,
  Loader2
} from "lucide-react";
import { 
  Button, 
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input
} from "@librarum/ui";
import { readJsonResponse } from "@librarum/lib";
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
        throw new Error(data.error?.message ?? "Disa aktarma basarisiz oldu.");
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
        err instanceof Error ? err.message : "Disa aktarma basarisiz oldu."
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
        err instanceof Error ? err.message : "Ice aktarma basarisiz oldu."
      );
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-xl font-semibold">Veri Disa Aktar</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border/80 bg-surface-raised p-2 text-accent">
                <FileJson className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">JSON Formati</p>
                <p className="text-sm text-text-secondary">
                  Tum verilerin tam kopyasi. Yedek almak ve ayni kutuphaneyi geri
                  yuklemek icin idealdir.
                </p>
              </div>
            </div>
            <Button className="mt-2" onClick={() => handleExport("json")} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              JSON Indir
            </Button>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border/80 bg-surface-raised p-2 text-accent">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">CSV Formati</p>
                <p className="text-sm text-text-secondary">
                  Excel veya Google Sheets icin tablosal cikti. Ayni kolon sozlesmesiyle
                  tekrar Librarum icine alinabilir.
                </p>
              </div>
            </div>
            <Button className="mt-2" onClick={() => handleExport("csv")} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              CSV Indir
            </Button>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="mb-2 text-xl font-semibold">CSV Kolon Sozlesmesi</h3>
          <p className="text-sm leading-6 text-text-secondary">
            CSV import ve export ayni standart kolonlari kullanir. `authors` ve `tags`
            alanlari noktalı virgulle ayrilir.
          </p>
        </div>

        <Card className="p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {CSV_BOOK_COLUMNS.map((column) => (
              <div
                className="rounded-2xl border border-border/80 bg-surface-raised p-4"
                key={column}
              >
                <p className="font-mono text-sm text-text-primary">{column}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {CSV_BOOK_COLUMN_DESCRIPTIONS[column]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Veri Ice Aktar</h3>
        <Card className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border/80 bg-surface-raised/40 p-8 text-center">
          <div className="mb-2 rounded-full border border-border/80 bg-surface-raised p-4 text-accent">
            <Upload className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-medium">Dosya Secin</p>
            <p className="mx-auto max-w-xl text-sm text-text-secondary">
              JSON tam yedek olarak geri yuklenir. CSV tarafinda duplicate kontrolu satir
              bazli calisir; gecersiz veya duplicate kayitlar atlanir ve raporlanir.
            </p>
          </div>
          <div className="relative">
            <Input
              accept=".json,.csv"
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={importing}
              onChange={handleImport}
              type="file"
            />
            <Button disabled={importing}>
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Dosya Sec
            </Button>
          </div>
        </Card>
      </section>

      <Dialog
        onOpenChange={() => {
          setImportResult(null);
          setError(null);
          setDownloadError(null);
        }}
        open={Boolean(importResult || error || downloadError)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {downloadError
                ? "Disa aktarma hatasi"
                : error
                  ? "Ice aktarma hatasi"
                  : "Ice aktarma tamamlandi"}
            </DialogTitle>
            <DialogDescription>
              {downloadError || error
                ? "Islem tamamlanamadi. Mesaji kontrol edip tekrar deneyebilirsin."
                : "Rapor asagida satir bazli olarak listelendi."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {downloadError || error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{downloadError ?? error}</p>
              </div>
            ) : null}

            {importResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-success/20 bg-success/10 p-3">
                    <p className="text-2xl font-bold text-success">{importResult.added}</p>
                    <p className="text-xs text-text-secondary">Basariyla eklendi</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-surface-raised p-3">
                    <p className="text-2xl font-bold">{importResult.skipped}</p>
                    <p className="text-xs text-text-secondary">Atlanan / raporlanan</p>
                  </div>
                </div>

                {importResult.errors.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Satir bazli rapor ({importResult.errors.length})
                    </p>
                    <div className="max-h-56 divide-y overflow-y-auto rounded-xl border border-border/80 bg-surface-raised/40">
                      {importResult.errors.map((item, index) => (
                        <div className="p-3 text-sm" key={`${item.row}-${index}`}>
                          <span className="mr-2 rounded bg-surface-raised px-2 py-1 font-mono text-xs">
                            Satir {item.row}
                          </span>
                          <span className="text-text-secondary">{item.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">
                    Tum satirlar sorunsuz islenmis.
                  </p>
                )}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={() => {
                setImportResult(null);
                setError(null);
                setDownloadError(null);
              }}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
