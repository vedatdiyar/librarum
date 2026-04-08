"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="app-frame">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-4 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1320px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
