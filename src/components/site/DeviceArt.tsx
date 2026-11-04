import type { Category } from "@/lib/types";

function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function isLight(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

type Props = {
  category: Category;
  name: string;
  color: string;
  className?: string;
  id: string;
};

/**
 * Ilustração vetorial neutra do aparelho — usada enquanto o produto não tem foto.
 * Assim que o dono sobe uma foto real no admin, ela substitui o desenho.
 */
export function DeviceArt({ category, name, color, className, id }: Props) {
  const gid = `g-${id}`;
  const stroke = shade(color, isLight(color) ? -38 : 28);

  if (category === "macbook") {
    return (
      <svg viewBox="0 0 400 260" className={className} role="img" aria-label={name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(color, 18)} />
            <stop offset="1" stopColor={shade(color, -22)} />
          </linearGradient>
        </defs>
        <rect x="62" y="20" width="276" height="182" rx="12" fill={shade(color, -10)} />
        <rect x="70" y="28" width="260" height="166" rx="5" fill="#101012" />
        <rect x="186" y="28" width="28" height="7" rx="3.5" fill="#000" />
        <path d="M22 206 H378 L366 226 Q362 232 352 232 H48 Q38 232 34 226 Z" fill={`url(#${gid})`} />
        <path d="M172 206 H228 Q226 212 218 212 H182 Q174 212 172 206Z" fill={stroke} opacity="0.6" />
      </svg>
    );
  }

  if (category === "ipad") {
    return (
      <svg viewBox="0 0 300 400" className={className} role="img" aria-label={name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(color, 22)} />
            <stop offset="1" stopColor={shade(color, -20)} />
          </linearGradient>
        </defs>
        <rect x="30" y="20" width="240" height="360" rx="22" fill={`url(#${gid})`} stroke={stroke} strokeWidth="1.5" />
        <rect x="50" y="44" width="34" height="34" rx="10" fill={shade(color, -14)} />
        <circle cx="67" cy="61" r="9" fill="#141416" stroke={stroke} strokeWidth="2" />
        <circle cx="64" cy="58" r="2.4" fill="#4a5568" opacity="0.7" />
      </svg>
    );
  }

  if (category === "watch") {
    return (
      <svg viewBox="0 0 240 400" className={className} role="img" aria-label={name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(color, 22)} />
            <stop offset="1" stopColor={shade(color, -24)} />
          </linearGradient>
        </defs>
        <path d="M78 20 H162 L170 120 H70 Z" fill={shade(color, -30)} />
        <path d="M70 280 H170 L162 380 H78 Z" fill={shade(color, -30)} />
        <rect x="52" y="110" width="136" height="180" rx="40" fill={`url(#${gid})`} stroke={stroke} strokeWidth="1.5" />
        <rect x="64" y="122" width="112" height="156" rx="30" fill="#0d0d0f" />
        <rect x="188" y="160" width="9" height="34" rx="4" fill={shade(color, -18)} />
        <text x="120" y="208" textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="30" fill="#e9e6df" fontWeight="500">
          10:09
        </text>
      </svg>
    );
  }

  if (category === "acessorio") {
    return (
      <svg viewBox="0 0 300 300" className={className} role="img" aria-label={name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d9d7d2" />
          </linearGradient>
        </defs>
        <rect x="60" y="70" width="180" height="160" rx="54" fill={`url(#${gid})`} stroke="#c9c6bf" strokeWidth="1.5" />
        <line x1="62" y1="120" x2="238" y2="120" stroke="#c9c6bf" strokeWidth="1.5" />
        <circle cx="150" cy="170" r="4" fill="#b9b6ae" />
      </svg>
    );
  }

  // iPhone
  const lower = name.toLowerCase();
  const isPro = lower.includes("pro");
  const isAir = lower.includes("air");
  const isNew17 = lower.includes("17") || isAir;

  const lens = (cx: number, cy: number, r = 15) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r + 3} fill={shade(color, -26)} />
      <circle cx={cx} cy={cy} r={r} fill="#0e0f12" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#1b2130" />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.18} fill="#8fa0bf" opacity="0.55" />
    </g>
  );

  return (
    <svg viewBox="0 0 200 400" className={className} role="img" aria-label={name}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, 20)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -22)} />
        </linearGradient>
      </defs>
      <rect x="12" y="8" width="176" height="384" rx="34" fill={shade(color, -16)} />
      <rect x="16" y="12" width="168" height="376" rx="30" fill={`url(#${gid})`} />
      {isAir ? (
        <>
          <rect x="16" y="30" width="168" height="44" rx="22" fill={shade(color, -8)} stroke={stroke} strokeWidth="1" />
          {lens(46, 52, 12)}
          <circle cx="92" cy="52" r="4" fill={shade(color, -30)} />
        </>
      ) : isPro && isNew17 ? (
        <>
          <rect x="16" y="22" width="168" height="104" rx="26" fill={shade(color, -6)} stroke={stroke} strokeWidth="1" />
          {lens(52, 52)}
          {lens(52, 96)}
          {lens(94, 74)}
          <circle cx="150" cy="52" r="6" fill={shade(color, -32)} />
          <circle cx="150" cy="96" r="4" fill={shade(color, -32)} />
        </>
      ) : isPro ? (
        <>
          <rect x="26" y="24" width="100" height="100" rx="26" fill={shade(color, -6)} stroke={stroke} strokeWidth="1" />
          {lens(54, 52)}
          {lens(54, 96)}
          {lens(98, 74)}
          <circle cx="104" cy="44" r="5" fill={shade(color, -32)} />
          <circle cx="104" cy="104" r="4" fill={shade(color, -32)} />
        </>
      ) : (
        <>
          <rect x="26" y="24" width="64" height="104" rx="22" fill={shade(color, -6)} stroke={stroke} strokeWidth="1" />
          {lens(58, 54, 14)}
          {lens(58, 98, 14)}
          <circle cx="104" cy="54" r="4" fill={shade(color, -30)} />
        </>
      )}
    </svg>
  );
}
