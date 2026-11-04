type Props = { className?: string; tone?: "ink" | "paper"; compact?: boolean };

/**
 * Wordmark em tipografia (sem o símbolo da Apple, que é marca registrada).
 * Mantém a estrutura da logo original: BRIAN em bloco, IPHONES espaçado embaixo.
 */
export function Logo({ className = "", tone = "ink", compact = false }: Props) {
  const color = tone === "ink" ? "text-ink" : "text-paper";
  const brian = "";
  return (
    <span className={`inline-flex flex-col leading-none select-none ${color} ${className}`} aria-label="Brian iPhones">
      <span
        className={`font-brand font-extrabold ${brian}`}
        style={{ fontVariationSettings: '"wdth" 125', letterSpacing: "-0.01em", fontSize: compact ? 18 : 22 }}
      >
        BRIAN
      </span>
      <span
        className="font-brand font-semibold"
        style={{ fontSize: compact ? 7.5 : 9, letterSpacing: compact ? "0.62em" : "0.66em", marginTop: 3 }}
      >
        IPHONES
      </span>
    </span>
  );
}
