"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";

/*
 * Header flutuante: no topo ocupa a largura toda; ao rolar vira uma
 * "cápsula" com borda, sombra e vidro fosco. No celular abre um menu
 * em tela cheia. Conteúdo (logo, links, botões) chega por props.
 */

export type HeaderLink = { label: string; href: string; active?: boolean };

type HeaderProps = {
  /** logo/marca à esquerda */
  brand: React.ReactNode;
  links: HeaderLink[];
  /** botões à direita no desktop */
  actions?: React.ReactNode;
  /** botões sempre visíveis no celular, ao lado do menu (ex.: sacola) */
  mobileActions?: React.ReactNode;
  /** rodapé do menu do celular */
  mobileFooter?: React.ReactNode;
  /** conteúdo extra dentro do menu do celular, abaixo dos links */
  mobileExtra?: React.ReactNode;
  /** algo preso embaixo do header (ex.: painel de busca) */
  children?: React.ReactNode;
  /** fecha o menu quando muda (ex.: a rota) */
  closeKey?: string;
  renderLink?: (link: HeaderLink, className: string, onClick: () => void) => React.ReactNode;
};

export function Header({ brand, links, actions, mobileActions, mobileFooter, mobileExtra, children, closeKey, renderLink }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [top, setTop] = React.useState(56);
  const scrolled = useScroll(10);
  const ref = React.useRef<HTMLElement>(null);

  // fecha o menu ao trocar de página
  const [lastKey, setLastKey] = React.useState(closeKey);
  if (closeKey !== lastKey) {
    setLastKey(closeKey);
    setOpen(false);
  }

  React.useEffect(() => {
    // trava a rolagem com o menu aberto. Vai no <html>, não no <body>: com o
    // <html> usando overflow-x: clip, travar o body cria outra área de rolagem
    // e o header (sticky) some lá pra cima da página.
    const root = document.documentElement;
    root.style.overflow = open ? "hidden" : "";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  const toggle = () => {
    // o menu começa logo abaixo do header. Se a página já rolou, o header
    // volta pro topo (sai do modo cápsula) e fica com 56px de altura.
    if (!open && ref.current) setTop(scrolled ? 56 : Math.round(ref.current.getBoundingClientRect().bottom));
    setOpen((v) => !v);
  };
  const close = () => setOpen(false);

  const link = (l: HeaderLink, className: string) =>
    renderLink ? (
      renderLink(l, className, close)
    ) : (
      <a key={l.href} href={l.href} className={className} onClick={close}>
        {l.label}
      </a>
    );

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-[1240px] border border-transparent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:rounded-2xl",
        {
          // ao rolar vira cápsula flutuante — no celular também
          "top-2 w-[calc(100%-16px)] rounded-2xl border-border bg-background/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.22)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 md:top-3 md:w-full md:max-w-5xl":
            scrolled && !open,
          "rounded-none bg-background": open,
        },
      )}
    >
      <nav
        className={cn("flex h-14 w-full items-center justify-between gap-4 px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-16 md:px-6", {
          "h-12 px-3 md:h-14 md:px-3": scrolled && !open,
        })}
      >
        <div className="shrink-0">{brand}</div>

        <div className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) =>
            link(
              l,
              buttonVariants({
                variant: "ghost",
                size: "sm",
                className: cn("rounded-full px-3.5 text-[14px] font-normal text-foreground/80 hover:text-foreground", l.active && "font-medium text-foreground"),
              }),
            ),
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 lg:flex">{actions}</div>
          {mobileActions ? <div className="flex items-center gap-1 lg:hidden">{mobileActions}</div> : null}
          <Button size="icon" variant="outline" onClick={toggle} className="rounded-full lg:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>

      {children}

      {/* Menu do celular: abre e fecha com fade, e os itens entram em cascata */}
      <div
        style={{ top }}
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden border-y bg-background/95 backdrop-blur-lg transition-[opacity,visibility] duration-300 ease-out lg:hidden",
          open ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
        )}
      >
        <div
          className={cn(
            "flex h-full w-full origin-top flex-col justify-between gap-y-2 overflow-y-auto p-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-y-0 scale-100" : "-translate-y-3 scale-[0.98]",
          )}
        >
          <div className="grid gap-y-1">
            {links.map((l, i) => (
              <div
                key={l.href}
                style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                className={cn("transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")}
              >
                {link(
                  l,
                  buttonVariants({
                    variant: "ghost",
                    className: cn("h-12 w-full justify-start rounded-xl text-[19px] font-semibold tracking-[-0.02em]", l.active && "bg-mist"),
                  }),
                )}
              </div>
            ))}
            <div
              style={{ transitionDelay: open ? `${80 + links.length * 45}ms` : "0ms" }}
              className={cn("transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")}
            >
              {mobileExtra}
            </div>
          </div>
          {mobileFooter ? (
            <div
              style={{ transitionDelay: open ? "320ms" : "0ms" }}
              className={cn(
                "flex flex-col gap-2 pb-[env(safe-area-inset-bottom)] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              {mobileFooter}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
