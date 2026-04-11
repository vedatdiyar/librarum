"use client";

import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui";
import { GlobalSearch } from "./global-search";
import { signOut } from "next-auth/react";

export function AppDesktopHeader() {
  return (
    <header className="sticky top-0 z-40 hidden h-[72px] items-center border-b border-white/5 bg-background/50 px-8 backdrop-blur-xl lg:flex">
      <div className="flex w-full items-center justify-between">
        {/* Minimal System Status */}
        <div className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/1 px-3 py-1.5 transition-all duration-500 hover:border-white/10 hover:bg-white/2">
          <div className="relative h-2 w-2">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40" />
            <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[11px] font-bold text-foreground uppercase">Sistem Çevrimiçi</span>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch expandable />
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="group h-11 w-11 rounded-xl border border-white/5 bg-white/2 p-0 transition-all duration-300 hover:scale-105 hover:border-white/10 hover:bg-white/5 active:scale-95">
              <Settings className="h-5 w-5 text-foreground/70 transition-colors group-hover:text-primary" />
            </Button>

            <Button variant="ghost" className="flex h-11 items-center gap-3 rounded-xl border border-white/5 bg-white/2 pr-4 pl-1.5 transition-all duration-300 hover:scale-[1.02] hover:border-white/10 hover:bg-white/5 active:scale-[0.98]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground/70">
                 <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[13px] font-bold tracking-tight text-white/90">Vedat Diyar</span>
                <span className="mt-0.5 text-[10px] font-medium tracking-widest text-foreground uppercase">Arşivci</span>
              </div>
            </Button>

            <Button 
              variant="ghost" 
              className="group h-11 w-11 rounded-xl border border-white/5 bg-white/2 p-0 transition-all duration-300 hover:scale-105 hover:border-white/10 hover:bg-white/5 active:scale-95"
              onClick={() => signOut({ redirectTo: "/login" })}
            >
              <LogOut className="h-5 w-5 text-foreground/70 transition-colors group-hover:text-primary" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
