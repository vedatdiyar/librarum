"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { 
  Checkbox, 
  Input, 
  cn, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui";
import { Field } from "./publication-info-section";
import { MapPin, User, Hash, Box, Heart } from "lucide-react";
import type { BookStatus } from "@/types";

import { BOOK_FORM_STATUS_OPTIONS } from "@/lib/constants/books";

const STATUS_OPTIONS = BOOK_FORM_STATUS_OPTIONS;

export function StatusLocationSection() {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext();
  const status = watch("status");
  const isDonatable = watch("donatable");

  // Ödünç verildi seçilirse location alanlarını boşalt
  React.useEffect(() => {
    if (status === "loaned") {
      setValue("locationName", "", { shouldDirty: false });
      setValue("shelfRow", "", { shouldDirty: false });
    }
  }, [status, setValue]);

  return (
    <div className="space-y-12 duration-700 animate-in fade-in">
      <div className="grid gap-10 md:grid-cols-2">
        <Field id="status" label="DURUM" description="Kitabın kütüphane içindeki güncel durumu.">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="status" className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8">
                  <Box className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
                  <SelectValue placeholder="Durum seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field 
          error={errors.loanedTo?.message as string} 
          id="loanedTo"
          label="ÖDÜNÇ ALAN / EMANET EDİLEN"
          description="Şu anda bu kitabı elinde tutan dış kişiyi tanımlayın."
        >
          <div className="relative">
            <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input
                className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8 disabled:opacity-20"
                {...register("loanedTo")}
                disabled={status !== "loaned"}
                id="loanedTo"
                placeholder="Ödünç alanın kimliği..."
            />
          </div>
        </Field>
      </div>

      <div className="group/location glass-panel relative overflow-hidden rounded-[40px] border-white/5 bg-white/1 p-8 transition-all duration-700 hover:border-white/10">
        <div className="mb-8 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">KONUM BİLGİSİ</span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            <Field id="locationName" label="BÖLÜM / ODA" description="Kitabın bulunduğu alan.">
                <Input 
                    className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8 disabled:opacity-20" 
                    {...register("locationName")}
                    disabled={status === "loaned"}
                    id="locationName"
                    placeholder="örn. Ana Arşiv" 
                />
            </Field>
            <Field error={errors.shelfRow?.message as string} id="shelfRow" label="RAF" description="Yatay raf kodu (A-Z).">
                <Input 
                    className="h-12 rounded-xl border-white/5 bg-white/2 text-center text-sm font-bold uppercase shadow-inner hover:bg-white/4 focus:bg-white/8 disabled:opacity-20" 
                    {...register("shelfRow")}
                    disabled={status === "loaned"}
                    id="shelfRow"
                    maxLength={1} 
                    placeholder="A" 
                />
            </Field>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Field 
          error={errors.copyCount?.message as string} 
          id="copyCount"
          label="KOPYA SAYISI"
          description="Toplam kayıtlı kopya bilgisi."
        >
          <div className="relative">
            <Hash className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input 
                className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8" 
                {...register("copyCount")} 
                id="copyCount"
                inputMode="numeric" 
                type="number"
                min="1"
                placeholder="1" 
            />
          </div>
        </Field>

        <Field 
          id="donatable"
          label="TAKAS / HİBE"
          description="Yeniden dağıtıma uygunluk durumu."
        >
          <label className="glass-panel group/toggle flex h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border-white/5 bg-white/1 px-6 transition-all hover:border-white/10 hover:bg-white/4" htmlFor="donatable">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-500",
                    isDonatable ? "border-emerald-400 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]" : "border-white/10 bg-white/2"
                )}>
                    <Checkbox
                        checked={isDonatable}
                        className="absolute opacity-0"
                        id="donatable"
                        name="donatable"
                        onCheckedChange={(checked: boolean) => setValue("donatable", !!checked, { shouldDirty: true })}
                    />
                    <Heart className={cn("h-3 w-3 transition-all", isDonatable ? "scale-100 fill-black text-black" : "scale-0 text-white/10")} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase transition-colors group-hover/toggle:text-white">
                  {isDonatable ? "BAĞIŞA UYGUN İŞARETLENDİ" : "BAĞIŞA UYGUN OLARAK İŞARETLE"}
                </span>
            </div>
          </label>
        </Field>
      </div>
    </div>
  );
}
