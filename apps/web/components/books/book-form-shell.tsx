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
} from "@exlibris/ui";
import { useIsMobile } from "@/lib/client/use-is-mobile";

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
      <DialogContent>
        <DialogHeader className="pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
