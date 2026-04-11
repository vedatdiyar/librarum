"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
      "fixed inset-0 z-50 bg-foreground/12 backdrop-blur-sm",
      className
    )}
    {...props}
    ref={ref}
  />
));

SheetOverlay.displayName = Dialog.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 flex flex-col border border-border/70 bg-card shadow-xl",
  {
    variants: {
      side: {
        top: "inset-x-4 top-4 h-fit max-h-[92vh] rounded-[28px] p-6 pb-4",
        left: "inset-y-4 left-4 w-[calc(100%-2rem)] max-w-[320px] rounded-[28px] p-6",
        right: "inset-y-4 right-4 w-[calc(100%-2rem)] max-w-[560px] rounded-[28px] p-6",
        rightFull: "inset-y-0 right-0 h-full w-[280px] p-6 pt-16",
        bottom:
          "right-4 bottom-4 left-4 max-h-[88vh] rounded-[28px] p-5 pt-3",
        full: "inset-0 h-full w-full rounded-none border-none p-0"
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
      aria-describedby={props["aria-describedby"] || undefined}
    >
      {side === "bottom" ? (
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-border" />
      ) : null}
      {children}
      <Dialog.Close className="absolute top-4 right-4 rounded-full border border-transparent p-2 text-text-secondary transition hover:border-border/70 hover:bg-muted hover:text-text-primary">
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
      "font-sans text-lg font-semibold tracking-[-0.02em] text-text-primary",
      className
    )}
    {...props}
    ref={ref}
  />
));

SheetTitle.displayName = Dialog.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    className={cn("text-sm text-text-secondary", className)}
    {...props}
    ref={ref}
  />
));

SheetDescription.displayName = Dialog.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
};
