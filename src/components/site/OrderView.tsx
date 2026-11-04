"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDB } from "@/lib/store";
import { dateTime, money, moneyCents } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/site";
import { Check, WhatsApp } from "@/components/ui/Icons";
import { TiltCard } from "@/components/ui/be-ui-tilt-card";

export function OrderView() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  if (!db) return <div className="h-[70vh]" />;
  const o = db.orders.find((x) => x.id === id);

  if (!o) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-[26px] font-bold">Pedido não encontrado</h1>
        <Link href="/loja" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
          Voltar pra loja
        </Link>
      </div>
    );
  }

  const msg = [
    `Olá, Brian! Fiz o pedido #${o.number} pelo site.`,
    ...o.items.map((i) => `• ${i.qty}x ${i.name} ${i.detail}`),
    `Total: ${money(o.total)} (${PAYMENT_LABEL[o.payment]})`,
    `Entrega: ${o.shipping.label}`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="surface rounded-[20px] p-6 text-center md:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-paper">
          <Check size={26} />
        </span>
        <p className="label mt-6 text-muted">Pedido #{o.number}</p>
        <h1 className="mt-3 text-[30px] font-bold tracking-[-0.03em] md:text-[36px]">Pedido recebido, {o.customer.name.split(" ")[0]}!</h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-[1.6] text-muted">
          A gente reservou {o.items.length > 1 ? "os aparelhos" : "o aparelho"} pra você. Assim que o pagamento for aprovado, você recebe a confirmação no
          e-mail {o.customer.email}.
        </p>

        <div className="mx-auto mt-7 max-w-[460px] rounded-[10px] border border-dashed border-ink/25 bg-paper/60 p-4 text-left text-[13.5px] leading-[1.55]">
          <p className="font-semibold">Pagamento · {PAYMENT_LABEL[o.payment]}</p>
          <p className="mt-1 text-muted">
            Aqui abre a tela do Mercado Pago ({o.payment === "pix" ? "QR Code do Pix" : o.payment === "boleto" ? "boleto" : "dados do cartão"}). Essa
            etapa entra quando a conta do Mercado Pago da loja for conectada.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TiltCard max={6} glareOpacity={0.08} className="rounded-[20px] bg-mist p-5">
          <p className="text-[15px] font-semibold">Itens</p>
          <ul className="mt-3 divide-y divide-line text-[14px]">
            {o.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 py-2.5">
                <span>
                  <span className="block font-medium">
                    {i.qty}x {i.name}
                  </span>
                  <span className="text-[12.5px] text-muted">{i.detail}</span>
                </span>
                <span className="tabular">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1.5 border-t border-line pt-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Frete</dt>
              <dd className="tabular">{o.shipping.price ? money(o.shipping.price) : "Grátis"}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular">{money(o.total)}</dd>
            </div>
            {o.installments > 1 && (
              <p className="text-right text-[12.5px] text-muted tabular">
                {o.installments}x de {moneyCents(Math.ceil((o.total / o.installments) * 100) / 100)}
              </p>
            )}
          </dl>
        </TiltCard>
        <TiltCard max={6} glareOpacity={0.08} className="rounded-[20px] bg-mist p-5 text-[14px]">
          <p className="text-[15px] font-semibold">Entrega</p>
          <p className="mt-3 font-medium">{o.shipping.label}</p>
          <p className="text-muted">{o.shipping.days}</p>
          {o.shipping.address ? (
            <p className="mt-3 leading-[1.55] text-graphite">
              {o.shipping.address.street}, {o.shipping.address.number}
              {o.shipping.address.complement ? ` · ${o.shipping.address.complement}` : ""}
              <br />
              {o.shipping.address.district} · {o.shipping.address.city}/{o.shipping.address.uf}
              <br />
              CEP {o.shipping.address.cep}
            </p>
          ) : (
            <p className="mt-3 leading-[1.55] text-graphite">
              {db.settings.address}
              <br />
              {db.settings.city} · {db.settings.hours}
            </p>
          )}
          <p className="mt-4 text-[12.5px] text-muted">
            Status: {ORDER_STATUS_LABEL[o.status]} · {dateTime(o.createdAt)}
          </p>
        </TiltCard>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <a
          href={waLink(db.settings.whatsapp, msg)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium text-paper"
        >
          <WhatsApp size={18} /> Falar sobre o pedido
        </a>
        <Link href="/loja" className="inline-flex h-12 items-center rounded-full border border-ink/20 px-6 text-[14px] font-medium hover:border-ink">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
