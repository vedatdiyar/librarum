"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import * as React from "react";
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, cn } from "@/components/ui";
import { GlobalSearch } from "@/components/global-search";
import { navigationItems } from "@/lib/navigation";
import { Branding } from "./branding";

function NavContent({ 
  showSearch = true, 
  onClose,
  isCollapsed = false
}: { 
  showSearch?: boolean; 
  onClose?: () => void;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col py-6">
      {showSearch && !isCollapsed && (
        <div className="mb-8 px-4 duration-300 animate-in fade-in">
          <GlobalSearch />
        </div>
      )}

      <div className="flex-1 space-y-1 px-3 pt-5">
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                className={cn(
                  "group relative flex items-center gap-1 rounded-xl px-3 py-2.5 transition-all duration-500",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-white/4 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
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
                      ? "border border-primary/20 bg-primary/10 text-primary"
                      : "bg-transparent text-foreground group-hover:scale-110 group-hover:text-primary"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1 duration-500 animate-in fade-in slide-in-from-left-2">
                    <span className="block text-sm font-bold text-foreground">{item.label}</span>
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
          <NavContent isCollapsed={isCollapsed} showSearch={false} />
        </div>

        {/* Toggle Button at the bottom */}
        <div className="mt-auto border-t border-white/5 px-3 py-4">
          <button
            onClick={toggleSidebar}
            className={cn(
              "group relative flex w-full items-center justify-start gap-1 rounded-xl px-3 py-2.5 text-foreground transition-all duration-500 hover:bg-white/2 hover:text-white",
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
                <span className="block text-sm font-bold text-foreground">{isCollapsed ? "Genişlet" : "Daralt"}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppMobileHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="sticky top-0 z-50 lg:hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <Branding className="px-0" showSubtitle={false} />

        <Sheet onOpenChange={setOpen} open={open}>
          <SheetTrigger asChild>
            <Button className="h-10 w-10 rounded-xl border-white/10 bg-white/3 p-0 transition-all hover:bg-white/8" variant="ghost">
              <Menu className="h-5 w-5 text-white/70" />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[240px] border-r-white/10 bg-background p-0 backdrop-blur-2xl" side="left">
            <SheetHeader className="sr-only">
              <SheetTitle>Gezinti</SheetTitle>
              <SheetDescription>Ana navigasyon menüsü</SheetDescription>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <div className="flex h-[72px] items-center justify-center border-b border-white/5 px-6">
                <Branding className="px-0" showSubtitle={false} />
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavContent onClose={() => setOpen(false)} showSearch={true} />
              </div>
            </div>
            <Button 
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 h-10 w-10 rounded-xl border-white/10 bg-white/3 p-0 hover:bg-white/8"
                variant="ghost"
            >
                <X className="h-5 w-5 text-white/50" />
            </Button>
          </SheetContent>
        </Sheet>
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

