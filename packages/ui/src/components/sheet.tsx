"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-background/72",
      className
    )}
    {...props}
    ref={ref}
  />
));

SheetOverlay.displayName = Dialog.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 flex flex-col border-border/80 bg-surface shadow-shell",
  {
    variants: {
      side: {
        left: "inset-y-0 left-0 w-full max-w-[300px] border-r p-6",
        right: "inset-y-0 right-0 w-full max-w-[560px] border-l p-6",
        bottom:
          "bottom-0 left-0 right-0 max-h-[88vh] rounded-t-[24px] border-t p-5 pt-3"
      }
    },
    defaultVariants: {
      side: "left"
    }
  }
);

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> &
    VariantProps<typeof sheetVariants>
>(({ className, children, side, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Content
      className={cn(
        sheetVariants({ side }),
        className
      )}
      {...props}
      ref={ref}
    >
      {side === "bottom" ? (
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-border" />
      ) : null}
      {children}
      <Dialog.Close className="absolute right-4 top-4 rounded-md border border-transparent p-2 text-text-secondary transition hover:border-border/60 hover:bg-surface-raised hover:text-text-primary">
        <X className="h-5 w-5" />
        <span className="sr-only">Kapat</span>
      </Dialog.Close>
    </Dialog.Content>
  </SheetPortal>
));

SheetContent.displayName = Dialog.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2", className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    className={cn(
      "font-serif-display text-xl font-semibold text-text-primary",
      className
    )}
    {...props}
    ref={ref}
  />
));

SheetTitle.displayName = Dialog.Title.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
};
