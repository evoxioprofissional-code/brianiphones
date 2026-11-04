"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Database, Plus, RotateCcw, Store, Truck, X } from "lucide-react";
import { clearAll, resetDemo, saveSettings, saveShipping, useDB } from "@/lib/store";
import { DEFAULT_SHIPPING } from "@/lib/defaults";
import { money } from "@/lib/format";
import type { Settings, ShippingSettings } from "@/lib/types";
import { AButton, Badge, FormField, PageBody, PageHeader, Panel, Segmented, Switch, TextInput } from "@/components/admin/kit";

type Tab = "loja" | "envio" | "dados";

export default function ConfigPage() {
  return (
    <Suspense fallback={null}>
      <Config />
    </Suspense>
  );
}

function Config() {
  const db = useDB();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "loja");
  if (!db) return null;
  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados da loja, envio e manutenção" />
      <PageBody className="space-y-5">
        <Segmented
          items={[
            { value: "loja", label: "Loja e contato" },
            { value: "envio", label: "Envio e etiqueta" },
            { value: "dados", label: "Dados" },
          ]}
          value={tab}
          onChange={setTab}
          className="bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
        />
        {tab === "loja" && <StoreForm initial={db.settings} />}
        {tab === "envio" && <ShippingForm initial={{ ...DEFAULT_SHIPPING, ...(db.settings.shipping ?? {}) }} />}
        {tab === "dados" && <DataTab />}
      </PageBody>
    </>
  );
}

function SaveBar({ dirty, onSave, saved }: { dirty: boolean; onSave: () => void; saved: boolean }) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-5">
      {saved && !dirty && <span className="text-[13px] text-[#1f8a3e]">✓ Salvo</span>}
      <AButton variant="accent" disabled={!dirty} onClick={onSave}>
        Salvar alterações
      </AButton>
    </div>
  );
}

function StoreForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState(initial);
  const [base, setBase] = useState(initial);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Settings, v: string) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(base);
  return (
    <Panel title="Loja e contato" subtitle="Aparece no site, no rodapé, nos pedidos impressos e nos botões de WhatsApp" actions={<Store size={17} className="text-faint" />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="WhatsApp" hint="com 55 e DDD, só números">
          <TextInput value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} />
        </FormField>
        <FormField label="Instagram" hint="sem @">
          <TextInput value={s.instagram} onChange={(e) => set("instagram", e.target.value.replace("@", ""))} prefix="@" />
        </FormField>
        <FormField label="Endereço da loja" className="sm:col-span-2">
          <TextInput value={s.address} onChange={(e) => set("address", e.target.value)} />
        </FormField>
        <FormField label="Cidade">
          <TextInput value={s.city} onChange={(e) => set("city", e.target.value)} />
        </FormField>
        <FormField label="Horário">
          <TextInput value={s.hours} onChange={(e) => set("hours", e.target.value)} />
        </FormField>
        <FormField label="Link do Google Maps" className="sm:col-span-2">
          <TextInput value={s.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} />
        </FormField>
      </div>
      <SaveBar
        dirty={dirty}
        saved={saved}
        onSave={() => {
          saveSettings({ ...s, shipping: initial.shipping });
          setBase(s);
          setSaved(true);
        }}
      />
    </Panel>
  );
}

