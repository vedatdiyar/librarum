"use client";

import * as React from "react";
import { Barcode, CameraOff, X, Scan, Zap } from "lucide-react";
import { Button, cn } from "@/components/ui";

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
        setError("Optic sensor initialization failed. Verify peripheral permissions.");
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
        className={cn(
            "h-14 w-full rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all duration-500",
            isOpen ? "border-rose-400/20 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20" : "border-white/5 bg-white/3 text-white/40 hover:text-white"
        )}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        variant="ghost"
      >
        {isOpen ? (
          <>
            <X className="mr-2 h-4 w-4" />
            Deactivate Optic Sensor
          </>
        ) : (
          <>
            <Barcode className="mr-2 h-4 w-4" />
            Initiate Optic Acquisition
          </>
        )}
      </Button>

      {isOpen ? (
        <div className="glass-panel mt-6 rounded-[40px] border-white/5 bg-white/1 p-8 duration-700 animate-in fade-in slide-in-from-top-4">
            <div className="mb-6 flex items-center gap-4">
                <div className="shadow-glow rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                    <Scan className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-serif text-xl font-bold tracking-tight text-white">Universal Peripheral Scanner</h3>
                    <p className="text-[11px] leading-relaxed text-foreground italic">Align the ISBN sequence with the focal grid. Synchronization is automatic upon detection.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div
                    className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-inner"
                    id={scannerId}
                >
                   {!error && (
                        <div className="shadow-glow pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/40" />
                   )}
                </div>

                {error ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-rose-400 duration-500 animate-in zoom-in-95">
                        <CameraOff className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                        <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">{error}</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-1 text-primary">
                        <Zap className="h-3 w-3" />
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Acquisition sequence active</span>
                    </div>
                )}
            </div>
        </div>
      ) : null}
    </div>
  );
}
