import { AppDesktopSidebar, AppMobileHeader } from "./app-sidebar";
import { AppDesktopHeader } from "./app-header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame min-h-screen bg-background selection:bg-primary/20">
      <div className="flex min-h-screen">
        <AppDesktopSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppMobileHeader />
          <AppDesktopHeader />

          <main className="flex-1">
            <div className="page-container duration-300 animate-in fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

