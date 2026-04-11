import { redirect } from "next/navigation";
import Image from "next/image";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Background Gradients from globals.css style */}
      <div className="ambient-container">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/80 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-primary/80 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px] duration-700 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
                <Image 
                    src="/logo.svg" 
                    alt="Librarum Logo" 
                    width={56} 
                    height={56} 
                    className="size-16"
                    priority
                />
                <h1 className="font-brand text-5xl leading-none font-medium tracking-normal text-white">
                  Librarum
                </h1>
            </div>
            
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/80 bg-card/80 px-3 py-1 backdrop-blur-md">
                <span className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                <span className="text-[9px] font-bold tracking-[0.2em] text-white/80 uppercase">Dijital Kütüphane Sistemi</span>
            </div>
        </div>

        <div className="glass-panel group relative overflow-hidden rounded-[40px] border-primary/80 bg-card/80 p-8 shadow-shell backdrop-blur-3xl md:p-10">
            <div className="relative space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="font-sans text-lg font-bold text-white">Yönetim Paneli</h2>
                <p className="font-sans text-[12px] leading-relaxed text-foreground">
                  Devam etmek için kimlik bilgilerinizle giriş yapın.
                </p>
              </div>

              <LoginForm callbackUrl={callbackUrl} />
            </div>
        </div>

        <div className="mt-8 text-center text-[9px] font-bold tracking-[0.2em] text-white/80 uppercase">
            &copy; 2026 Librarum &bull; Arşiv Yönetimi
        </div>
      </div>
    </main>
  );
}
