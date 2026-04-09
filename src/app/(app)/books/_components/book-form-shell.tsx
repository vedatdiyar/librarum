"use client";

import * as React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui";
import { useIsMobile } from "@/hooks/use-is-mobile";

type BookFormShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function BookFormShell({
  open,
  onOpenChange,
  title,
  description,
  children
}: BookFormShellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        <SheetContent className="overflow-hidden" side="bottom">
          <SheetHeader className="pb-4 pr-10">
            <SheetTitle>{title}</SheetTitle>
            <p className="text-sm leading-6 text-text-secondary">{description}</p>
          </SheetHeader>
          <div className="overflow-y-auto pb-2">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[95vh] w-[min(94vw,1000px)] border-primary/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        <DialogHeader className="pr-10 pb-6 pt-8">
          <DialogTitle className="font-display text-3xl font-bold tracking-tight text-primary/90">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-base text-text-secondary/70">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="px-8 pb-10">{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
