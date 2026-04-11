"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ChartFrame({
  height,
  className,
  children
}: {
  height: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className={cn("w-full min-w-0", className)} style={{ height, minHeight: height }}>
      {isReady ? (
        children
      ) : (
        <div aria-hidden className="h-full w-full" />
      )}
    </div>
  );
}
