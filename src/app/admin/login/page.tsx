"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { login, usesSupabaseAuth } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

const AREAS = ["Pedidos", "Estoque", "Clientes", "Vitrine", "Financeiro"];

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
    <div className="flex min-h-dvh flex-col bg-black lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* lado escuro: marca + luz em movimento */}
      <aside className="relative isolate flex min-h-[248px] flex-col overflow-hidden px-6 pb-12 pt-6 text-white sm:px-10 lg:min-h-dvh lg:px-14 lg:pb-12 lg:pt-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora-a absolute -left-[20%] top-[30%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgba(200,102,47,0.55),transparent)] blur-[40px]" />
          <div className="aurora-b absolute -right-[30%] -top-[30%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgba(94,92,230,0.38),transparent)] blur-[50px]" />
          <div className="aurora-c absolute bottom-[-40%] right-[-10%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(closest-side,rgba(255,214,170,0.22),transparent)] blur-[40px]" />
          {/* linhas finas, bem de leve */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 80% 70% at 30% 60%, black, transparent)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Brian iPhones, voltar para a loja" className="flex items-center gap-2.5">
            <Logo compact tone="paper" />
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-white/70">PAINEL</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden">
            <ArrowLeft size={15} /> Loja
          </Link>
        </div>

        <div className="login-in mt-auto pt-10">
          <h1 className="max-w-[520px] text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[44px] lg:text-[64px]">
            Sua loja inteira,
            <br />
            <span className="bg-gradient-to-r from-[#ffb27a] via-[#f5d0b5] to-[#b9b4ff] bg-clip-text text-transparent">num só lugar.</span>
          </h1>
          <ul className="mt-5 hidden flex-wrap gap-2 sm:flex lg:mt-8">
            {AREAS.map((a) => (
              <li key={a} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[12.5px] text-white/70 backdrop-blur-sm">
                {a}
              </li>
            ))}
          </ul>
          <p className="mt-10 hidden text-[12px] text-white/35 lg:block">© Brian iPhones · Itatiba — SP</p>
        </div>
      </aside>

      {/* lado claro: formulário */}
      <main className="relative -mt-6 flex flex-1 flex-col rounded-t-[28px] bg-white lg:mt-0 lg:rounded-none">
        <div className="hidden justify-end px-10 pt-10 lg:flex">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] text-[#6e6e73] transition-colors hover:bg-black/[0.04] hover:text-ink">
            <ArrowLeft size={15} /> Voltar para a loja
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="login-in w-full max-w-[380px]" style={{ animationDelay: "120ms" }}>
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink">Entrar</h2>
            <p className="mt-1.5 text-[15px] text-muted">Acesso da equipe Brian iPhones.</p>

            <form onSubmit={submit} key={shake} className={cn("mt-8 space-y-4", shake > 0 && "login-shake")} noValidate>
              <Field id="email" label={usesSupabaseAuth ? "E-mail" : "Usuário"} error={!!err}>
                <input
                  id="email"
                  type={usesSupabaseAuth ? "email" : "text"}
                  autoComplete="username"
                  autoFocus
                  value={user}
                  onChange={(e) => (setUser(e.target.value), setErr(""))}
                  placeholder={usesSupabaseAuth ? "voce@email.com" : "usuário"}
                  className="h-full w-full bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-[#b0b0b5]"
                />
              </Field>
              <Field id="senha" label="Senha" error={!!err}>
                <input
                  id="senha"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => (setPass(e.target.value), setErr(""))}
                  placeholder="••••••••"
                  className="h-full w-full bg-transparent pl-4 pr-12 text-[16px] text-ink outline-none placeholder:text-[#c7c7cc]"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.05] hover:text-ink"
                  aria-label={show ? "Esconder senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </Field>

              <div className={cn("grid transition-[grid-template-rows] duration-300", err ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden text-[13px] text-[#d70015]" role="alert">
                  {err}
                </p>
              </div>

              <button
                disabled={busy}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#1d1d1f] text-[15.5px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] transition-[background-color,transform] hover:bg-black active:scale-[0.99] disabled:opacity-70"
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

            <div className="mt-8 flex items-start gap-2.5 rounded-2xl bg-[#f5f5f7] px-4 py-3.5 text-[12.5px] leading-[1.5] text-[#6e6e73]">
              <ShieldCheck size={16} className="mt-px shrink-0 text-[#1f8a3e]" />
              <span>Conexão segura. Esqueceu a senha? Peça ao administrador para redefinir.</span>
            </div>
          </div>
        </div>

        <p className="pb-6 text-center text-[12px] text-[#a1a1a6] lg:hidden">© Brian iPhones · Itatiba — SP</p>
      </main>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#424245]">
        {label}
      </label>
      <div
        className={cn(
          "relative h-[52px] rounded-[14px] bg-[#f5f5f7] ring-1 transition-[box-shadow,background-color] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1d1d1f]",
          error ? "ring-[#d70015]/50" : "ring-black/[0.06]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
