"use client";

/**
 * Login provisório do painel — fica só no navegador.
 * NÃO é segurança de verdade: quando o banco for conectado,
 * trocar por autenticação no servidor (ex.: Supabase Auth).
 */
const KEY = "brian-iphones:admin-session";
export const DEMO_USER = "brian";
export const DEMO_PASS = "brian2026";

export function isLogged() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function login(user: string, pass: string) {
  if (user.trim().toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
    localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(KEY);
}
