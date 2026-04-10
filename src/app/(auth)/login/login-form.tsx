"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Input, cn } from "@/components/ui";
import { authenticate } from "./actions";
import type { LoginInput } from "@/schemas/auth";
import { loginSchema } from "@/schemas/auth";
import { LoaderCircle, CheckCircle2, ShieldAlert } from "lucide-react";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");

    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("callbackUrl", callbackUrl);

    startTransition(() => {
      void authenticate(formData).then((result) => {
        if (result?.error) {
          setError("root", {
            type: "server",
            message: result.error
          });
        }
      });
    });
  });

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="email">
                E-posta Adresi
            </label>
            <Input
                {...register("email")}
                autoComplete="email"
                id="email"
                placeholder="authority@librarum.io"
                type="email"
                className="h-14 rounded-2xl border-white/5 bg-white/2 shadow-inner transition-all placeholder:italic hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
            />
            {errors.email ? (
                <div className="mt-2 flex items-center gap-2 px-1 text-rose-400">
                    <ShieldAlert className="h-3 w-3" />
                    <p className="text-[10px] font-bold tracking-tight uppercase">{errors.email.message}</p>
                </div>
            ) : null}
        </div>

        <div className="space-y-2">
            <label className="px-1 text-[10px] font-bold tracking-[0.3em] text-foreground uppercase" htmlFor="password">
                Şifre
            </label>
            <Input
                {...register("password")}
                autoComplete="current-password"
                id="password"
                placeholder="••••••••"
                type="password"
                className="h-14 rounded-2xl border-white/5 bg-white/2 shadow-inner transition-all placeholder:italic hover:bg-white/4 focus:border-primary/40 focus:bg-white/8"
            />
            {errors.password ? (
                <div className="mt-2 flex items-center gap-2 px-1 text-rose-400">
                    <ShieldAlert className="h-3 w-3" />
                    <p className="text-[10px] font-bold tracking-tight uppercase">{errors.password.message}</p>
                </div>
            ) : null}
        </div>
      </div>

      {errors.root ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-rose-400 duration-500 animate-in zoom-in-95">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
            <p className="text-[11px] leading-relaxed font-bold tracking-tight uppercase">{errors.root.message}</p>
        </div>
      ) : null}

      <Button
        className="h-14 w-full rounded-2xl bg-white text-[11px] font-bold tracking-widest text-black uppercase shadow-2xl transition-all hover:bg-primary"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
            <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Giriş Yap
            </div>
        )}
      </Button>
    </form>
  );
}
