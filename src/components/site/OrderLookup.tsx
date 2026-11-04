"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDB } from "@/lib/store";

export function OrderLookup() {
  const router = useRouter();
  const [num, setNum] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(false);
  const inp =
    "h-14 w-full rounded-[12px] border border-[#d2d2d7] bg-white px-4 text-[17px] outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15";
  return (
    <form
      className="mt-8 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = num.replace(/\D/g, "");
        const o = getDB().orders.find((x) => x.number === n && x.customer.email.trim().toLowerCase() === email.trim().toLowerCase());
        setErr(!o);
        if (o) router.push(`/pedido/${o.id}`);
      }}
    >
      <input className={inp} inputMode="numeric" placeholder="Número do pedido (ex.: 1019)" value={num} onChange={(e) => setNum(e.target.value)} />
      <input className={inp} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      {err && <p className="text-[14px] text-bad">Não achamos esse pedido. Confere o número e o e-mail.</p>}
      <button className="btn-accent h-12 w-full rounded-full text-[16px] font-medium">Ver pedido</button>
    </form>
  );
}
