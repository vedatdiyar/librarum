"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox, Input } from "@exlibris/ui";
import { Field } from "./kunye-section";
import type { BookStatus } from "@exlibris/types";

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
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Durum">
          <select
            aria-label="Durum"
            className={FIELD_CLASS_NAME}
            {...register("status")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field error={errors.loanedTo?.message as string} label="Odunc Verilen Kisi">
          <Input
            {...register("loanedTo")}
            disabled={status !== "loaned"}
            placeholder="Sadece odunc durumunda zorunlu"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Alan Adi">
          <Input {...register("locationName")} placeholder="Salon" />
        </Field>
        <Field error={errors.shelfRow?.message as string} label="Raf">
          <Input {...register("shelfRow")} maxLength={1} placeholder="A" />
        </Field>
        <Field error={errors.shelfColumn?.message as string} label="Sutun">
          <Input {...register("shelfColumn")} inputMode="numeric" placeholder="3" />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field error={errors.copyCount?.message as string} label="Kopya Sayisi">
          <Input {...register("copyCount")} inputMode="numeric" placeholder="1" />
        </Field>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <Checkbox
            checked={isDonatable}
            onChange={(event) => setValue("donatable", event.target.checked, { shouldDirty: true })}
          />
          <span className="text-sm font-medium text-text-primary">Bagislanabilir</span>
        </label>
      </div>
    </>
  );
}
