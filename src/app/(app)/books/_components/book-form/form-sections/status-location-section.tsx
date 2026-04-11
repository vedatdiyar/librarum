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
    <div className="space-y-8 md:space-y-12">

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">

        <Field id="status" label="DURUM" description="Kitabın koleksiyon içindeki güncel durumu.">
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
          label="EMANET EDİLEN KİŞİ"
          description="Kitabı ödünç verdiğiniz kişiyi belirtin."
        >
          <div className="relative">
            <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input
                className="h-14 rounded-2xl border-white/5 bg-white/2 pl-12 shadow-inner transition-all hover:bg-white/4 focus:border-primary/40 focus:bg-white/8 disabled:opacity-20"
                {...register("loanedTo")}
                disabled={status !== "loaned"}
                id="loanedTo"
                placeholder="İsim girin..."
            />
          </div>
        </Field>
      </div>

      <div className="group/location glass-panel relative overflow-hidden rounded-[24px] border-white/5 bg-white/1 p-4 transition-all duration-700 hover:border-white/10 md:rounded-[40px] md:p-8">

        <div className="mb-4 flex items-center gap-3 md:mb-8">

            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">KİTAPLIK KONUMU</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8">

            <Field id="locationName" label="BÖLÜM / ODA" description="Kitabın bulunduğu fiziksel alan.">
                <Input 
                    className="h-12 rounded-xl border-white/5 bg-white/2 text-sm shadow-inner hover:bg-white/4 focus:bg-white/8 disabled:opacity-20" 
                    {...register("locationName")}
                    disabled={status === "loaned"}
                    id="locationName"
                    placeholder="örn. Ana Kitaplık" 
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

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">

        <Field 
          error={errors.copyCount?.message as string} 
          id="copyCount"
          label="KOPYA SAYISI"
          description="Mevcut kopya adedi."
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
          <div className="relative">
            <Checkbox
              aria-label="Bağışa uygun olarak işaretle"
              checked={isDonatable}
              className="absolute inset-0 z-10 h-14 w-full rounded-2xl border-white/5 bg-transparent opacity-0"
              id="donatable"
              name="donatable"
              onCheckedChange={(checked: boolean) => setValue("donatable", !!checked, { shouldDirty: true })}
            />
            <div className="glass-panel group/toggle flex h-14 w-full items-center justify-between gap-4 rounded-2xl border-white/5 bg-white/1 px-6 transition-all hover:border-white/10 hover:bg-white/4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-500",
                    isDonatable ? "border-emerald-400 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]" : "border-white/10 bg-white/2"
                  )}
                >
                  <Heart className={cn("h-3 w-3 transition-all", isDonatable ? "scale-100 fill-black text-black" : "scale-0 text-white/10")} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase transition-colors group-hover/toggle:text-white">
                  {isDonatable ? "HİBE/TAKAS İÇİN SEÇİLDİ" : "HİBE/TAKAS İÇİN İŞARETLE"}
                </span>
              </div>
            </div>
          </div>
        </Field>
      </div>
    </div>
  );
}
