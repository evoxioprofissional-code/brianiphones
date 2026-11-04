"use client";

import { useState } from "react";
import { addLead, useDB } from "@/lib/store";
import { IPHONE_MODELS, REPAIR_ISSUES } from "@/lib/site";
import { repairMessage, waLink } from "@/lib/whatsapp";
import { Chip, Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Check, WhatsApp } from "@/components/ui/Icons";

export function RepairForm() {
  const db = useDB();
  const [model, setModel] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  const valid = model && issues.length > 0 && name.trim().length > 1;
  const payload = { model, issues, description: description.trim() };
  const href = waLink(db?.settings.whatsapp ?? "5511996938263", repairMessage(payload, name.trim()));

  const toggle = (i: string) => setIssues((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const submit = () => {
    addLead({ type: "reparo", name: name.trim(), repair: payload });
    setSent(true);
    window.open(href, "_blank", "noopener");
  };

  if (sent) {
    return (
      <div className="rounded-[6px] border border-line bg-card p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink text-paper">
          <Check size={22} />
        </span>
        <p className="display mt-6 text-[32px]">Mensagem pronta.</p>
        <p className="mt-3 text-[15px] text-muted">É só enviar no WhatsApp que a gente responde com o orçamento.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
            <WhatsApp size={17} /> Abrir o WhatsApp
          </a>
          <button onClick={() => setSent(false)} className="h-12 rounded-full border border-ink/20 px-6 text-[14px]">
            Outro aparelho
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Aparelho">
          <Select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">Selecione</option>
            {IPHONE_MODELS.map((m) => (
              <option key={m}>{m}</option>
            ))}
            <option>iPad</option>
            <option>MacBook</option>
            <option>Apple Watch</option>
          </Select>
        </Field>
        <Field label="Seu nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar" />
        </Field>
      </div>

      <div>
        <span className="text-[13px] font-medium text-graphite">O que está acontecendo?</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPAIR_ISSUES.map((i) => (
            <Chip key={i} active={issues.includes(i)} onClick={() => toggle(i)}>
              {i}
            </Chip>
          ))}
        </div>
      </div>

      <Field label="Detalhes" hint="opcional">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: caiu e a tela ficou com uma faixa verde, o touch funciona."
        />
      </Field>

      <div className="flex justify-end border-t border-line pt-6">
        <button
          onClick={submit}
          disabled={!valid}
          className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[14px] font-medium text-paper transition-opacity disabled:opacity-30"
        >
          <WhatsApp size={17} /> Pedir orçamento
        </button>
      </div>
    </div>
  );
}
