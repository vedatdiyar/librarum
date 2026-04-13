"use client";

import { LogOut, PanelLeftClose, PanelLeftOpen, Settings, User } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { GlobalSearch } from "./global-search";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/stores/ui-store";
 
export function AppDesktopHeader() {
  const { data: session } = useSession();
  const { isSidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-40 hidden h-[72px] items-center border-b border-white/5 bg-background/50 pr-8 pl-2 backdrop-blur-xl lg:flex">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="group relative flex items-center justify-center rounded-xl p-2 text-foreground transition-all duration-500 hover:bg-white/2 hover:text-white"
          title={isCollapsed ? "Genişlet" : "Daralt"}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-foreground transition-all duration-500 group-hover:scale-110 group-hover:bg-white/5 group-hover:text-primary">
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <GlobalSearch expandable />
          <div className="flex items-center gap-2">
            {/* Settings butonu kaldırıldı */}
            <Button variant="ghost" className="flex h-11 items-center gap-3 rounded-xl border border-white/5 bg-white/2 pr-4 pl-1.5 transition-all duration-300 hover:scale-[1.02] hover:border-white/10 hover:bg-white/5 active:scale-[0.98]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground/70">
                 <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[13px] font-bold tracking-tight text-white/90">{session?.user?.name || "Kullanıcı"}</span>
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
