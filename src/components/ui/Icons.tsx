type P = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const ArrowRight = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRight = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Plus = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Close = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Check = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M5 12.5 10 17l9-10" />
  </svg>
);

export const Menu = ({ className, size = 20 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const Camera = ({ className, size = 20 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const Trash = ({ className, size = 16 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
  </svg>
);

export const Edit = ({ className, size = 16 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
);

export const Search = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const WhatsApp = ({ className, size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);

export const Instagram = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </svg>
);

export const Pin = ({ className, size = 18 }: P) => (
  <svg {...base(size)} className={className} aria-hidden>
    <path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