function ShippingForm({ initial }: { initial: ShippingSettings }) {
  const [s, setS] = useState(initial);
  const [base, setBase] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [carrier, setCarrier] = useState("");
  const set = <K extends keyof ShippingSettings>(k: K, v: ShippingSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(base);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Remetente" subtitle="Sai na etiqueta de envio e no pedido impresso" actions={<Truck size={17} className="text-faint" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome / razão social" className="sm:col-span-2">
            <TextInput value={s.senderName} onChange={(e) => set("senderName", e.target.value)} />
          </FormField>
          <FormField label="CNPJ ou CPF" hint="opcional">
            <TextInput value={s.senderDoc} onChange={(e) => set("senderDoc", e.target.value)} />
          </FormField>
          <FormField label="Telefone">
            <TextInput value={s.senderPhone} onChange={(e) => set("senderPhone", e.target.value)} />
          </FormField>
          <FormField label="CEP de origem">
            <TextInput value={s.originCep} onChange={(e) => set("originCep", e.target.value)} />
          </FormField>
          <FormField label="Número">
            <TextInput value={s.originNumber} onChange={(e) => set("originNumber", e.target.value)} />
          </FormField>
          <FormField label="Rua" className="sm:col-span-2">
            <TextInput value={s.originStreet} onChange={(e) => set("originStreet", e.target.value)} />
          </FormField>
          <FormField label="Bairro">
            <TextInput value={s.originDistrict} onChange={(e) => set("originDistrict", e.target.value)} />
          </FormField>
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <FormField label="Cidade">
              <TextInput value={s.originCity} onChange={(e) => set("originCity", e.target.value)} />
            </FormField>
            <FormField label="UF">
              <TextInput value={s.originUf} maxLength={2} onChange={(e) => set("originUf", e.target.value.toUpperCase())} />
            </FormField>
          </div>
        </div>
      </Panel>

      <Panel title="Regras de entrega">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Entrega em Itatiba" hint="taxa">
              <TextInput type="number" min={0} value={s.localFee} onChange={(e) => set("localFee", Number(e.target.value))} prefix="R$" />
            </FormField>
            <FormField label="Grátis acima de">
              <TextInput type="number" min={0} value={s.localFreeAbove} onChange={(e) => set("localFreeAbove", Number(e.target.value))} prefix="R$" />
            </FormField>
            <FormField label="Prazo pra postar" hint="depois do pagamento">
              <TextInput type="number" min={0} value={s.handlingDays} onChange={(e) => set("handlingDays", Number(e.target.value))} suffix="dia(s) útil(eis)" />
            </FormField>
            <FormField label="Peso padrão" hint="quando o produto não tem">
              <TextInput type="number" min={0} value={s.defaultWeightGrams} onChange={(e) => set("defaultWeightGrams", Number(e.target.value))} suffix="g" />
            </FormField>
          </div>
          <div className="rounded-2xl bg-[#f5f5f7] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-medium">Retirada na loja</p>
              <Switch checked={s.pickupEnabled} onChange={(v) => set("pickupEnabled", v)} />
            </div>
            <TextInput className="mt-3 bg-white" value={s.pickupText} onChange={(e) => set("pickupText", e.target.value)} disabled={!s.pickupEnabled} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#424245]">Transportadoras</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {s.carriers.map((c) => (
                <Badge key={c} tone="gray">
                  {c}
                  <button onClick={() => set("carriers", s.carriers.filter((x) => x !== c))} aria-label={`Remover ${c}`}>
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              <form
                className="flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (carrier.trim() && !s.carriers.includes(carrier.trim())) set("carriers", [...s.carriers, carrier.trim()]);
                  setCarrier("");
                }}
              >
                <TextInput value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Nova transportadora" className="h-8 w-44 text-[12.5px]" />
                <AButton size="sm" type="submit" disabled={!carrier.trim()}>
                  <Plus size={13} />
                </AButton>
              </form>
            </div>
          </div>
          <p className="text-[12.5px] text-muted">
            Hoje o site calcula SEDEX/PAC por estimativa. Ao conectar Mercado Envios, Correios ou Melhor Envio, os valores passam a vir da transportadora. Entrega local hoje: {money(s.localFee)}, grátis acima de {money(s.localFreeAbove)}.
          </p>
        </div>
        <SaveBar
          dirty={dirty}
          saved={saved}
          onSave={() => {
            saveShipping(s);
            setBase(s);
            setSaved(true);
          }}
        />
      </Panel>
    </div>
  );
}

function DataTab() {
  return (
    <Panel title="Dados" subtitle="Enquanto o banco de dados não está conectado, tudo fica salvo neste navegador." actions={<Database size={17} className="text-faint" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#f5f5f7] p-5">
          <p className="text-[15px] font-semibold">Restaurar demonstração</p>
          <p className="mt-1 text-[13px] text-muted">Volta produtos, pedidos, clientes, vitrine e números de exemplo.</p>
          <AButton className="mt-4" onClick={() => confirm("Restaurar os dados de demonstração? O que você mudou aqui será perdido.") && resetDemo()}>
            <RotateCcw size={15} /> Restaurar
          </AButton>
        </div>
        <div className="rounded-2xl bg-[#fff5f5] p-5">
          <p className="text-[15px] font-semibold">Zerar números</p>
          <p className="mt-1 text-[13px] text-muted">Apaga pedidos, contatos, vendas, despesas e visitas. Produtos voltam ao exemplo.</p>
          <AButton variant="danger" className="mt-4" onClick={() => confirm("Zerar pedidos, contatos, vendas, despesas e visitas?") && clearAll()}>
            Zerar
          </AButton>
        </div>
      </div>
    </Panel>
  );
}
