"use client";

/**
 * Login do painel.
 * Com Supabase: e-mail e senha do Supabase Auth (cadastro público desligado;
 * o usuário admin é criado no painel do Supabase > Authentication > Users).
 * Sem Supabase: login de demonstração salvo no navegador.
 */

import { useSyncExternalStore } from "react";
import { hasSupabase, sb } from "./supabase";
import { reloadData } from "./store";

const KEY = "brian-iphones:admin-session";
export const DEMO_USER = "brian";
export const DEMO_PASS = "brian2026";

/* ---------- estado da sessão (null = ainda verificando) ---------- */
let logged: boolean | null = null;
let email: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!hasSupabase) {
    logged = localStorage.getItem(KEY) === "1";
    email = logged ? DEMO_USER : null;
    return;
  }
  const c = sb();
  c.auth.getSession().then(({ data }) => {
    logged = !!data.session;
    email = data.session?.user.email ?? null;
    emit();
  });
  c.auth.onAuthStateChange((event, session) => {
    const was = logged;
    logged = !!session;
    email = session?.user.email ?? null;
    emit();
    // entrou ou saiu: recarrega os dados com a permissão certa
    if (was !== null && was !== logged) reloadData();
  });
}

export function useAdminSession(): { logged: boolean | null; email: string | null } {
  const l = useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      start();
      return logged;
    },
    () => null,
  );
  return { logged: l, email };
}

export async function login(user: string, pass: string): Promise<string | null> {
  if (!hasSupabase) {
    if (user.trim().toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
      localStorage.setItem(KEY, "1");
      logged = true;
      email = DEMO_USER;
      emit();
      return null;
    }
    return "Usuário ou senha incorretos.";
  }
  const { error } = await sb().auth.signInWithPassword({ email: user.trim(), password: pass });
  if (error) return error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message;
  return null;
}

export async function logout() {
  if (!hasSupabase) {
    localStorage.removeItem(KEY);
    logged = false;
    email = null;
    emit();
    return;
  }
  await sb().auth.signOut();
}

export const usesSupabaseAuth = hasSupabase;
