'use client';

import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * 404 - Not Found Page
 * Shown when a user accesses an invalid URL.
 * Premium design: Glassmorphism effect, background image and animations.
 */
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    document.title = "404 - Bulunamadı | Librarum";
  }, []);

  return (
    <div className="fixed inset-0 z-100 flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background font-sans">
      {/* Background Image - With overlay and blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 brightness-95 contrast-125 saturate-125"
        style={{ backgroundImage: 'url("/backgrounds/404bg.webp")' }}
      />

      {/* Decorative Gradient Layer */}
      <div className="absolute inset-0 z-10 bg-linear-to-b from-background/5 via-background/20 to-background/55" />

      {/* Content Container - Glassmorphism Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 flex w-full max-w-md flex-col items-center px-6"
      >
        <div className="glass-panel flex flex-col items-center rounded-4xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text font-serif text-8xl font-black tracking-tighter text-transparent"
          >
            404
          </motion.h1>

          <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight text-foreground">
            Burası biraz fazla sessiz...
          </h2>

          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            Aradığın sayfa bulunamadı. Taşınmış olabilir ya da adres hatalı
            girilmiş olabilir. Endişe etme, tek tıkla güvenli bölgeye
            dönebilirsin.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                // In Next.js, window.history.length can be used but usually router.back() is enough
                // or we can check if there is a previous page in some state.
                // For simplicity, we use history.length check if possible or just router.back()
                if (typeof window !== 'undefined' && window.history.length > 2) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              <ArrowLeft className="size-4" />
              Geri Dön
            </button>

            <button
              onClick={() => router.push("/")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <Home className="size-4" />
              Ana Sayfa
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase"
        >
          Librarum
        </motion.p>
      </motion.div>
    </div>
  );
}
