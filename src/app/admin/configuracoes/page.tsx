"use client";

import { useState } from "react";
import { clearAll, resetDemo, saveSettings, useDB } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { Btn, Card, PageHead } from "@/components/admin/AdminShell";
import { Field, Input } from "@/components/ui/Form";

export default function ConfigPage() {
  const db = useDB();
  if (!db) return null;
  return <ConfigForm key={JSON.stringify(db.settings)} initial={db.settings} />;
}

function ConfigForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Settings, v: string) => (setS((x) => ({ ...x, [k]: v })), setSaved(false));

  return (
    <>
      <PageHead eyebrow="Dados que aparecem no site" title="Configurações" />
      <div className="grid gap-5 px-5 py-8 md:px-10 xl:grid-cols-3">
        <Card title="Loja e contato" className="xl:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp" hint="com DDI e DDD, só números">
              <Input value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Instagram" hint="sem @">
              <Input value={s.instagram} onChange={(e) => set("instagram", e.target.value.replace("@", ""))} />
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <Input value={s.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Cidade">
              <Input value={s.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Horário">
              <Input value={s.hours} onChange={(e) => set("hours", e.target.value)} />
            </Field>
            <Field label="Link do Google Maps" className="sm:col-span-2">
              <Input value={s.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex items-center justify-end gap-4 border-t border-line pt-5">
            {saved && <span className="text-[13px] text-ok">Salvo.</span>}
            <Btn onClick={() => (saveSettings(s), setSaved(true))}>Salvar alterações</Btn>
          </div>
        </Card>

        <Card title="Dados">
          <p className="text-[14px] leading-[1.6] text-muted">
            Enquanto o banco de dados não está conectado, tudo fica salvo neste navegador.
          </p>
          <div className="mt-6 space-y-3">
            <Btn variant="ghost" className="w-full" onClick={() => confirm("Restaurar os dados de demonstração?") && resetDemo()}>
              Restaurar demonstração
            </Btn>
            <Btn
              variant="danger"
              className="w-full"
              onClick={() => confirm("Zerar contatos, vendas, despesas e visitas? Os produtos voltam ao estoque de exemplo.") && clearAll()}
            >
              Zerar números
            </Btn>
          </div>
        </Card>
      </div>
    </>
  );
}
