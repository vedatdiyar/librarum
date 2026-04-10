"use client";

import * as React from "react";
import { 
  Calendar, 
  ChevronRight, 
  History, 
  Clock,
  LayoutDashboard
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  cn
} from "@/components/ui";
import { useIsMobile } from "@/hooks/use-is-mobile";

export type HistoryItem = {
  id: string;
  generatedAt: Date | string;
};

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  onSelectReport: (id: string) => void;
  selectedId?: string;
}

export function HistoryDrawer({
  open,
  onOpenChange,
  history,
  onSelectReport,
  selectedId
}: HistoryDrawerProps) {
  const isMobile = useIsMobile();

  // Group history by month
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    
    // Sort history by date descending
    const sorted = [...history].sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    sorted.forEach((item) => {
      const date = new Date(item.generatedAt);
      const month = date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(item);
    });

    return Object.entries(groups);
  }, [history]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className={cn(
          "glass-panel gap-0 overflow-y-auto border-white/10 bg-background/95 p-0 shadow-2xl backdrop-blur-3xl",
          isMobile ? "h-[88vh] w-full rounded-t-[40px]" : "w-full max-w-[480px] rounded-l-[40px]"
        )}
        side={isMobile ? "bottom" : "right"}
      >
        <div className="flex min-h-full flex-col">
          <div className="border-b border-white/5 p-8 md:p-12">
            <SheetHeader className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                    <History className="h-6 w-6" />
                 </div>
                 <SheetTitle className="font-serif text-3xl font-bold tracking-tight text-white">Rapor Arşivi</SheetTitle>
              </div>
              <SheetDescription className="text-[13px] leading-relaxed text-foreground">
                Daha önce oluşturulmuş tüm akıllı analizlere buradan ulaşabilirsiniz. 
                Her rapor o anki kütüphane durumunuzu yansıtır.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="space-y-12 p-8 pb-24 md:p-12">
            {groupedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 rounded-full bg-white/5 p-6 text-foreground/20">
                  <Clock className="h-12 w-12" />
                </div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">Henüz kaydedilmiş bir rapor bulunamadı.</p>
              </div>
            ) : (
              groupedHistory.map(([month, items]) => (
                <div key={month} className="space-y-4">
                  <h4 className="flex items-center gap-2 px-1 text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
                    <Calendar className="h-3 w-3" />
                    {month}
                  </h4>
                  <div className="grid gap-3">
                    {items.map((item) => {
                      const date = new Date(item.generatedAt);
                      const isSelected = selectedId === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectReport(item.id);
                            onOpenChange(false);
                          }}
                          className={cn(
                            "group flex items-center justify-between rounded-2xl border p-4 transition-all duration-500",
                            isSelected 
                              ? "border-primary/40 bg-primary/5" 
                              : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5"
                          )}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className={cn(
                              "text-sm font-medium transition-colors",
                              isSelected ? "text-primary" : "text-white/80 group-hover:text-white"
                            )}>
                              {date.toLocaleDateString("tr-TR", { 
                                day: "numeric", 
                                month: "long",
                                weekday: "long"
                              })}
                            </span>
                            <span className="text-[10px] text-foreground/60">
                              Saat: {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-all duration-500",
                            isSelected ? "translate-x-1 text-primary" : "text-white/20 group-hover:translate-x-1 group-hover:text-white/40"
                          )} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
