"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, cn } from "@/components/ui";
import { GlobalSearch } from "@/components/global-search";
import { navigationItems } from "@/lib/navigation";

function NavContent({ showLogo = true }: { showLogo?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {showLogo ? (
        <Link className="rounded-[28px] border border-border/70 bg-background/70 p-4 transition hover:bg-background" href="/">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Image alt="Librarum Logo" height={26} src="/logo.svg" width={26} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-[-0.04em] text-text-primary">Librarum</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-text-secondary">
                Library Dashboard
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      <div className={cn("mt-6", showLogo ? "" : "mt-1")}>
        <GlobalSearch compact={!showLogo} />
      </div>

      <div className="mt-8 flex-1">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
          Navigasyon
        </p>

        <nav className="mt-3 flex flex-col gap-1.5">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                className={cn(
                  "group flex items-center gap-3 rounded-[22px] px-3 py-3 transition-all duration-200",
                  isActive
                    ? "bg-card text-text-primary shadow-sm"
                    : "text-text-secondary hover:bg-background/80 hover:text-text-primary"
                )}
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[16px] transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/70 text-text-secondary group-hover:text-primary"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold tracking-[-0.02em]">{item.label}</span>
                </div>

                {isActive ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 rounded-[28px] border border-border/70 bg-background/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
          Yeni Görünüm
        </p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Koleksiyon, keşif ve operasyon akışını daha sade bir dashboard düzeninde birleştirdik.
        </p>
      </div>
    </div>
  );
}

export function AppDesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 py-4 lg:block">
      <div className="glass-elevated flex h-full flex-col rounded-[32px] p-5">
        <NavContent />
      </div>
    </aside>
  );
}

export function AppMobileHeader() {
  return (
    <div className="sticky top-0 z-40 lg:hidden">
      <div className="glass-elevated flex items-center gap-3 rounded-[24px] px-4 py-3">
        <Link className="flex shrink-0 items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-primary text-primary-foreground">
            <Image alt="Librarum Logo" height={22} src="/logo.svg" width={22} />
          </span>
          <span className="text-base font-semibold tracking-[-0.03em] text-text-primary">Librarum</span>
        </Link>

        <div className="min-w-0 flex-1">
          <GlobalSearch compact />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Navigasyonu aç" size="icon" variant="secondary">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent className="p-5" side="left">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigasyon</SheetTitle>
            </SheetHeader>
            <NavContent showLogo={false} />
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
