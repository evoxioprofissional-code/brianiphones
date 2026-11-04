"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { login, usesSupabaseAuth } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { DeviceArt } from "@/components/site/DeviceArt";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setErr("Preencha e-mail e senha.");
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    setErr("");
    const problem = await login(user, pass);
    if (problem) {
      setBusy(false);
      setErr(problem);
      setShake((n) => n + 1);
    } else {
      router.replace("/admin");
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#f5f5f7]">
      {/* fundo: luzes suaves + aparelhos flutuando */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] -top-[20%] h-[620px] w-[620px] rounded-full bg-[#0071e3]/[0.13] blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] h-[680px] w-[680px] rounded-full bg-[#ff9f0a]/[0.12] blur-[130px]" />
        <div className="absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="login-float absolute left-[7%] top-[16%] hidden h-[300px] -rotate-[16deg] drop-shadow-[0_40px_50px_rgba(0,0,0,0.18)] lg:block">
          <DeviceArt id="login-a" category="iphone" name="iPhone" color="#c8662f" className="h-full w-auto" />
        </div>
        <div className="login-float-slow absolute bottom-[10%] right-[8%] hidden h-[320px] rotate-[14deg] drop-shadow-[0_40px_50px_rgba(0,0,0,0.18)] lg:block">
          <DeviceArt id="login-b" category="iphone" name="iPhone" color="#2d3a52" className="h-full w-auto" />
        </div>
        <div className="login-float-slow absolute bottom-[14%] left-[12%] hidden h-[150px] -rotate-6 opacity-90 drop-shadow-[0_30px_40px_rgba(0,0,0,0.16)] xl:block">
          <DeviceArt id="login-c" category="watch" name="Watch" color="#2e2f33" className="h-full w-auto" />
        </div>
        <div className="login-float absolute right-[14%] top-[14%] hidden h-[130px] rotate-[8deg] drop-shadow-[0_30px_40px_rgba(0,0,0,0.14)] xl:block">
          <DeviceArt id="login-d" category="acessorio" name="AirPods" color="#f4f4f4" className="h-full w-auto" />
        </div>
      </div>

      {/* topo */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] text-[#424245] transition-colors hover:bg-black/[0.05] hover:text-ink">
          <ArrowLeft size={16} /> Voltar para a loja
        </Link>
        <span className="hidden items-center gap-1.5 text-[12.5px] text-muted sm:flex">
          <ShieldCheck size={15} className="text-[#1f8a3e]" /> Conexão segura
        </span>
      </header>

      {/* formulário */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16">
        <div className="login-in w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] backdrop-blur">
              <Logo compact />
              <span className="rounded-md bg-[#1d1d1f] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">ADMIN</span>
            </div>
            <h1 className="mt-8 text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink md:text-[40px]">Bem-vindo de volta.</h1>
            <p className="mt-2 text-[16px] text-muted">Entre para cuidar da loja.</p>
          </div>

          <form
            onSubmit={submit}
            key={shake}
            className={cn(
              "mt-9 rounded-[28px] bg-white/85 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_30px_70px_-24px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05] backdrop-blur-xl",
              shake > 0 && "login-shake",
            )}
          >
            {/* campos unidos, estilo Apple */}
            <div className={cn("overflow-hidden rounded-[22px] bg-[#f5f5f7] ring-1 transition-shadow", err ? "ring-[#d70015]/40" : "ring-transparent")}>
              <FloatField
                id="email"
                label={usesSupabaseAuth ? "E-mail" : "Usuário"}
                type={usesSupabaseAuth ? "email" : "text"}
                autoComplete="username"
                value={user}
                onChange={(v) => (setUser(v), setErr(""))}
                icon={usesSupabaseAuth ? <Mail size={18} /> : <User size={18} />}
                autoFocus
              />
              <div className="mx-4 h-px bg-black/[0.07]" />
              <FloatField
                id="senha"
                label="Senha"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={pass}
                onChange={(v) => (setPass(v), setErr(""))}
                icon={<Lock size={18} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
                    aria-label={show ? "Esconder senha" : "Mostrar senha"}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
            </div>

            <div className={cn("grid transition-[grid-template-rows] duration-300", err ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <p className="overflow-hidden px-3 text-center text-[13px] text-[#d70015]">
                <span className="block pt-3">{err}</span>
              </p>
            </div>

            <button
              disabled={busy}
              className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-[22px] bg-[#0071e3] text-[15.5px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Entrando…
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[12.5px] leading-[1.6] text-muted">
            Acesso restrito à equipe da Brian iPhones.
            <br />
            Esqueceu a senha? Peça ao administrador para redefinir.
          </p>
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-[12px] text-faint">© Brian iPhones · Itatiba — SP</footer>
    </div>
  );
}

function FloatField({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  trailing,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <label htmlFor={id} className="group relative flex h-[64px] cursor-text items-center gap-3 px-4 transition-colors focus-within:bg-white">
      <span className="text-[#86868b] transition-colors group-focus-within:text-[#0071e3]">{icon}</span>
      <span className="relative h-full flex-1">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder=" "
          className="peer absolute inset-0 w-full bg-transparent pb-2 pt-6 text-[16px] text-ink outline-none"
        />
        <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[16px] text-[#86868b] transition-all duration-200 peer-focus:top-[18px] peer-focus:text-[12px] peer-[:not(:placeholder-shown)]:top-[18px] peer-[:not(:placeholder-shown)]:text-[12px]">
          {label}
        </span>
      </span>
      {trailing}
    </label>
  );
}
