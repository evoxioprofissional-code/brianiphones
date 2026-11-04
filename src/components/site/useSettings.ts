"use client";

import { useDB } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/site";

export function useSettings() {
  const db = useDB();
  return db?.settings ?? DEFAULT_SETTINGS;
}
