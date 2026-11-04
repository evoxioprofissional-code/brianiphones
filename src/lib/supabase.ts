"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true quando o projeto tem as variáveis do Supabase (.env.local / painel da hospedagem) */
export const hasSupabase = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Cliente do Supabase no navegador (chave pública; a segurança fica nas regras RLS do banco) */
export function sb(): SupabaseClient {
  if (!hasSupabase) throw new Error("Supabase não configurado");
  if (!client) {
    client = createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "brian-iphones:auth" },
    });
  }
  return client;
}

/** Envia uma foto (data URL já comprimida) para o Storage e devolve o link público */
export async function uploadProductImage(dataUrl: string): Promise<string> {
  return uploadImage(dataUrl);
}

/** Igual, mas numa pasta (ex.: "banners") */
export async function uploadImage(dataUrl: string, folder = ""): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const path = `${folder ? folder + "/" : ""}${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb().storage.from("products").upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return sb().storage.from("products").getPublicUrl(path).data.publicUrl;
}
