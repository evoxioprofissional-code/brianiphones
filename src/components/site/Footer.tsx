"use client";

import Link from "next/link";
import { useSettings } from "./useSettings";
import { useDB } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";
import { Logo } from "./Logo";

export function Footer() {
  const s = useSettings();
  const db = useDB();
  const year = db ? new Date().getFullYear() : "";
  const phone = s.whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");

  const cols: { title: string; links: [string, string, boolean?][] }[] = [
    {
      title: "Comprar",
      links: [
        ["iPhone", "/loja?c=iphone"],
        ["Mac", "/loja?c=macbook"],
        ["iPad", "/loja?c=ipad"],
        ["Apple Watch", "/loja?c=watch"],
        ["AirPods e acessórios", "/loja?c=acessorio"],
        ["Seminovos", "/loja?e=seminovo"],
      ],
    },
    {
      title: "Serviços",
      links: [
        ["Troca na entrada", "/troca"],
        ["Reparo", "/reparo"],
        ["Meus pedidos", "/conta"],
      ],
    },
    {
      title: "A loja",
      links: [
        ["Endereço e horário", "/#loja-fisica"],
        ["WhatsApp " + phone, waLink(s.whatsapp, "Olá, Brian! Vim pelo site."), true],
        ["Instagram @" + s.instagram, `https://instagram.com/${s.instagram}`, true],
      ],
    },
  ];

  return (
    <footer className="mt-8 bg-mist text-[12.5px] text-muted">
      <div className="mx-auto max-w-[1100px] px-6 pb-8 pt-12 md:px-8">
        <p className="border-b border-line pb-5 leading-[1.6]">
          Preços à vista no Pix. Parcelamento no cartão pelo Mercado Pago, sujeito às condições da operadora. Garantia da loja informada em cada
          produto. Estoque sujeito a alteração.
        </p>

        <div className="grid gap-8 py-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-[220px] leading-[1.6]">
              {s.address}
              <br />
              {s.city}
              <br />
              {s.hours}
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-semibold text-ink">{c.title}</p>
              <ul className="mt-3 space-y-2.5">
                {c.links.map(([label, href, ext]) => (
                  <li key={label}>
                    {ext ? (
                      <a href={href} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink hover:underline">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="transition-colors hover:text-ink hover:underline">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-line pt-5 md:flex-row">
          <p>© {year} Brian iPhones. Todos os direitos reservados.</p>
          <p>Revenda independente. iPhone, Mac, iPad, Apple Watch e AirPods são marcas da Apple Inc.</p>
        </div>
      </div>
    </footer>
  );
}
