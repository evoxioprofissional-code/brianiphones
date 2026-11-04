"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useEffect } from "react";

/**
 * "Fumaça" que sai da barra de rolagem: nuvens desfocadas na lateral direita,
 * na altura em que a pessoa está na página. Ao rolar, elas descem junto, umas
 * atrasadas das outras (rastro), e somem quando a rolagem para.
 */
export function ScrollGlow() {
  const reduce = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();
  const velocity = useVelocity(scrollY);

  // quanto mais rápido rola, mais aparece; parado, some
  const energy = useMotionValue(0);
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    const off = velocity.on("change", (v) => {
      energy.set(Math.min(1, Math.abs(v) / 900));
      clearTimeout(idle);
      idle = setTimeout(() => energy.set(0), 140);
    });
    return () => {
      off();
      clearTimeout(idle);
    };
  }, [velocity, energy]);
  const fade = useSpring(energy, { stiffness: 60, damping: 18, mass: 0.6 });

  // posição na tela acompanha o progresso da rolagem (como o "pegador" da barra)
  const top = useTransform(scrollYProgress, [0, 1], ["8vh", "72vh"]);
  // três nuvens com atraso diferente: a primeira chega rápido, as outras vêm arrastadas
  const y1 = useSpring(top, { stiffness: 120, damping: 22 });
  const y2 = useSpring(top, { stiffness: 50, damping: 18 });
  const y3 = useSpring(top, { stiffness: 22, damping: 14 });
  // a fumaça "estica" na direção em que você rola
  const stretch = useSpring(useTransform(velocity, [-2500, 0, 2500], [1.5, 1, 1.5]), { stiffness: 80, damping: 20 });

  const o1 = useTransform(fade, [0, 1], [0, 0.6]);
  const o2 = useTransform(fade, [0, 1], [0, 0.45]);
  const o3 = useTransform(fade, [0, 1], [0, 0.32]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      <motion.div style={{ top: y3, opacity: o3, scaleY: stretch }} className="smoke-drift-slow absolute right-[-90px] h-[300px] w-[300px] rounded-full bg-[#7fa8ff] blur-[70px]" />
      <motion.div style={{ top: y2, opacity: o2, scaleY: stretch }} className="smoke-drift absolute right-[-70px] h-[220px] w-[220px] rounded-full bg-[#5ac8fa] blur-[55px]" />
      <motion.div style={{ top: y1, opacity: o1 }} className="smoke-drift-fast absolute right-[-50px] h-[150px] w-[150px] rounded-full bg-[#8e9bff] blur-[40px]" />
    </div>
  );
}
