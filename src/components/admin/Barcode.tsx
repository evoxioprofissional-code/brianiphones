import { code128 } from "@/lib/admin";

/** Código de barras Code 128 em SVG (lido por leitores comuns) */
export function Barcode({ value, height = 48, className }: { value: string; height?: number; className?: string }) {
  const widths = code128(value);
  const quiet = 10;
  const total = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  let x = quiet;
  const bars: { x: number; w: number }[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  });
  return (
    <svg viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" className={className} role="img" aria-label={`Código de barras ${value}`}>
      <rect width={total} height={height} fill="#fff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000" />
      ))}
    </svg>
  );
}
