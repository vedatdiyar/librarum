import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-md",
        secondary:
          "border border-border/80 bg-card text-text-primary hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-sm",
        ghost:
          "border border-transparent bg-transparent text-text-secondary hover:bg-muted/60 hover:text-text-primary",
        destructive:
          "border border-destructive/20 bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/92"
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11"
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
