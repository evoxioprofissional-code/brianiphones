"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

/** Barra que aparece na tela e some na impressão */
export function PrintToolbar({ title, count, onPrint, children }: { title: string; count: number; onPrint: () => void; children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-[1100px] flex-wrap items-center gap-3 px-5">
        <button onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5" aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">{title}</p>
          <p className="text-[12.5px] text-muted">
            {count} {count === 1 ? "pedido" : "pedidos"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {children}
          <button onClick={onPrint} disabled={!count} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0071e3] px-5 text-[14px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-40">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
