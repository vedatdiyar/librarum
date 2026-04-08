import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        aria-label={props["aria-label"] || "Giriş alanı"}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
