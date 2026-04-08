import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-accent bg-accent text-background hover:border-accent-hover hover:bg-accent-hover",
        secondary:
          "border-border bg-surface-raised text-text-primary hover:border-border/80 hover:bg-surface-elevated",
        ghost:
          "border-transparent bg-transparent text-text-secondary hover:border-border/60 hover:bg-surface-raised hover:text-text-primary",
        destructive:
          "border-destructive bg-destructive/92 text-text-primary hover:bg-destructive"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6",
        icon: "h-10 w-10 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, variant, size, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      type={type}
      {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
