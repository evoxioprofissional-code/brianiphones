"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";

/*
 * Header flutuante, adaptado pra receber o conteúdo por props:
 * no topo ocupa a largura toda; ao rolar vira uma "cápsula" flutuante com
 * borda, sombra e vidro fosco. No celular abre um menu em tela cheia.
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
    // trava a rolagem com o menu aberto
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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

/** Wordmark de exemplo que vem com o componente original (não usado na loja) */
export const WordmarkIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 84 24" fill="currentColor" {...props}>
    <path d="M45.035 23.984c-1.34-.062-2.566-.441-3.777-1.16-1.938-1.152-3.465-3.187-4.02-5.36-.199-.784-.238-1.128-.234-2.058 0-.691.008-.87.062-1.207.23-1.5.852-2.883 1.852-4.144.297-.371 1.023-1.09 1.41-1.387 1.399-1.082 2.84-1.68 4.406-1.816.536-.047 1.528-.02 2.047.054 1.227.184 2.227.543 3.106 1.121 1.277.84 2.5 2.184 3.367 3.7.098.168.172.308.172.312-.004 0-1.047.723-2.32 1.598l-2.711 1.867c-.61.422-2.91 2.008-2.993 2.062l-.074.047-1-1.574c-.55-.867-1.008-1.594-1.012-1.61-.007-.019.922-.648 2.188-1.476 1.215-.793 2.2-1.453 2.191-1.46-.02-.032-.508-.27-.691-.34a5 5 0 0 0-.465-.13c-.371-.09-1.105-.125-1.426-.07-1.285.219-2.336 1.3-2.777 2.852-.215.761-.242 1.636-.074 2.355.129.527.383 1.102.691 1.543.234.332.727.82 1.047 1.031.664.434 1.195.586 1.969.555.613-.023 1.027-.129 1.64-.426 1.184-.574 2.16-1.554 2.828-2.843.122-.235.208-.372.227-.368.082.032 3.77 1.938 3.79 1.961.034.032-.407.93-.696 1.414a12 12 0 0 1-1.051 1.477c-.36.422-1.102 1.14-1.492 1.445a9.9 9.9 0 0 1-3.23 1.684 9.2 9.2 0 0 1-2.95.351M74.441 23.996c-1.488-.043-2.8-.363-4.066-.992-1.687-.848-2.992-2.14-3.793-3.774-.605-1.234-.863-2.402-.863-3.894.004-1.149.176-2.156.527-3.11.14-.378.531-1.171.75-1.515 1.078-1.703 2.758-2.934 4.805-3.524.847-.242 1.465-.332 2.433-.351 1.032-.024 1.743.055 2.48.277l.31.09.007 2.48c.004 1.364 0 2.481-.008 2.481a1 1 0 0 1-.12-.055c-.688-.347-2.09-.488-2.962-.296-.754.167-1.296.453-1.785.945a3.7 3.7 0 0 0-1.043 2.11c-.047.382-.02 1.109.055 1.437a3.4 3.4 0 0 0 .941 1.738c.75.75 1.715 1.102 2.875 1.05.645-.03 1.118-.14 1.563-.366q1.721-.864 2.02-3.145c.035-.293.042-1.266.042-7.957V0H84l-.012 8.434c-.008 7.851-.011 8.457-.054 8.757-.196 1.274-.586 2.25-1.301 3.243-1.293 1.808-3.555 3.07-6.145 3.437-.664.098-1.43.14-2.047.125M9.848 23.574a14 14 0 0 1-1.137-.152c-2.352-.426-4.555-1.781-6.117-3.774-.27-.335-.75-1.05-.95-1.406-1.156-2.047-1.695-4.27-1.64-6.770.047-1.995.43-3.66 1.23-5.316.524-1.086 1.04-1.87 1.793-2.715C4.567 1.72 6.652.535 8.793.171 9.68.02 10.093 0 12.297 0h1.789v5.441l-.961.016c-2.36.04-3.441.215-4.441.719-.836.414-1.278.879-1.895 1.976-.219.399-.535 1.020-.535 1.063 0 .02 1.285.027 3.918.027h3.914v5.113h-3.914c-2.540 0-3.918.008-3.918.028 0 .05.254.597.441.953.344.656.649 1.086 1.051 1.480.668.657 1.356.985 2.445 1.160.645.106 1.274.145 2.610.160l1.285.016v5.442l-2.055-.004a120 120 0 0 1-2.183-.016M16.469 14.715c0-5.504.011-9.04.031-9.29a5.54 5.54 0 0 1 1.527-3.48c.778-.82 1.922-1.457 3.118-1.734C21.915.035 22.422 0 24.39 0h1.652v4.914h-1.426c-1.324 0-1.445.004-1.644.055-.739.191-1.059.699-1.106 1.754l-.015.355h4.191v4.914h-4.184v11.602h-5.390ZM27.023 14.727c0-5.223.012-9.04.028-9.278.129-1.98 1.234-3.68 3.012-4.620.870-.462 1.777-.716 2.851-.802A61 61 0 0 1 34.945 0h1.649v4.914h-1.426c-1.320 0-1.441.004-1.640.055-.739.191-1.063.699-1.106 1.754l-.020.355h4.192v4.914H32.410v11.602h-5.387ZM55.480 15.406V7.220h4.660v1.363c0 1.300.005 1.363.051 1.363.040 0 .075-.054.133-.203.380-.980.969-1.680 1.711-2.031.563-.266 1.422-.430 2.492-.480l.414-.020v4.914l-.414.035c-.738.063-1.597.195-2.058.313-.297.082-.688.280-.875.449-.324.289-.532.703-.625 1.254-.094.547-.098.879-.098 5.144v4.274h-5.390Zm0 0" />
  </svg>
);
