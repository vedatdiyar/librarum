"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { getSafeRedirectTarget } from "@librarum/lib";
import { loginSchema } from "@/lib/auth-schema";


export async function authenticate(formData: FormData) {
  const parsedCredentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsedCredentials.success) {
    return {
      error: "E-posta veya sifre gecersiz."
    };
  }

  try {
    await signIn("credentials", {
      email: parsedCredentials.data.email,
      password: parsedCredentials.data.password,
      redirectTo: getSafeRedirectTarget(
        String(formData.get("callbackUrl") ?? "/")
      )
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "E-posta veya sifre hatali."
      };
    }

    throw error;
  }
}
