"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox, Input, cn } from "@/components/ui";
import { Field } from "./kunye-section";
import type { BookStatus } from "@/types";

const FIELD_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-border/80 bg-surface px-4 py-2 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent/80 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_OPTIONS: Array<{ value: BookStatus; label: string }> = [
  { value: "owned", label: "Sahibim" },
  { value: "completed", label: "Okudum" },
  { value: "abandoned", label: "Yarim Biraktim" },
  { value: "loaned", label: "Odunc Verdim" },
  { value: "lost", label: "Kayip" }
];

export function DurumKonumSection() {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const status = watch("status");
  const isDonatable = watch("donatable");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Güncel Durum" description="Kitabın kütüphanenizdeki aktif durumunu seçin.">
          <select
            aria-label="Durum"
            className={cn(FIELD_CLASS_NAME, "cursor-pointer appearance-none bg-surface")}
            {...register("status")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option className="bg-surface" key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field 
          error={errors.loanedTo?.message as string} 
          label="Ödünç Verilen Kişi"
          description="Eğer ödünçteyse kime verildiğini belirtin."
        >
          <Input
             className="bg-surface"
            {...register("loanedTo")}
            disabled={status !== "loaned"}
            placeholder="Kişi ismi girin..."
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Konum / Alan" description="Kitaplık veya oda adı.">
          <Input className="bg-surface" {...register("locationName")} placeholder="Örn: Salon" />
        </Field>
        <Field error={errors.shelfRow?.message as string} label="Raf No" description="A'dan Z'ye.">
          <Input className="bg-surface" {...register("shelfRow")} maxLength={1} placeholder="A" />
        </Field>
        <Field error={errors.shelfColumn?.message as string} label="Sütun No" description="1'den 9'a.">
          <Input className="bg-surface" {...register("shelfColumn")} inputMode="numeric" placeholder="3" />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field 
          error={errors.copyCount?.message as string} 
          label="Kopya Adedi"
          description="Aynı kitaptan kaç adet var?"
        >
          <Input className="bg-surface" {...register("copyCount")} inputMode="numeric" placeholder="1" />
        </Field>
        <div className="flex h-[88px] items-center">
          <label className="flex w-full cursor-pointer items-center gap-3 rounded-[22px] border border-border/60 bg-surface/40 px-5 py-4 transition-all hover:bg-surface/60">
            <Checkbox
              checked={isDonatable}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue("donatable", e.target.checked, { shouldDirty: true })}
            />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold uppercase tracking-wider text-text-primary">Bağışlanabilir</span>
              <span className="text-[11px] text-text-secondary/70 italic">Bu kitap listeden çıkarılabilir.</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
