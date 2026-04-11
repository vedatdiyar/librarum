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
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
            <label className="px-1 text-[11px] font-bold tracking-[0.2em] text-primary/80 uppercase" htmlFor="email">
                E-posta Adresi
            </label>
            <Input
                {...register("email")}
                autoComplete="email"
                id="email"
                placeholder="örnek@librarum.com"
                type="email"
                className="h-12 rounded-xl border-primary/80 bg-card/80 px-4 shadow-inner transition-all placeholder:text-white/80 hover:bg-card/80 focus:border-primary/80 focus:bg-card/80 focus:ring-primary/80"
            />
            {errors.email ? (
                <div className="mt-1.5 flex items-center gap-2 px-1 text-rose-400/80">
                    <ShieldAlert className="h-3 w-3" />
                    <p className="text-[9px] font-bold tracking-tight uppercase">{errors.email.message}</p>
                </div>
            ) : null}
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold tracking-[0.2em] text-primary/80 uppercase" htmlFor="password">
                    Şifre
                </label>
                <button type="button" className="text-[11px] font-bold tracking-wider text-white uppercase transition-colors hover:text-primary">
                    Şifremi Unuttum
                </button>
            </div>
            <Input
                {...register("password")}
                autoComplete="current-password"
                id="password"
                placeholder="••••••••"
                type="password"
                className="h-12 rounded-xl border-primary/80 bg-card/80 px-4 shadow-inner transition-all placeholder:text-white/80 hover:bg-card/80 focus:border-primary/80 focus:bg-card/80 focus:ring-primary/80"
            />
            {errors.password ? (
                <div className="mt-1.5 flex items-center gap-2 px-1 text-rose-400/80">
                    <ShieldAlert className="h-3 w-3" />
                    <p className="text-[9px] font-bold tracking-tight uppercase">{errors.password.message}</p>
                </div>
            ) : null}
        </div>
      </div>

      {errors.root ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/80 bg-rose-500/80 p-3 text-rose-400 duration-500 animate-in zoom-in-95">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
            <p className="text-[10px] leading-snug font-bold tracking-tight uppercase">
                {errors.root.message === "Invalid credentials" ? "E-posta veya şifre hatalı." : errors.root.message}
            </p>
        </div>
      ) : null}

      <Button
        className="group relative h-12 w-full overflow-hidden rounded-xl bg-primary text-[10px] font-bold tracking-[0.2em] text-primary-foreground uppercase transition-all hover:bg-primary/90 active:scale-[0.98]"
        disabled={isPending}
        type="submit"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    <CheckCircle2 className="h-4 w-4" />
                    Oturum Aç
                </>
            )}
        </span>
        <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Button>
    </form>
  );
}
