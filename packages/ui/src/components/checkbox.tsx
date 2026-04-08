"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, className, ...props }, ref) => (
    <label
      className={cn(
        "relative inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-surface-raised transition hover:border-border",
        checked ? "border-accent bg-accent text-background" : "text-transparent",
        className
      )}
    >
      <input
        aria-label={props["aria-label"] || "Seçim"}
        checked={checked}
        className="sr-only"
        ref={ref}
        type="checkbox"
        {...props}
      />
      <Check className="h-3.5 w-3.5" />
    </label>
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
