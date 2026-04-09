import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[28px] border border-border/70 text-text-primary transition-all duration-300",
  {
    variants: {
      surface: {
        default: "bg-card/92 shadow-sm",
        raised: "bg-card shadow-lg"
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
  <div className={cn("flex flex-col space-y-2 p-6 md:p-8", className)} ref={ref} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    className={cn(
      "font-sans text-xl font-semibold tracking-[-0.045em] text-text-primary md:text-[1.7rem]",
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
  <div className={cn("p-6 pt-0 md:px-8 md:pb-8", className)} ref={ref} {...props} />
));

CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
