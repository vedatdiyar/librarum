"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Badge, Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, cn } from "@exlibris/ui";
import { GlobalSearch } from "@/components/global-search";
import { navigationItems } from "@/lib/navigation";

function NavContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 pb-6">
        <Link className="inline-flex flex-col gap-4" href="/">
          <Image alt="ExLibris Logo" height={40} src="/logo.svg" width={40} />
          <div className="flex flex-col gap-1">
            <span className="font-display text-[2rem] font-semibold tracking-tight text-text-primary">
              ExLibris
            </span>
            <span className="text-[11px] uppercase tracking-[0.26em] text-text-secondary">
              Personal Library OS
            </span>
          </div>
        </Link>

        <div className="mt-5">
          <GlobalSearch />
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1.5">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              className={cn(
                "group flex items-center justify-between rounded-[18px] border px-4 py-3 transition",
                isActive
                  ? "border-border/80 bg-surface-elevated text-text-primary"
                  : "border-transparent text-text-secondary hover:border-border/60 hover:bg-surface-raised hover:text-text-primary"
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </span>
              {isActive ? <Badge variant="muted">Open</Badge> : null}
            </Link>
          );
        })}
      </nav>

      <div className="panel-muted p-4">
        <p className="font-display text-lg text-text-primary">Kütüphane akışı</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Kitaplar, seriler, ödünç hareketleri ve AI önerileri bu navigasyon
          üzerinden tek akışta yönetilir.
        </p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <>
      <aside className="hidden h-screen w-64 flex-col border-r border-border/80 bg-surface px-5 py-6 lg:flex">
        <NavContent />
      </aside>

      <div className="flex items-center justify-between border-b border-border/80 bg-surface px-4 py-4 lg:hidden">
        <div className="min-w-0 flex-1 pr-3">
          <GlobalSearch compact />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Navigasyonu aç" size="icon" variant="secondary">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0">
            <div className="h-full px-5 py-6">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasyon</SheetTitle>
              </SheetHeader>
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
