"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, User as UserIcon, X } from "lucide-react";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, cn } from "@/components/ui";
import { GlobalSearch } from "@/components/global-search";
import { navigationItems } from "@/lib/navigation";
import { Branding } from "./branding";

function NavContent({ 
  onClose,
  isCollapsed = false,
  isMobile = false
}: { 
  onClose?: () => void;
  isCollapsed?: boolean;
  isMobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-4">
        <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/40 uppercase">Ana Menü</p>
      </div>

      <div className="flex-1 space-y-1 px-3">
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                className={cn(
                  "group relative flex flex-nowrap items-center gap-1 overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-500",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-[#2a2320] text-[#E8D9BD] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "text-foreground hover:bg-white/2 hover:text-white"
                )}
                href={item.href}
                key={item.href}
                onClick={onClose}
                prefetch={false}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500",
                    isActive
                      ? "text-[#E8D9BD]"
                      : "bg-transparent text-foreground group-hover:scale-110 group-hover:text-primary"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1 duration-500 animate-in fade-in slide-in-from-left-2">
                    <span className={cn(
                      "block truncate text-sm font-bold whitespace-nowrap",
                      isActive ? "text-[#E8D9BD]" : "text-foreground"
                    )}>{item.label}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

import { useUIStore } from "@/stores/ui-store";

export function AppDesktopSidebar() {
  const { isSidebarCollapsed: isCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const pathname = usePathname();

  // Auto-collapse on specific pages, but otherwise rely on store persistence
  React.useEffect(() => {
    if (pathname === "/books/new") {
      setSidebarCollapsed(true);
    }
  }, [pathname, setSidebarCollapsed]);

  return (
    <aside 
      className={cn(
        "sticky top-0 z-50 hidden h-screen min-h-screen shrink-0 self-start border-r border-white/5 bg-background/50 backdrop-blur-3xl transition-all duration-500 lg:block",
        isCollapsed ? "w-[84px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Branding section with fixed height and bottom border to intersect with header */}
        <div className="flex h-[72px] items-center justify-center border-b border-white/5">
          <Branding isCollapsed={isCollapsed} showSubtitle={false} />
        </div>
        
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <NavContent isCollapsed={isCollapsed} />
        </div>

        {/* Toggle Button at the bottom */}
        <div className="mt-auto border-t border-white/5 px-3 py-4">
          <button
            onClick={toggleSidebar}
            className={cn(
              "group relative flex w-full flex-nowrap items-center justify-start gap-1 overflow-hidden rounded-xl px-3 py-2.5 text-foreground transition-all duration-500 hover:bg-white/2 hover:text-white",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Genişlet" : "Daralt"}
          >
            <span className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-foreground transition-all duration-500 group-hover:scale-110 group-hover:text-primary",
                isCollapsed && "group-hover:bg-white/5"
            )}>
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </span>
            {!isCollapsed && (
              <div className="min-w-0 duration-500 animate-in fade-in slide-in-from-left-2">
                <span className="block truncate text-sm font-bold whitespace-nowrap text-foreground">{isCollapsed ? "Genişlet" : "Daralt"}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppMobileHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 lg:hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-background/80 px-4 py-4 backdrop-blur-xl">
        <Branding className="px-0" showSubtitle={false} />
        <div className="flex items-center gap-2">
          {/* Sadece ikon, tıklanınca arama açılır */}
          <Button
            className="h-10 w-10 rounded-xl border-white/10 bg-white/3 p-0 transition-all hover:bg-white/8"
            variant="ghost"
            aria-label="Ara"
            onClick={() => setSearchOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-white/70">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </Button>
          <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
            <SheetTrigger asChild>
              <Button className="h-10 w-10 rounded-xl border-white/10 bg-white/3 p-0 transition-all hover:bg-white/8" variant="ghost">
                <Menu className="h-5 w-5 text-white/70" />
              </Button>
            </SheetTrigger>

            <SheetContent
              className="w-[280px] overflow-hidden border-none bg-[#111111] p-0 shadow-2xl"
              side="rightFull"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Gezinti</SheetTitle>
                <SheetDescription>Ana navigasyon menüsü</SheetDescription>
              </SheetHeader>
              
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex h-[72px] items-center justify-between border-b border-white/5 pr-4 pl-2">
                  <Branding className="px-0" showSubtitle={false} />
                  <Button 
                    onClick={() => setMenuOpen(false)}
                    className="h-9 w-9 rounded-xl bg-[#2a2320] p-0 hover:bg-[#3a2e2b]"
                    variant="ghost"
                  >
                    <X className="h-4 w-4 text-white/70" />
                  </Button>
                </div>

                {/* Navigation scroll area */}
                <div className="flex-1 overflow-y-auto pt-2">
                  <NavContent onClose={() => setMenuOpen(false)} isMobile />
                </div>

                {/* User Section at the bottom */}
                <div className="mt-auto space-y-4 border-t border-white/5 bg-[#111111] p-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#2a2320] p-3 shadow-lg">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#3a2e2b] text-[#E8D9BD]">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[15px] font-bold text-white/90">Vedat Diyar</span>
                      <span className="truncate text-[11px] font-medium text-foreground italic">Arşivci</span>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="flex h-14 w-full flex-col gap-1 rounded-2xl border border-white/5 bg-white/2 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                    onClick={() => signOut({ redirectTo: "/login" })}
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Çıkış Yap</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetContent 
              side="full" 
              className="flex flex-col bg-[#0a0a0a]/98 backdrop-blur-2xl"
            >
              <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/5 pr-14 pl-6">
                <SheetTitle className="text-lg font-bold tracking-tight text-white/90">Kütüphanede Ara</SheetTitle>
              </div>
              
              <div className="custom-scrollbar flex-1 overflow-y-auto p-4 pt-6">
                <div className="mx-auto w-full max-w-2xl">
                  <GlobalSearch 
                    mobile 
                    preventAutoFocus={false} 
                    className="w-full"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <>
      <AppDesktopSidebar />
      <AppMobileHeader />
    </>
  );
}

