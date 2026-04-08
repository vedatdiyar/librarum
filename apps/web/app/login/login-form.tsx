"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Input } from "@exlibris/ui";
import { authenticate } from "./actions";
import type { LoginInput } from "@/lib/auth-schema";
import { loginSchema } from "@/lib/auth-schema";

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
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          E-posta
        </label>
        <Input
          {...register("email")}
          autoComplete="email"
          id="email"
          placeholder="owner@example.com"
          type="email"
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="password"
        >
          Şifre
        </label>
        <Input
          {...register("password")}
          autoComplete="current-password"
          id="password"
          placeholder="••••••••"
          type="password"
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {errors.root ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
    </form>
  );
}
