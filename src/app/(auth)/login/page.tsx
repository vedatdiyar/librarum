import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSafeRedirectTarget, hasAuthenticatedUser } from "@/lib/shared";
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

  if (hasAuthenticatedUser(session)) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Cinematic Background Elements */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/2 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/2 blur-[100px]" />

      <div className="relative w-full max-w-md duration-1000 animate-in fade-in slide-in-from-bottom-8">
        <div className="mb-12 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/3 px-4 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">Güvenli Arşiv</span>
            </div>
            <h1 className="font-serif text-6xl font-bold tracking-tighter text-white">Librarum</h1>
            <p className="text-[11px] font-bold tracking-[0.5em] text-foreground uppercase italic">Kütüphane Yönetim Sistemi</p>
        </div>

        <div className="glass-panel group relative overflow-hidden rounded-[40px] border-white/5 bg-white/1 p-10 shadow-2xl backdrop-blur-3xl md:p-12">
            
            <div className="relative space-y-8">
                <div className="space-y-2">
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-white">Kütüphaneye Erişin</h2>
                    <p className="text-[13px] leading-relaxed text-foreground italic">
                        Yönetim paneli koruma altındadır. Kütüphanenize erişmek için kimlik bilgilerinizi girin.
                    </p>
                </div>

                <LoginForm callbackUrl={callbackUrl} />
            </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-foreground uppercase">&copy; 2024 Librarum Kütüphane Yönetimi</p>
        </div>
      </div>
    </main>
  );
}
