import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        aria-label={props["aria-label"] || "Giriş alanı"}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-border/80 bg-card px-4 py-2 text-[15px] font-medium text-text-primary outline-none transition-all duration-200 placeholder:text-text-secondary/55 focus:border-primary/60 focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50",
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
