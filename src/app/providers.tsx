"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

type ProvidersProps = {
  children: React.ReactNode;
  session: Session | null;
};

export function Providers({ children, session }: ProvidersProps) {
  React.useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    const isRechartsSizeWarning = (args: unknown[]) => {
      const text = args
        .map((arg) => {
          if (typeof arg === "string") {
            return arg;
          }

          if (arg instanceof Error) {
            return arg.message;
          }

          return "";
        })
        .join(" ")
        .toLowerCase();

      return (
        text.includes("of chart should be greater than 0") &&
        text.includes("please check the style of container")
      );
    };

    console.error = (...args: unknown[]) => {
      if (isRechartsSizeWarning(args)) {
        return;
      }

      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      if (isRechartsSizeWarning(args)) {
        return;
      }

      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
