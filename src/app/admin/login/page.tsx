"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { Field, Input } from "@/components/ui/Form";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(user, pass)) router.replace("/admin");
    else setErr(true);
  };

  return (
    <div className="grid min-h-dvh bg-[#f5f5f7] lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[radial-gradient(90%_70%_at_70%_0%,#2a2a2e_0%,#161618_55%,#0b0b0c_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#2997ff]/25 blur-[110px]" />
        <div className="relative flex items-center gap-2.5">
          <span className="rounded-lg bg-white px-2.5 py-1.5">
            <Logo compact />
          </span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">ADMIN</span>
        </div>
        <div className="relative">
          <p className="text-[44px] font-semibold leading-[1.05] tracking-[-0.035em]">
            A loja inteira
            <br />
            <span className="text-[#a1a1a6]">num lugar só.</span>
          </p>
          <ul className="mt-8 grid max-w-[460px] grid-cols-2 gap-3 text-[13.5px]">
            {["Pedidos e etiquetas", "Logística e rastreio", "Clientes", "Produtos e vitrine"].map((t) => (
              <li key={t} className="rounded-2xl bg-white/[0.07] px-4 py-3 text-white/85 backdrop-blur">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[12.5px] text-white/40">Brian iPhones · Itatiba — SP</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-[380px] rounded-3xl bg-white p-8 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.25)]">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.03em] lg:mt-0">Entrar no painel</h1>
          <p className="mt-1 text-[14px] text-muted">Área restrita da loja.</p>
          <div className="mt-8 space-y-4">
            <Field label="Usuário">
              <Input value={user} onChange={(e) => (setUser(e.target.value), setErr(false))} autoComplete="username" className="rounded-xl border-0 bg-[#f5f5f7] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/60" />
            </Field>
            <Field label="Senha">
              <Input type="password" value={pass} onChange={(e) => (setPass(e.target.value), setErr(false))} autoComplete="current-password" className="rounded-xl border-0 bg-[#f5f5f7] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/60" />
            </Field>
          </div>
          {err && <p className="mt-4 text-[13px] text-bad">Usuário ou senha incorretos.</p>}
          <button className="mt-7 h-12 w-full rounded-full bg-[#0071e3] text-[15px] font-medium text-white transition-[filter] hover:brightness-110">Entrar</button>
        </form>
      </div>
    </div>
  );
}
