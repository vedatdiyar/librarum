"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

function Tabs({ children, value, onValueChange, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border/70 bg-muted/70 p-1",
        className
      )}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = context.value === value;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-semibold tracking-[-0.02em] transition-all duration-200",
        isActive
          ? "bg-card text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary",
        className
      )}
      onClick={() => context.onValueChange(value)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export { Tabs, TabsList, TabsTrigger };
