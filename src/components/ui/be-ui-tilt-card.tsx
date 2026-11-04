"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Só liga o efeito em aparelhos com mouse (no celular não tem "passar o mouse") */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);

    update();
    mq.addEventListener?.("change", update);

    return () => mq.removeEventListener?.("change", update);
  }, []);

  return canHover;
}

export interface TiltCardProps {
  children: ReactNode;
  /** inclinação máxima, em graus */
  max?: number;
  glare?: boolean;
  /** cor do brilho que segue o mouse (padrão: cor do texto do tema) */
  glareColor?: string;
  /** opacidade do brilho (padrão 0.15) */
  glareOpacity?: number;
  /** sombra azulada ao passar o mouse (padrão: ligada) */
  lift?: boolean;
  className?: string;
}

export function TiltCard({ children, max = 12, glare = true, glareColor = "var(--foreground)", glareOpacity = 0.15, lift = true, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const enabled = !reduce && canHover;
  /** celular / tablet: o efeito vem do toque e da rolagem */
  const touchMode = !reduce && !canHover;
  const touching = useRef(false);
  const [active, setActive] = useState(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const sc = useMotionValue(1);

  const srx = useSpring(rx, SPRING_MOUSE);
  const sry = useSpring(ry, SPRING_MOUSE);
  const ssc = useSpring(sc, SPRING_MOUSE);

  const aim = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    ry.set((px - 0.5) * max);
    rx.set((0.5 - py) * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    aim(e.clientX, e.clientY);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  /* ---- toque: inclina pro lado do dedo, cresce um pouco e acende ---- */
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchMode) return;
    touching.current = true;
    setActive(true);
    sc.set(1.025);
    const t = e.touches[0];
    aim(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchMode || !touching.current) return;
    const t = e.touches[0];
    aim(t.clientX, t.clientY);
  };
  const onTouchEnd = () => {
    if (!touchMode) return;
    touching.current = false;
    setActive(false);
    sc.set(1);
    rx.set(0);
    ry.set(0);
  };

  /* ---- rolagem: inclinação suave conforme o card atravessa a tela ---- */
  useEffect(() => {
    const el = ref.current;
    if (!touchMode || !el) return;
    let raf = 0;
    let visible = false;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!visible || touching.current) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2)));
        rx.set(p * max * 0.45);
        ry.set(0);
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) update();
      },
      { rootMargin: "80px" },
    );
    io.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(raf);
    };
  }, [touchMode, max, rx, ry]);

  const transform = useMotionTemplate`perspective(1000px) rotateX(${srx}deg) rotateY(${sry}deg) scale(${ssc})`;
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glareColor}, transparent 50%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      data-active={active || undefined}
      style={{ transform, backfaceVisibility: "hidden" }}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl [-webkit-tap-highlight-color:transparent] will-change-transform",
        lift && "transition-shadow duration-500 ease-out hover:lift data-[active]:lift",
        className,
      )}
    >
      {children}

      {glare && (enabled || active) ? (
        <motion.div
          aria-hidden
          style={{ background: glareBg, opacity: enabled ? glareOpacity : glareOpacity * 1.6 }}
          className="pointer-events-none absolute inset-0"
        />
      ) : null}
    </motion.div>
  );
}
