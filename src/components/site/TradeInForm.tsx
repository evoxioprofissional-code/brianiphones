/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { addLead, useDB } from "@/lib/store";
import { DEVICE_CONDITIONS, IPHONE_MODELS, REPLACED_PARTS, STORAGE_OPTIONS } from "@/lib/site";
import { tradeMessage, waLink } from "@/lib/whatsapp";
import { compressImage, dataUrlToFile } from "@/lib/image";
import type { TradeInPayload } from "@/lib/types";
import { Chip, Field, Input, Select } from "@/components/ui/Form";
import { ArrowRight, Camera, Check, Close, WhatsApp } from "@/components/ui/Icons";

const STEPS = ["Seu aparelho", "Fotos", "O que você quer"];
const PHOTO_SLOTS = ["Frente", "Verso", "Lateral", "Tela ligada", "Bateria (Ajustes)", "Outra"];

export function TradeInForm() {
  const db = useDB();
  const params = useSearchParams();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [t, setT] = useState<TradeInPayload>({
    model: "",
    storage: "",
    color: "",
    battery: 88,
    replacedParts: [],
    condition: "",
    photos: [],
    desired: params.get("quero") ?? "",
  });
  const [unknownBattery, setUnknownBattery] = useState(false);
  const [noneReplaced, setNoneReplaced] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Itatiba");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof TradeInPayload>(k: K, v: TradeInPayload[K]) => setT((s) => ({ ...s, [k]: v }));

  const payload: TradeInPayload = { ...t, battery: unknownBattery ? null : t.battery };

  const valid = [
    !!t.model && !!t.storage && !!t.condition && (noneReplaced || t.replacedParts.length > 0),
    true,
    !!t.desired.trim() && name.trim().length > 1,
  ];

  const options = useMemo(
    () =>
      (db?.products ?? [])
        .filter((p) => p.active && p.stock > 0)
        .map((p) => `${p.name} ${p.storage} ${p.color}`),
    [db],
  );

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    const room = 6 - t.photos.length;
    const list = await Promise.all(Array.from(files).slice(0, room).map((f) => compressImage(f, 720, 0.72)));
    setT((s) => ({ ...s, photos: [...s.photos, ...list] }));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const togglePart = (part: string) => {
    setNoneReplaced(false);
    set("replacedParts", t.replacedParts.includes(part) ? t.replacedParts.filter((x) => x !== part) : [...t.replacedParts, part]);
  };

  const message = tradeMessage(payload, name.trim(), city.trim());
  const href = waLink(db?.settings.whatsapp ?? "5511996938263", message);

  const submit = () => {
    try {
      addLead({ type: "troca", name: name.trim(), city: city.trim(), trade: payload });
    } catch {
      /* fotos grandes demais pro armazenamento — segue sem travar o cliente */
    }
    setDone(true);
    window.open(href, "_blank", "noopener");
  };

  const canShareFiles = typeof navigator !== "undefined" && "canShare" in navigator;
  const sharePhotos = async () => {
    setSharing(true);
    try {
      const files = await Promise.all(t.photos.map((p, i) => dataUrlToFile(p, `meu-iphone-${i + 1}.jpg`)));
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, text: `Fotos do meu ${t.model}` });
      }
    } catch {
      /* usuário cancelou */
    }
    setSharing(false);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-[640px] py-24 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-paper">
          <Check size={24} />
        </span>
        <h2 className="display mt-8 text-[40px] md:text-[56px]">Pronto, {name.split(" ")[0]}.</h2>
        <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.6] text-muted">
          A conversa abriu no WhatsApp com todas as informações. Agora é só enviar a mensagem
          {t.photos.length ? " e mandar as fotos logo em seguida." : "."}
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
            <WhatsApp size={17} /> Abrir o WhatsApp de novo
          </a>
          {t.photos.length > 0 && canShareFiles && (
            <button onClick={sharePhotos} disabled={sharing} className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/20 px-6 text-[14px] font-medium">
              <Camera size={17} /> {sharing ? "Abrindo…" : "Compartilhar as fotos"}
            </button>
          )}
        </div>
        {t.photos.length > 0 && (
          <div className="mt-10 flex justify-center gap-2">
            {t.photos.map((p, i) => (
              <img key={i} src={p} alt="" className="h-16 w-16 rounded-[4px] object-cover" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {/* Etapas */}
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`w-full text-left ${i < step ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className={`block h-[2px] transition-colors ${i <= step ? "bg-ink" : "bg-line"}`} />
                <span className="mt-3 flex items-baseline gap-2">
                  <span className="label text-faint">0{i + 1}</span>
                  <span className={`text-[13px] md:text-[14px] ${i === step ? "font-medium text-ink" : "text-muted"}`}>{s}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          {step === 0 && (
            <div className="grid gap-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Modelo">
                  <Select value={t.model} onChange={(e) => set("model", e.target.value)}>
                    <option value="">Selecione</option>
                    {IPHONE_MODELS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Armazenamento">
                  <Select value={t.storage} onChange={(e) => set("storage", e.target.value)}>
                    <option value="">Selecione</option>
                    {STORAGE_OPTIONS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Cor" className="sm:col-span-2">
                  <Input value={t.color} onChange={(e) => set("color", e.target.value)} placeholder="Ex.: Azul, Titânio natural, Meia-noite" />
                </Field>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-graphite">Saúde da bateria</span>
                  <span className="text-[12px] text-faint">Ajustes › Bateria › Saúde</span>
                </div>
                <div className={`mt-4 flex items-center gap-6 ${unknownBattery ? "opacity-35" : ""}`}>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={t.battery ?? 88}
                    disabled={unknownBattery}
                    onChange={(e) => set("battery", Number(e.target.value))}
                    className="range flex-1"
                    aria-label="Saúde da bateria"
                  />
                  <span className="w-[72px] text-right text-[32px] font-bold tracking-[-0.03em] tabular">
                    {t.battery}
                    <span className="text-[16px] text-muted">%</span>
                  </span>
                </div>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                  <input type="checkbox" checked={unknownBattery} onChange={(e) => setUnknownBattery(e.target.checked)} className="accent-ink" />
                  Não sei / não aparece
                </label>
              </div>

              <div>
                <span className="text-[13px] font-medium text-graphite">Alguma peça já foi trocada?</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip
                    active={noneReplaced}
                    onClick={() => {
                      setNoneReplaced(true);
                      set("replacedParts", []);
                    }}
                  >
                    Nenhuma, tudo original
                  </Chip>
                  {REPLACED_PARTS.map((p) => (
                    <Chip key={p} active={t.replacedParts.includes(p)} onClick={() => togglePart(p)}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[13px] font-medium text-graphite">Como ele está?</span>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {DEVICE_CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("condition", c.id)}
                      className={`rounded-[6px] border p-4 text-left transition-colors ${
                        t.condition === c.id ? "border-ink bg-card" : "border-line hover:border-ink/40"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-[15px] font-medium">{c.label}</span>
                        <span className={`h-4 w-4 rounded-full border ${t.condition === c.id ? "border-[5px] border-ink" : "border-line"}`} />
                      </span>
                      <span className="mt-1 block text-[13px] text-muted">{c.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="max-w-[520px] text-[15px] leading-[1.6] text-muted">
                Até 6 fotos. Luz natural ajuda bastante. Se puder, inclua um print da tela de saúde da bateria.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PHOTO_SLOTS.map((slot, i) => {
                  const photo = t.photos[i];
                  return photo ? (
                    <div key={slot} className="group relative aspect-square overflow-hidden rounded-[6px] bg-paper-2">
                      <img src={photo} alt={slot} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set("photos", t.photos.filter((_, k) => k !== i))}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-paper"
                        aria-label="Remover foto"
                      >
                        <Close size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={busy || i > t.photos.length}
                      className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed transition-colors ${
                        i === t.photos.length ? "border-ink/40 text-ink hover:bg-card" : "border-line text-faint"
                      }`}
                    >
                      <Camera size={22} />
                      <span className="text-[12px]">{busy && i === t.photos.length ? "Processando…" : slot}</span>
                    </button>
                  );
                })}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <p className="mt-6 text-[13px] text-faint">
                Sem fotos agora? Pode pular. Você manda depois direto na conversa.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <Field label="Qual aparelho você quer levar?">
                <Input
                  list="produtos-loja"
                  value={t.desired}
                  onChange={(e) => set("desired", e.target.value)}
                  placeholder="Ex.: iPhone 16 Pro 256 GB"
                />
                <datalist id="produtos-loja">
                  {options.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Seu nome">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar" autoComplete="given-name" />
                </Field>
                <Field label="Cidade">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`text-[14px] text-muted hover:text-ink ${step === 0 ? "invisible" : ""}`}
          >
            Voltar
          </button>
          {step < 2 ? (
            <button
              type="button"
              disabled={!valid[step]}
              onClick={() => setStep((s) => s + 1)}
              className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-5 text-[14px] font-medium text-paper transition-opacity disabled:opacity-30"
            >
              {step === 1 && t.photos.length === 0 ? "Pular fotos" : "Continuar"}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!valid[2]}
              onClick={submit}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[14px] font-medium text-paper transition-opacity disabled:opacity-30"
            >
              <WhatsApp size={17} /> Enviar pro WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Ficha */}
      <aside className="lg:col-span-5">
        <div className="rounded-[6px] border border-line bg-card p-6 lg:sticky lg:top-28 md:p-8">
          <div className="flex items-center justify-between">
            <p className="label text-muted">Ficha de avaliação</p>
            <p className="label text-faint">Brian iPhones</p>
          </div>
          <dl className="mt-6 font-mono text-[12px]">
            {[
              ["Modelo", t.model],
              ["Armaz.", t.storage],
              ["Cor", t.color],
              ["Bateria", unknownBattery ? "Não sei" : `${t.battery}%`],
              [
                "Peças",
                noneReplaced ? "Originais" : t.replacedParts.length ? t.replacedParts.join(", ") : "",
              ],
              ["Estado", DEVICE_CONDITIONS.find((c) => c.id === t.condition)?.label ?? ""],
              ["Fotos", t.photos.length ? `${t.photos.length} de 6` : ""],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 border-b border-dashed border-line py-2.5">
                <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
                <dd className={`text-right ${v ? "text-ink" : "text-faint"}`}>{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="label text-faint">por</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className={`mt-5 text-[22px] font-semibold tracking-[-0.015em] ${t.desired ? "" : "text-faint"}`}>
            {t.desired || "O aparelho que você quer"}
          </p>
          {t.photos.length > 0 && (
            <div className="mt-6 flex gap-2">
              {t.photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-12 w-12 rounded-[4px] object-cover" />
              ))}
            </div>
          )}
          <p className="mt-8 text-[12px] leading-[1.6] text-faint">
            A avaliação final é feita com o aparelho em mãos, na loja. O valor do WhatsApp é uma estimativa com base nas informações e fotos.
          </p>
        </div>
      </aside>
    </div>
  );
}
