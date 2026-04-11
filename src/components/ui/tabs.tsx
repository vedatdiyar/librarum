"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";

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
  const isMobile = useIsMobile();
  const context = React.useContext(TabsContext);

  // children: TabsTrigger[]
  const triggers = React.Children.toArray(children).filter(Boolean);

  if (isMobile && triggers.length > 3 && context) {
    const getLabel = (child: React.ReactNode): string => {
      let label = "";
      React.Children.forEach(child, (c) => {
        if (typeof c === "string" || typeof c === "number") {
          label += c;
        } else if (React.isValidElement(c) && (c.props as any).children) {
          label += getLabel((c.props as any).children);
        }
      });
      return label.trim() || "Tab";
    };

    return (
      <div className="group/select relative mb-4 w-full">
        <select
          aria-label="Select tab"
          className={cn(
            "block w-full appearance-none rounded-2xl border border-white/10 bg-white/5",
            "h-12 px-6 text-[14px] font-bold tracking-wide text-white focus:ring-2 focus:ring-primary/50 focus:outline-none",
            "cursor-pointer shadow-2xl transition-all duration-300 hover:bg-white/8"
          )}
          value={context.value}
          onChange={e => context.onValueChange(e.target.value)}
        >
          {triggers.map((trigger: any) => (
            <option key={trigger.props.value} value={trigger.props.value} className="bg-[#1a1a1a] text-white">
              {getLabel(trigger.props.children)}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-white/30 transition-transform duration-300 group-hover/select:translate-y-[-40%]">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    );
  }
  // Normalde scrollable tab bar
  return (
    <div
      className={cn(
        "inline-flex max-w-full overflow-hidden rounded-full border border-border/70 bg-muted/70 p-1 whitespace-nowrap",
        className
      )}
      tabIndex={0}
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
