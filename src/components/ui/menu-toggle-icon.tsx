import { cn } from "@/lib/utils";

/** Ícone de menu que vira um X ao abrir (duas linhas que giram) */
export function MenuToggleIcon({
  open,
  className,
  duration = 300,
}: {
  open: boolean;
  className?: string;
  duration?: number;
}) {
  const t = { transitionDuration: `${duration}ms` };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={cn(className)} aria-hidden>
      <path
        d="M4 8h16"
        style={t}
        className={cn("origin-center [transform-box:fill-box] transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]", open && "translate-y-[4px] rotate-45")}
      />
      <path
        d="M4 16h16"
        style={t}
        className={cn("origin-center [transform-box:fill-box] transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]", open && "-translate-y-[4px] -rotate-45")}
      />
    </svg>
  );
}
