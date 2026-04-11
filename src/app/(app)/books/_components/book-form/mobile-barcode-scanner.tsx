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
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scannerId = React.useId().replace(/:/g, "");
  const onDetectedRef = React.useRef(onDetected);
  const isMountedRef = React.useRef(true);
  const shutdownPromiseRef = React.useRef<Promise<void> | null>(null);
  const scannerRef = React.useRef<{
    getState: () => number;
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  React.useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const stopAndClearScanner = React.useCallback(async () => {
    if (shutdownPromiseRef.current) {
      await shutdownPromiseRef.current;
      return;
    }

    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    const shutdownPromise = (async () => {
      let canClear = false;

      try {
        await scanner.stop();
        canClear = true;
      } catch (stopError) {
        const message = stopError instanceof Error ? stopError.message : String(stopError);

        if (message.includes("not running") || message.includes("not paused")) {
          canClear = true;
        } else {
          console.error(stopError);
        }
      }

      if (canClear) {
        try {
          scanner.clear();
        } catch (clearError) {
          console.error(clearError);
        }
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    })();

    shutdownPromiseRef.current = shutdownPromise;

    try {
      await shutdownPromise;
    } finally {
      if (shutdownPromiseRef.current === shutdownPromise) {
        shutdownPromiseRef.current = null;
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    let disposed = false;

    async function startScanner() {
      try {
        if (isMountedRef.current) {
          setIsTransitioning(true);
        }

        if (!window.isSecureContext) {
          setError(
            "Kamera erişimi için güvenli bağlantı gerekli (HTTPS). Geliştirmede tünel (ngrok/cloudflared) veya güvenli origin kullanın."
          );
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Tarayıcı kamera akışını desteklemiyor. Lütfen Safari veya Chrome kullanın.");
          return;
        }

        await stopAndClearScanner();

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

            onDetectedRef.current(decodedText);
            setIsOpen(false);
          },
          () => undefined
        );

        if (disposed) {
          await stopAndClearScanner();
          return;
        }

        setError(null);
      } catch (scannerError) {
        console.error(scannerError);

        if (scannerError instanceof DOMException) {
          if (scannerError.name === "NotAllowedError") {
            setError("Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini açın.");
            return;
          }

          if (scannerError.name === "NotFoundError") {
            setError("Kamera bulunamadı. Farklı bir cihaz veya tarayıcı deneyin.");
            return;
          }
        }

        setError("Optik sensör başlatılamadı. Kamera izinlerini ve bağlantıyı kontrol edin.");
      } finally {
        if (isMountedRef.current) {
          setIsTransitioning(false);
        }
      }
    }

    void startScanner();

    return () => {
      disposed = true;

      if (isMountedRef.current) {
        setIsTransitioning(true);
      }

      void stopAndClearScanner().finally(() => {
        if (isMountedRef.current) {
          setIsTransitioning(false);
        }
      });
    };
  }, [isOpen, scannerId, stopAndClearScanner]);

  return (
    <div className="md:hidden">
      <Button
        className={cn(
            "h-14 w-full rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all duration-500",
            isOpen ? "border-rose-400/20 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20" : "border-white/5 bg-white/3 text-white/40 hover:text-white"
        )}
        disabled={disabled || isTransitioning}
        onClick={() => setIsOpen((current) => !current)}
        variant="ghost"
      >
        {isOpen ? (
          <>
            <X className="mr-2 h-4 w-4" />
            Optik Sensörü Kapat
          </>
        ) : (
          <>
            <Barcode className="mr-2 h-4 w-4" />
            Barkod Taramayı Başlat
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
                    <h3 className="font-serif text-xl font-bold tracking-tight text-white">Barkod Tarayıcı</h3>
                    <p className="text-[11px] leading-relaxed text-foreground italic">ISBN barkodunu çerçeveye hizalayın. Algılandığında otomatik olarak taranacaktır.</p>
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
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Tarama işlemi aktif</span>
                    </div>
                )}
            </div>
        </div>
      ) : null}
    </div>
  );
}
