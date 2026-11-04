"use client";

import Link from "next/link";
import { useSettings } from "./useSettings";
import { useDB } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";
import { ArrowUpRight } from "@/components/ui/Icons";

export function Footer() {
  const s = useSettings();
  const db = useDB();
  const year = db ? new Date().getFullYear() : "";
  const phone = s.whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1320px] px-5 pt-20 pb-10 md:px-8">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="label text-faint">Brian iPhones · desde 2020</p>
            <p className="display mt-6 text-[44px] md:text-[64px]">
              Passa aqui
              <br />
              <span className="text-faint">na loja.</span>
            </p>
            <a
              href={waLink(s.whatsapp, "Olá, Brian! Vim pelo site.")}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-flex items-center gap-2 border-b border-paper/40 pb-1 text-[15px] hover:border-paper"
            >
              Ou chama no WhatsApp <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-6 md:grid-cols-3">
            <div>
              <p className="label text-faint">Loja</p>
              <ul className="mt-5 space-y-3 text-[14px] text-paper/80">
                <li><Link href="/loja?c=iphone" className="hover:text-paper">iPhone</Link></li>
                <li><Link href="/loja?c=macbook" className="hover:text-paper">MacBook</Link></li>
                <li><Link href="/loja?c=ipad" className="hover:text-paper">iPad</Link></li>
                <li><Link href="/loja?c=watch" className="hover:text-paper">Apple Watch</Link></li>
              </ul>
            </div>
            <div>
              <p className="label text-faint">Serviços</p>
              <ul className="mt-5 space-y-3 text-[14px] text-paper/80">
                <li><Link href="/troca" className="hover:text-paper">Troca na entrada</Link></li>
                <li><Link href="/reparo" className="hover:text-paper">Reparo</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="label text-faint">Contato</p>
              <ul className="mt-5 space-y-3 text-[14px] text-paper/80">
                <li>{phone}</li>
                <li>
                  <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="hover:text-paper">
                    @{s.instagram}
                  </a>
                </li>
                <li>{s.address}</li>
                <li>{s.city}</li>
                <li className="text-paper/55">{s.hours}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-24 select-none overflow-hidden">
          <p
            className="font-sans font-extrabold leading-[0.78] text-paper/[0.07]"
            style={{ fontVariationSettings: '"wdth" 125', fontSize: "clamp(80px, 21vw, 300px)", letterSpacing: "-0.04em" }}
            aria-hidden
          >
            BRIAN
          </p>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-paper/15 pt-6 text-[12px] text-paper/50 md:flex-row">
          <p>© {year} Brian iPhones. iPhone, MacBook, iPad e Apple Watch são marcas da Apple Inc.</p>
          <p>Revenda independente · não somos assistência autorizada Apple.</p>
        </div>
      </div>
    </footer>
  );
}
