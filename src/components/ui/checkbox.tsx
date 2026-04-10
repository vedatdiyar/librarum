"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          "relative inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-white bg-surface-raised/75 transition-colors duration-150 hover:border-white/40",
          checked ? "border-primary bg-primary text-primary-foreground" : "text-transparent",
          className
        )}
      >
        <input
          aria-label={props["aria-label"] || "Seçim"}
          checked={checked}
          className="sr-only"
          onChange={handleChange}
          ref={ref}
          type="checkbox"
          {...props}
        />
        <Check className="h-3.5 w-3.5" />
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
