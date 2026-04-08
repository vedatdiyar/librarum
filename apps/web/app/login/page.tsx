import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@librarum/ui";
import { auth } from "@/auth";
import { getSafeRedirectTarget } from "@librarum/lib";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};


export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl = getSafeRedirectTarget(resolvedSearchParams?.callbackUrl);

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md border-border/80 bg-surface">
        <CardHeader className="pb-8">
          <p className="page-kicker">
            Librarum
          </p>
          <CardTitle className="text-balance text-3xl">
            Kişisel kütüphanene giriş yap
          </CardTitle>
          <CardDescription>
            Bu alan tek kullanıcılı yönetim paneli için korunur. Devam etmek
            için yönetici bilgilerini gir.
          </CardDescription>
        </CardHeader>

        <CardContent>
        <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
