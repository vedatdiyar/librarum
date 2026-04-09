import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary border border-primary/20",
        accent: "bg-accent/40 text-text-primary border border-border/20",
        muted: "bg-surface-raised/30 text-text-secondary/80 border border-border/10",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
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
