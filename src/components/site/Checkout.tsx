"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addOrder, useDB } from "@/lib/store";
import { cartItems, clearCart, removeFromCart, setQty, useCart } from "@/lib/cart";
import { installment, money, moneyCents } from "@/lib/format";
import { formatCep, onlyDigits, quoteShipping, type ShippingOption } from "@/lib/shipping";
import type { OrderPayment } from "@/lib/types";
import { ProductMedia } from "./ProductMedia";
import { Qty } from "./CartDrawer";
import { Bag, CardIcon, Check, Pix, Shield, Trash } from "@/components/ui/Icons";

type Address = { cep: string; street: string; number: string; complement: string; district: string; city: string; uf: string };

const maskPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};
const maskCpf = (s: string) =>
  onlyDigits(s)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export function Checkout() {
  const router = useRouter();
  const db = useDB();
  const lines = useCart();
  const items = cartItems(lines, db);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [addr, setAddr] = useState<Address>({ cep: "", street: "", number: "", complement: "", district: "", city: "", uf: "" });
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [ship, setShip] = useState<ShippingOption | null>(null);
  const [payment, setPayment] = useState<OrderPayment>("pix");
  const [parcels, setParcels] = useState(12);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);

  const shipPrice = ship?.price ?? 0;
  const total = subtotal + shipPrice;
  const needsAddress = ship && ship.method !== "retirada";

  const onCep = async (v: string) => {
    const cep = formatCep(v);
    setAddr((a) => ({ ...a, cep }));
    const d = onlyDigits(cep);
    if (d.length !== 8) {
      setOptions(null);
      setShip(null);
      return;
    }
    const opts = quoteShipping(d, subtotal);
    setOptions(opts);
    setShip(opts?.[0] ?? null);
    // preenche o endereço pelo CEP (ViaCEP, público e gratuito)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (!j.erro) setAddr((a) => ({ ...a, street: j.logradouro || a.street, district: j.bairro || a.district, city: j.localidade || a.city, uf: j.uf || a.uf }));
    } catch {
      /* sem internet: o cliente preenche na mão */
    }
  };

  const errors = {
    name: customer.name.trim().split(/\s+/).length < 2,
    email: !/^\S+@\S+\.\S+$/.test(customer.email),
    phone: onlyDigits(customer.phone).length < 10,
    cpf: onlyDigits(customer.cpf).length !== 11,
    ship: !ship,
    street: !!needsAddress && !addr.street.trim(),
    number: !!needsAddress && !addr.number.trim(),
    district: !!needsAddress && !addr.district.trim(),
    city: !!needsAddress && !addr.city.trim(),
  };
  const valid = !Object.values(errors).some(Boolean);
  const err = (k: keyof typeof errors) => tried && errors[k];

  const submit = () => {
    setTried(true);
    if (!valid || !ship || items.length === 0) {
      document.querySelector("[data-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    const order = addOrder({
      customer: { ...customer, name: customer.name.trim() },
      shipping: { method: ship.method, label: ship.label, price: ship.price, days: ship.days, address: needsAddress ? addr : undefined },
      payment,
      installments: payment === "cartao" ? parcels : 1,
      items: items.map(({ product: p, qty }) => ({ productId: p.id, name: p.name, detail: `${p.storage} · ${p.color}`, price: p.price, qty })),
      subtotal,
      total,
    });
    clearCart();
    window.scrollTo({ top: 0 });
    router.push(`/pedido/${order.id}`);
  };

  if (!db || !lines) return <div className="h-[70vh]" />;

  if (items.length === 0 && !sending) {
    return (
      <div className="mx-auto max-w-[520px] py-24 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-card">
          <Bag size={26} />
        </span>
        <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em]">Seu carrinho está vazio</h1>
        <p className="mt-2 text-muted">Escolhe um aparelho e volta aqui pra finalizar.</p>
        <Link href="/loja" className="mt-7 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 pb-24 sm:gap-6 lg:grid-cols-[1fr_400px] lg:gap-8 lg:pb-0">
      {/* barra fixa no celular */}
      <div className="mobile-buybar fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/90 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_30px_-14px_rgba(47,111,208,0.45)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] text-muted">Total{ship ? "" : " sem frete"}</p>
            <p className="text-[19px] font-bold leading-tight tracking-[-0.025em] tabular">{money(total)}</p>
          </div>
          <button onClick={submit} disabled={sending} className="btn-accent h-12 shrink-0 rounded-full px-6 text-[14.5px] font-semibold disabled:opacity-50">
            Finalizar compra
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {/* 1. Dados */}
        <Step n={1} title="Seus dados" hint="Pra nota e pra falar com você sobre o pedido.">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Nome completo" error={err("name") ? "Coloca nome e sobrenome" : ""} className="sm:col-span-2">
              <input className={inp(err("name"))} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} autoComplete="name" />
            </F>
            <F label="E-mail" error={err("email") ? "E-mail inválido" : ""}>
              <input className={inp(err("email"))} type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} autoComplete="email" />
            </F>
            <F label="Celular / WhatsApp" error={err("phone") ? "Celular com DDD" : ""}>
              <input className={inp(err("phone"))} inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })} autoComplete="tel" />
            </F>
            <F label="CPF" error={err("cpf") ? "CPF precisa de 11 números" : ""} hint="Exigido pelo Mercado Pago">
              <input className={inp(err("cpf"))} inputMode="numeric" value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: maskCpf(e.target.value) })} />
            </F>
          </div>
        </Step>

        {/* 2. Entrega */}
        <Step n={2} title="Entrega" hint="Digite o CEP pra ver as opções.">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-end">
            <F label="CEP" error={err("ship") ? "Digite o CEP" : ""}>
              <input className={inp(err("ship"))} inputMode="numeric" value={addr.cep} onChange={(e) => onCep(e.target.value)} placeholder="00000-000" autoComplete="postal-code" />
            </F>
            <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="pb-3 text-[13px] text-muted underline underline-offset-2">
              Não sei meu CEP
            </a>
          </div>

          {options && (
            <div className="mt-5 grid gap-2">
              {options.map((o) => (
                <button
                  key={o.method}
                  onClick={() => setShip(o)}
                  className={`flex items-center gap-4 rounded-[10px] border p-4 text-left transition-colors ${
                    ship?.method === o.method ? "border-ink bg-paper/70" : "border-line hover:border-ink/40"
                  }`}
                >
                  <Dot on={ship?.method === o.method} />
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-semibold">{o.label}</span>
                    <span className="text-[13px] text-muted">{o.method === "retirada" ? `Loja em Itatiba · ${o.days}` : o.days}</span>
                  </span>
                  <span className="text-[14.5px] font-semibold tabular">{o.price === 0 ? "Grátis" : money(o.price)}</span>
                </button>
              ))}
            </div>
          )}

          {needsAddress && (
            <div className="mt-5 grid gap-4 sm:grid-cols-6">
              <F label="Rua" error={err("street") ? "Obrigatório" : ""} className="sm:col-span-4">
                <input className={inp(err("street"))} value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} autoComplete="address-line1" />
              </F>
              <F label="Número" error={err("number") ? "Obrigatório" : ""} className="sm:col-span-2">
                <input className={inp(err("number"))} value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
              </F>
              <F label="Complemento" className="sm:col-span-3">
                <input className={inp(false)} value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} placeholder="Opcional" />
              </F>
              <F label="Bairro" error={err("district") ? "Obrigatório" : ""} className="sm:col-span-3">
                <input className={inp(err("district"))} value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} />
              </F>
              <F label="Cidade" error={err("city") ? "Obrigatório" : ""} className="sm:col-span-4">
                <input className={inp(err("city"))} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
              </F>
              <F label="UF" className="sm:col-span-2">
                <input className={inp(false)} value={addr.uf} maxLength={2} onChange={(e) => setAddr({ ...addr, uf: e.target.value.toUpperCase() })} />
              </F>
            </div>
          )}
        </Step>

        {/* 3. Pagamento */}
        <Step n={3} title="Pagamento" hint="Processado pelo Mercado Pago. A loja não vê os dados do seu cartão.">
          <div className="grid gap-2">
            {(
              [
                ["pix", <Pix key="p" />, "Pix", "Aprovação na hora"],
                ["cartao", <CardIcon key="c" />, "Cartão de crédito", `Em até 12x de ${installment(total)}`],
                ["boleto", <CardIcon key="b" />, "Boleto", "Aprovação em até 2 dias úteis"],
              ] as const
            ).map(([id, icon, t, d]) => (
              <div key={id} className={`rounded-[10px] border transition-colors ${payment === id ? "border-ink bg-paper/70" : "border-line hover:border-ink/40"}`}>
                <button onClick={() => setPayment(id)} className="flex w-full items-center gap-4 p-4 text-left">
                  <Dot on={payment === id} />
                  <span className="text-muted">{icon}</span>
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-semibold">{t}</span>
                    <span className="text-[13px] text-muted tabular">{d}</span>
                  </span>
                </button>
                {id === "cartao" && payment === "cartao" && (
                  <div className="border-t border-line px-4 pb-4 pt-3">
                    <label className="text-[13px] text-muted">Parcelas</label>
                    <select value={parcels} onChange={(e) => setParcels(Number(e.target.value))} className={`${inp(false)} mt-1.5`}>
                      {Array.from({ length: 12 }, (_, k) => k + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x de {moneyCents(Math.ceil((total / n) * 100) / 100)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[12px] text-muted">Os dados do cartão são digitados na tela do Mercado Pago, no próximo passo.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Step>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-[132px] lg:self-start">
        <div className="surface rounded-[20px]">
          <p className="border-b border-line px-5 py-4 text-[16px] font-semibold">Resumo do pedido</p>
          <ul className="divide-y divide-line px-5">
            {items.map(({ product: p, qty }) => (
              <li key={p.id} className="flex gap-3 py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[6px] bg-paper-2">
                  <div className={`absolute inset-0 ${p.images.length ? "" : "p-1.5"}`}>
                    <ProductMedia p={p} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold">{p.name}</p>
                    <button onClick={() => removeFromCart(p.id)} className="text-muted hover:text-bad" aria-label={`Remover ${p.name}`}>
                      <Trash size={15} />
                    </button>
                  </div>
                  <p className="text-[12.5px] text-muted">
                    {p.storage} · {p.color}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {p.stock > 1 ? <Qty value={qty} max={p.stock} onChange={(n) => setQty(p.id, n)} /> : <span className="text-[12.5px] text-muted">1 un.</span>}
                    <span className="text-[14px] font-semibold tabular">{money(p.price * qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-5 py-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Frete</dt>
              <dd className="tabular">{ship ? (ship.price === 0 ? "Grátis" : money(ship.price)) : "Digite o CEP"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-[24px] font-bold tracking-[-0.02em] tabular">{money(total)}</dd>
            </div>
            {payment === "cartao" && (
              <p className="text-right text-[12.5px] text-muted tabular">
                {parcels}x de {moneyCents(Math.ceil((total / parcels) * 100) / 100)}
              </p>
            )}
          </dl>
          <div className="px-5 pb-5">
            <button
              onClick={submit}
              disabled={sending}
              className="btn-accent flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold disabled:opacity-50"
            >
              {payment === "pix" ? "Finalizar e pagar com Pix" : payment === "boleto" ? "Finalizar e gerar boleto" : "Finalizar e pagar com cartão"}
            </button>
            {tried && !valid && <p className="mt-2 text-center text-[13px] text-bad">Falta preencher alguns campos.</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
              <Shield size={14} /> Compra protegida pelo Mercado Pago
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

const inp = (bad: boolean | undefined) =>
  `h-12 w-full rounded-[8px] border bg-paper/60 px-4 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink/60 focus:bg-paper ${
    bad ? "border-bad/60" : "border-line"
  }`;

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-[20px] p-4 sm:p-5 md:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-paper">{n}</span>
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.015em]">{title}</h2>
          {hint ? <p className="mt-0.5 text-[13.5px] text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function F({ label, error, hint, className = "", children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`} data-invalid={!!error}>
      <span className="flex justify-between text-[13px] font-medium text-graphite">
        {label}
        {hint && !error ? <span className="font-normal text-muted">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-[12.5px] text-bad">{error}</span> : null}
    </label>
  );
}

function Dot({ on }: { on: boolean }) {
  return (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-ink bg-ink" : "border-ink/30"}`}>
      {on && <Check size={12} className="text-paper" />}
    </span>
  );
}
