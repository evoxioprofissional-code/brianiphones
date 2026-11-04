"use client";

import { useEffect, useRef, useState } from "react";

/** Paleta validada (scripts/validate_palette.js, light, 2 slots) */
export const SERIES = ["#3f62b0", "#b98a35"] as const;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

type Tip = { x: number; y: number; title: string; rows: { color: string; label: string; value: string }[] } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 -translate-y-full rounded-[6px] border border-line bg-card px-3 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]"
      style={{ left: tip.x, top: tip.y - 10 }}
    >
      <p className="label text-[10px] text-muted">{tip.title}</p>
      <div className="mt-1.5 space-y-1">
        {tip.rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[12px] text-muted">
              <span className="h-[2px] w-3 rounded-full" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="text-[13px] font-semibold text-ink tabular">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; kind?: "rect" | "line" }[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2 text-[12px] text-muted">
          {i.kind === "line" ? (
            <span className="h-[2px] w-3.5 rounded-full" style={{ background: i.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Barras empilhadas (tempo) ---------------- */
export function StackedBars({
  data,
  series,
  format,
  height = 240,
}: {
  data: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
  format: (v: number) => string;
  height?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip>(null);
  const [hover, setHover] = useState<number | null>(null);
  const padL = 56,
    padB = 26,
    padT = 8;
  const max = niceMax(Math.max(...data.map((d) => d.values.reduce((a, b) => a + b, 0)), 0));
  const iw = Math.max(0, w - padL);
  const ih = height - padB - padT;
  const slot = data.length ? iw / data.length : 0;
  const bw = Math.max(2, Math.min(28, slot - Math.max(2, slot * 0.28)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(iw / 64)));

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => (setTip(null), setHover(null))}>
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible">
          {ticks.map((t) => {
            const y = padT + ih - (t / max) * ih;
            return (
              <g key={t}>
                <line x1={padL} x2={w} y1={y} y2={y} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 4"} />
                <text x={padL - 10} y={y + 3.5} textAnchor="end" className="fill-muted font-mono text-[10px]">
                  {format(t)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const x = padL + i * slot + (slot - bw) / 2;
            let acc = 0;
            const total = d.values.reduce((a, b) => a + b, 0);
            return (
              <g
                key={d.label + i}
                opacity={hover === null || hover === i ? 1 : 0.45}
                onPointerMove={() => {
                  setHover(i);
                  setTip({
                    x: padL + i * slot + slot / 2,
                    y: padT + ih - (total / max) * ih,
                    title: d.label,
                    rows: [
                      ...series.map((s, k) => ({ color: s.color, label: s.label, value: format(d.values[k]) })),
                      { color: "transparent", label: "Total", value: format(total) },
                    ],
                  });
                }}
              >
                <rect x={padL + i * slot} y={padT} width={slot} height={ih} fill="transparent" />
                {d.values.map((v, k) => {
                  if (v <= 0) return null;
                  const h = (v / max) * ih;
                  const y = padT + ih - ((acc + v) / max) * ih;
                  acc += v;
                  const isTop = d.values.slice(k + 1).every((n) => n <= 0);
                  const gap = k > 0 ? 2 : 0;
                  return (
                    <path
                      key={k}
                      d={roundedTop(x, y, bw, Math.max(0, h - gap), isTop ? Math.min(4, bw / 2) : 0)}
                      fill={series[k].color}
                    />
                  );
                })}
              </g>
            );
          })}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={padL + i * slot + slot / 2} y={height - 6} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                {d.label}
              </text>
            ) : null,
          )}
        </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  r = Math.min(r, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/* ---------------- Linha + área (tempo, 1 série) ---------------- */
export function AreaLine({
  data,
  color = SERIES[0],
  label,
  format,
  height = 220,
}: {
  data: { label: string; value: number }[];
  color?: string;
  label: string;
  format: (v: number) => string;
  height?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [idx, setIdx] = useState<number | null>(null);
  const padL = 44,
    padB = 26,
    padT = 10;
  const iw = Math.max(0, w - padL - 8);
  const ih = height - padB - padT;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const x = (i: number) => padL + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = data.length ? `${line} L${x(data.length - 1)},${padT + ih} L${x(0)},${padT + ih} Z` : "";
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(iw / 64)));
  const gid = `area-${label.replace(/\W/g, "")}`;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - padL;
    const i = Math.round((px / iw) * (data.length - 1));
    setIdx(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full">
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible" onPointerMove={onMove} onPointerLeave={() => setIdx(null)}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.16" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={padL - 10} y={y(t) + 3.5} textAnchor="end" className="fill-muted font-mono text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                {d.label}
              </text>
            ) : null,
          )}
          {idx !== null && data[idx] && (
            <g>
              <line x1={x(idx)} x2={x(idx)} y1={padT} y2={padT + ih} stroke="var(--color-ink)" strokeOpacity="0.25" />
              <circle cx={x(idx)} cy={y(data[idx].value)} r={5} fill={color} stroke="var(--color-card)" strokeWidth={2} />
            </g>
          )}
          <rect x={padL} y={padT} width={iw} height={ih} fill="transparent" />
        </svg>
      )}
      {idx !== null && data[idx] && (
        <Tooltip
          tip={{ x: x(idx), y: y(data[idx].value), title: data[idx].label, rows: [{ color, label, value: format(data[idx].value) }] }}
        />
      )}
    </div>
  );
}

/* ---------------- Barras horizontais (categorias) ---------------- */
export function HBars({
  data,
  format,
  color = SERIES[0],
}: {
  data: { label: string; value: number; sub?: string }[];
  format: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.label} className="group" title={`${d.label}: ${format(d.value)}`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-graphite">{d.label}</span>
            <span className="text-[13px] font-semibold tabular">
              {format(d.value)}
              {d.sub ? <span className="ml-2 font-normal text-muted">{d.sub}</span> : null}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-paper-2">
            <div
              className="h-2 rounded-full transition-[width] duration-700 group-hover:opacity-85"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
