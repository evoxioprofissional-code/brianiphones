"use client";

import { useEffect, useRef } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("is-in");
    // sem IntersectionObserver (navegador antigo / app embutido): mostra direto
    if (typeof IntersectionObserver === "undefined") return show();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // garantia: nada fica escondido se a animação não disparar
    const t = setTimeout(show, 2500);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  return (
    // @ts-expect-error ref genérico entre tags
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
