"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Terminal, Cpu } from "lucide-react";

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
        <SheetContent 
            className="glass-panel overflow-hidden rounded-t-[40px] border-white/10 bg-background/95 px-0 shadow-2xl backdrop-blur-3xl" 
            side="bottom"
        >
          <div className="absolute top-0 left-1/2 mt-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/10" />
          
          <SheetHeader className="border-b border-white/5 px-8 pt-10 pb-7">
            <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                    <Terminal className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Kayıt Düzenleme</p>
                  <SheetTitle className="font-serif text-2xl font-bold tracking-tight text-white">{title}</SheetTitle>
                </div>
            </div>
            <SheetDescription className="max-w-xl text-[13px] leading-relaxed text-foreground/80">{description}</SheetDescription>
          </SheetHeader>
          
          <div className="h-[calc(100vh-210px)] overflow-y-auto px-8 pt-6 pb-12">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="glass-panel max-h-[95vh] w-[min(94vw,1000px)] overflow-hidden rounded-[40px] border-white/10 bg-background/95 p-0 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] backdrop-blur-3xl duration-500 animate-in zoom-in-95">
        <div className="flex h-full flex-col">
            <DialogHeader className="relative space-y-4 border-b border-white/5 p-10 pb-7">
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                        <Cpu className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold tracking-[0.24em] text-primary uppercase">Kayıt Düzenleme</p>
                        <DialogTitle className="font-serif text-4xl font-bold tracking-tight text-white">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="max-w-2xl text-sm leading-relaxed text-foreground/80">
                            {description}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-10 pt-6 pb-10">
                {children}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
