import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
  {
    variants: {
      variant: {
        accent: "border-accent/30 bg-accent/12 text-accent",
        muted: "border-border/80 bg-surface-raised text-text-secondary",
        destructive: "border-destructive/30 bg-destructive/12 text-destructive",
        success: "border-success/30 bg-success/12 text-success"
      }
    },
    defaultVariants: {
      variant: "muted"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
