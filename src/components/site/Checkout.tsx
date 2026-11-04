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

  const [failure, setFailure] = useState("");

  const submit = async () => {
    setTried(true);
    setFailure("");
    if (!valid || !ship || items.length === 0) {
      document.querySelector("[data-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    let order;
    try {
      order = await addOrder({
      customer: { ...customer, name: customer.name.trim() },
      shipping: { method: ship.method, label: ship.label, price: ship.price, days: ship.days, address: needsAddress ? addr : undefined },
      payment,
      installments: payment === "cartao" ? parcels : 1,
      items: items.map(({ product: p, qty }) => ({ productId: p.id, name: p.name, detail: `${p.storage} · ${p.color}`, price: p.price, qty })),
      subtotal,
      total,
      });
    } catch (e) {
      setSending(false);
      setFailure(e instanceof Error ? e.message : "Não foi possível finalizar o pedido. Tente de novo.");
      return;
    }
    clearCart();
    window.scrollTo({ top: 0 });
    router.push(`/pedido/${order.id}`);
  };

  if (!db || !lines) return <div className="h-[70vh]" />;

  if (items.length === 0 && !sending) {
    return (
      <div className="mx-auto max-w-[520px] rounded-[28px] bg-white px-6 py-20 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5f5f7]">
          <Bag size={26} />
        </span>
        <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.025em]">Sua sacola está vazia</h2>
        <p className="mt-2 text-muted">Escolha um aparelho e volte aqui para finalizar.</p>
        <Link href="/loja" className="mt-7 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
          Ver produtos
        </Link>
      </div>
    );
  }

  const done1 = !errors.name && !errors.email && !errors.phone && !errors.cpf;
  const done2 = !errors.ship && !errors.street && !errors.number && !errors.district && !errors.city;
  const count = items.reduce((s, i) => s + i.qty, 0);
  const cta = payment === "pix" ? "Pagar com Pix" : payment === "boleto" ? "Gerar boleto" : "Pagar com cartão";

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-[1fr_400px] lg:gap-8 lg:pb-0">
      {/* barra fixa no celular */}
      <div className="mobile-buybar fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] text-muted">Total{ship ? "" : " sem frete"}</p>
            <p className="text-[19px] font-semibold leading-tight tracking-[-0.025em] tabular">{money(total)}</p>
          </div>
          <button onClick={submit} disabled={sending} className="h-12 shrink-0 rounded-full bg-[#0071e3] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#0077ed] disabled:opacity-50">
            {sending ? "Enviando…" : cta}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Dados */}
        <Step n={1} done={done1} title="Seus dados" hint="Para a nota fiscal e para falarmos com você sobre o pedido.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nome completo"
              error={err("name") ? "Coloque nome e sobrenome" : ""}
              className="sm:col-span-2"
              value={customer.name}
              onChange={(v) => setCustomer({ ...customer, name: v })}
              autoComplete="name"
            />
            <Input label="E-mail" error={err("email") ? "E-mail inválido" : ""} type="email" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} autoComplete="email" />
            <Input
              label="Celular / WhatsApp"
              error={err("phone") ? "Celular com DDD" : ""}
              inputMode="tel"
              value={customer.phone}
              onChange={(v) => setCustomer({ ...customer, phone: maskPhone(v) })}
              autoComplete="tel"
            />
            <Input
              label="CPF"
              error={err("cpf") ? "O CPF tem 11 números" : ""}
              hint="Exigido pelo Mercado Pago para emitir o pagamento"
              className="sm:col-span-2"
              inputMode="numeric"
              value={customer.cpf}
              onChange={(v) => setCustomer({ ...customer, cpf: maskCpf(v) })}
            />
          </div>
        </Step>

        {/* 2. Entrega */}
        <Step n={2} done={done2} title="Entrega" hint="Digite o CEP para ver prazos e valores.">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <Input
              label="CEP"
              error={err("ship") ? "Digite o CEP" : ""}
              className="w-full sm:w-[220px]"
              inputMode="numeric"
              value={addr.cep}
              onChange={onCep}
              autoComplete="postal-code"
            />
            <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="text-[13px] text-[#0066cc] hover:underline sm:mt-[18px]">
              Não sei meu CEP
            </a>
          </div>

          {options && (
            <div className="mt-4 grid gap-2.5">
              {options.map((o) => (
                <Choice key={o.method} on={ship?.method === o.method} onClick={() => setShip(o)}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{o.label}</span>
                    <span className="block text-[13px] text-muted">{o.method === "retirada" ? `Loja em Itatiba · ${o.days}` : o.days}</span>
                  </span>
                  <span className={`text-[15px] font-medium tabular ${o.price === 0 ? "text-ok" : ""}`}>{o.price === 0 ? "Grátis" : money(o.price)}</span>
                </Choice>
              ))}
            </div>
          )}

          {needsAddress && (
            <div className="mt-4 grid gap-3 sm:grid-cols-6">
              <Input label="Rua" error={err("street") ? "Obrigatório" : ""} className="sm:col-span-4" value={addr.street} onChange={(v) => setAddr({ ...addr, street: v })} autoComplete="address-line1" />
              <Input label="Número" error={err("number") ? "Obrigatório" : ""} className="sm:col-span-2" value={addr.number} onChange={(v) => setAddr({ ...addr, number: v })} />
              <Input label="Complemento (opcional)" className="sm:col-span-3" value={addr.complement} onChange={(v) => setAddr({ ...addr, complement: v })} />
              <Input label="Bairro" error={err("district") ? "Obrigatório" : ""} className="sm:col-span-3" value={addr.district} onChange={(v) => setAddr({ ...addr, district: v })} />
              <Input label="Cidade" error={err("city") ? "Obrigatório" : ""} className="sm:col-span-4" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
              <Input label="UF" className="sm:col-span-2" maxLength={2} value={addr.uf} onChange={(v) => setAddr({ ...addr, uf: v.toUpperCase() })} />
            </div>
          )}
        </Step>

        {/* 3. Pagamento */}
        <Step n={3} title="Pagamento" hint="Processado pelo Mercado Pago. A loja não vê os dados do seu cartão.">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {(
              [
                ["pix", <Pix key="p" size={20} />, "Pix", "Aprovação na hora", "text-pix bg-pix/10"],
                ["cartao", <CardIcon key="c" size={20} />, "Cartão", `Até 12x de ${installment(total)}`, "text-[#0071e3] bg-[#0071e3]/10"],
                ["boleto", <Barcode key="b" />, "Boleto", "Até 2 dias úteis", "text-graphite bg-black/[0.05]"],
              ] as const
            ).map(([id, icon, t, d, tone]) => (
              <Choice key={id} on={payment === id} onClick={() => setPayment(id)} stacked>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>{icon}</span>
                <span className="min-w-0 flex-1 sm:mt-3">
                  <span className="block text-[15px] font-medium">{t}</span>
                  <span className="block text-[12.5px] text-muted tabular">{d}</span>
                </span>
              </Choice>
            ))}
          </div>

          {payment === "cartao" && (
            <div className="mt-3 rounded-2xl bg-[#f5f5f7] p-4">
              <label htmlFor="parcelas" className="text-[13px] font-medium text-graphite">
                Parcelas
              </label>
              <div className="relative mt-1.5">
                <select
                  id="parcelas"
                  value={parcels}
                  onChange={(e) => setParcels(Number(e.target.value))}
                  className="h-12 w-full appearance-none rounded-xl border border-[#d2d2d7] bg-white px-4 pr-10 text-[16px] outline-none transition-shadow focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
                >
                  {Array.from({ length: 12 }, (_, k) => k + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de {moneyCents(Math.ceil((total / n) * 100) / 100)}
                      {n === 1 ? " (à vista)" : ""}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" aria-hidden>
                  <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-2 text-[12.5px] text-muted">Você digita os dados do cartão na tela do Mercado Pago, no próximo passo.</p>
            </div>
          )}
        </Step>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-[100px] lg:self-start">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.14)]">
          <div className="flex items-baseline justify-between px-6 pb-2 pt-6">
            <p className="text-[19px] font-semibold tracking-[-0.02em]">Resumo</p>
            <p className="text-[13px] text-muted">
              {count} {count === 1 ? "item" : "itens"}
            </p>
          </div>
          <ul className="px-6">
            {items.map(({ product: p, qty }) => (
              <li key={p.id} className="flex gap-3.5 border-b border-black/[0.06] py-4 last:border-0">
                <div className="relative h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7]">
                  <div className={`absolute inset-0 ${p.images.length ? "" : "p-2"}`}>
                    <ProductMedia p={p} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate text-[14.5px] font-medium">{p.name}</p>
                    <button onClick={() => removeFromCart(p.id)} className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-black/[0.04] hover:text-bad" aria-label={`Remover ${p.name}`}>
                      <Trash size={14} />
                    </button>
                  </div>
                  <p className="text-[12.5px] text-muted">
                    {p.storage} · {p.color}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {p.stock > 1 ? <Qty value={qty} max={p.stock} onChange={(n) => setQty(p.id, n)} /> : <span className="text-[12.5px] text-muted">1 unidade</span>}
                    <span className="text-[14.5px] font-medium tabular">{money(p.price * qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mx-6 space-y-2.5 border-t border-black/[0.06] py-4 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Entrega</dt>
              <dd className={`tabular ${ship?.price === 0 ? "text-ok" : ship ? "" : "text-faint"}`}>{ship ? (ship.price === 0 ? "Grátis" : money(ship.price)) : "Informe o CEP"}</dd>
            </div>
          </dl>
          <div className="mx-6 flex items-baseline justify-between border-t border-black/[0.06] pb-1 pt-4">
            <span className="text-[16px] font-semibold">Total</span>
            <span className="text-[26px] font-semibold tracking-[-0.03em] tabular">{money(total)}</span>
          </div>
          {payment === "cartao" && (
            <p className="px-6 text-right text-[12.5px] text-muted tabular">
              ou {parcels}x de {moneyCents(Math.ceil((total / parcels) * 100) / 100)}
            </p>
          )}
          <div className="px-6 pb-6 pt-5">
            <button
              onClick={submit}
              disabled={sending}
              className="flex h-[54px] w-full items-center justify-center rounded-full bg-[#0071e3] text-[16px] font-medium text-white transition-colors hover:bg-[#0077ed] active:bg-[#006edb] disabled:opacity-50"
            >
              {sending ? "Registrando o pedido…" : cta}
            </button>
            {tried && !valid && <p className="mt-2.5 text-center text-[13px] text-bad">Falta preencher alguns campos.</p>}
            {failure && <p className="mt-2.5 text-center text-[13px] text-bad">{failure}</p>}
            <div className="mt-5 space-y-2 rounded-2xl bg-[#f5f5f7] px-4 py-3.5 text-[12.5px] text-graphite">
              <p className="flex items-center gap-2">
                <Shield size={15} className="shrink-0 text-ok" /> Pagamento protegido pelo Mercado Pago
              </p>
              <p className="flex items-center gap-2">
                <Lock /> Seus dados ficam criptografados
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, done, title, hint, children }: { n: number; done?: boolean; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)] sm:p-7">
      <div className="flex items-start gap-3.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-semibold transition-colors duration-300 ${
            done ? "bg-ok text-white" : "bg-[#f5f5f7] text-ink"
          }`}
        >
          {done ? <Check size={15} /> : n}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.025em]">{title}</h2>
          {hint ? <p className="mt-1 text-[13.5px] text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

/** Campo com etiqueta flutuante (sobe quando tem texto ou foco) */
function Input({
  label,
  error,
  hint,
  className = "",
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <label className={`block ${className}`} data-invalid={!!error}>
      <span className="relative block">
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className={`peer h-14 w-full rounded-xl border bg-white px-4 pb-1.5 pt-5 text-[16px] text-ink outline-none transition-[border-color,box-shadow] ${
            error ? "border-bad ring-4 ring-bad/10" : "border-[#d2d2d7] hover:border-[#a1a1a6] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15"
          }`}
        />
        <span
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 truncate pr-4 text-[16px] transition-all duration-200 peer-focus:top-[15px] peer-focus:text-[11.5px] peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[11.5px] ${
            error ? "text-bad" : "text-[#86868b]"
          }`}
        >
          {label}
        </span>
      </span>
      {error ? <span className="mt-1.5 block px-1 text-[12.5px] text-bad">{error}</span> : hint ? <span className="mt-1.5 block px-1 text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}

/** Opção selecionável (entrega e pagamento) */
function Choice({ on, onClick, stacked, children }: { on: boolean; onClick: () => void; stacked?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`relative flex w-full items-center gap-3.5 rounded-2xl border bg-white p-4 text-left transition-[border-color,box-shadow,background-color] ${
        stacked ? "sm:flex-col sm:items-start sm:gap-0 sm:p-5" : ""
      } ${on ? "border-[#0071e3] bg-[#0071e3]/[0.03] ring-1 ring-[#0071e3]" : "border-[#d2d2d7] hover:border-[#86868b]"}`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${on ? "border-[#0071e3] bg-[#0071e3]" : "border-[#c7c7cc]"} ${
          stacked ? "order-last sm:absolute sm:right-4 sm:top-4" : ""
        }`}
      >
        {on && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      {children}
    </button>
  );
}

function Barcode() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} aria-hidden>
      <path d="M3 4v12M6 4v12M8.5 4v12M11 4v12M14 4v12M17 4v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 4v12M14 4v12" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 16 16" width={15} height={15} className="shrink-0 text-graphite" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
