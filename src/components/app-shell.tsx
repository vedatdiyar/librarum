import { AppDesktopSidebar, AppMobileHeader } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame selection:bg-primary/15">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <AppDesktopSidebar />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AppMobileHeader />

          <main className="flex-1">
            <div className="glass-elevated min-h-full rounded-[32px] px-5 py-5 md:px-8 md:py-8 xl:px-10 xl:py-10">
              <div className="mx-auto w-full max-w-[1240px]">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
