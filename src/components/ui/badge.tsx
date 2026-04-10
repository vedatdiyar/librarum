import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-300",
  {
    variants: {
      variant: {
        primary: "border border-primary/20 bg-primary/10 text-primary",
        accent: "border border-border/20 bg-accent/40 text-text-primary",
        muted: "border border-border/10 bg-surface-raised/30 text-text-secondary/80",
        destructive: "border border-destructive/20 bg-destructive/10 text-destructive",
        success: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
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
