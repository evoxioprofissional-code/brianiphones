"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackVisit } from "@/lib/store";

export function VisitTracker() {
  const path = usePathname();
  useEffect(() => {
    const key = path.startsWith("/loja/") ? "/loja/produto" : path;
    trackVisit(key);
  }, [path]);
  return null;
}
