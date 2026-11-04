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
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:block">
        <Logo tone="paper" />
        <p
          className="absolute -bottom-6 left-10 font-sans font-extrabold leading-[0.8] text-paper/[0.06]"
          style={{ fontVariationSettings: '"wdth" 125', fontSize: 260, letterSpacing: "-0.04em" }}
          aria-hidden
        >
          PAINEL
        </p>
        <p className="absolute bottom-12 right-12 max-w-[260px] text-right text-[14px] leading-[1.6] text-paper/50">
          Produtos, contatos, visitas e financeiro da loja num lugar só.
        </p>
      </div>
      <div className="flex items-center justify-center px-6">
        <form onSubmit={submit} className="w-full max-w-[360px]">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="label mt-10 text-muted lg:mt-0">Área restrita</p>
          <h1 className="display mt-3 text-[40px]">Entrar</h1>
          <div className="mt-10 space-y-5">
            <Field label="Usuário">
              <Input value={user} onChange={(e) => (setUser(e.target.value), setErr(false))} autoComplete="username" />
            </Field>
            <Field label="Senha">
              <Input type="password" value={pass} onChange={(e) => (setPass(e.target.value), setErr(false))} autoComplete="current-password" />
            </Field>
          </div>
          {err && <p className="mt-4 text-[13px] text-bad">Usuário ou senha incorretos.</p>}
          <button className="mt-8 h-12 w-full rounded-full bg-ink text-[14px] font-medium text-paper hover:bg-graphite">Entrar</button>
        </form>
      </div>
    </div>
  );
}
