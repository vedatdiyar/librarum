import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const cardVariants = cva(
  "rounded-[24px] border border-border/80 text-text-primary shadow-panel",
  {
    variants: {
      surface: {
        default: "bg-surface",
        raised: "bg-surface-raised"
      }
    },
    defaultVariants: {
      surface: "default"
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface, ...props }, ref) => (
    <div
      className={cn(cardVariants({ surface }), className)}
      ref={ref}
      {...props}
    />
  )
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("flex flex-col space-y-2 p-6", className)} ref={ref} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    className={cn(
      "font-serif-display text-2xl font-semibold tracking-tight text-text-primary",
      className
    )}
    ref={ref}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    className={cn("text-sm leading-6 text-text-secondary", className)}
    ref={ref}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("p-6 pt-0", className)} ref={ref} {...props} />
));

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
