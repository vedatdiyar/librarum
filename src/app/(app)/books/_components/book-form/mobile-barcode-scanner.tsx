"use client";

import * as React from "react";
import { Barcode, CameraOff, X } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

type MobileBarcodeScannerProps = {
  disabled?: boolean;
  onDetected: (isbn: string) => void;
};

export function MobileBarcodeScanner({
  disabled,
  onDetected
}: MobileBarcodeScannerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scannerId = React.useId().replace(/:/g, "");
  const scannerRef = React.useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    let disposed = false;

    async function startScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (disposed) {
          return;
        }

        const scanner = new Html5Qrcode(scannerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128
          ]
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 260,
              height: 140
            }
          },
          async (decodedText) => {
            if (disposed) {
              return;
            }

            onDetected(decodedText);
            setIsOpen(false);
          },
          () => undefined
        );

        setError(null);
      } catch (scannerError) {
        console.error(scannerError);
        setError("Kamera baslatilamadi. Kamera iznini kontrol edin.");
      }
    }

    void startScanner();

    return () => {
      disposed = true;

      if (!scannerRef.current) {
        return;
      }

      void scannerRef.current.stop().catch(() => undefined);
      scannerRef.current.clear();
      scannerRef.current = null;
    };
  }, [isOpen, onDetected, scannerId]);

  return (
    <div className="md:hidden">
      <Button
        className="w-full"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        variant="secondary"
      >
        {isOpen ? (
          <>
            <X className="mr-2 h-4 w-4" />
            Tarayiciyi Kapat
          </>
        ) : (
          <>
            <Barcode className="mr-2 h-4 w-4" />
            Barkod Tara
          </>
        )}
      </Button>

      {isOpen ? (
        <Card className="mt-4 border-accent/20 bg-surface-raised/70">
          <CardHeader>
            <CardTitle className="text-xl">Mobil Barkod Tarayici</CardTitle>
            <CardDescription>
              ISBN barkodunu kameraya hizalayin. Okuma tamamlaninca alan otomatik
              doldurulur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="min-h-[280px] overflow-hidden rounded-2xl border border-border bg-background"
              id={scannerId}
            />

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <CameraOff className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
