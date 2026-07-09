import type { Page } from "@playwright/test";

export const SUPABASE_URL = "https://ohyplfpcwxzakujjfwdf.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

/**
 * Injeta as funções `post(table, body)` e `user_id` no contexto do navegador.
 * Uso: colocar `${API_SETUP}` dentro de um `page.evaluate()` com template literal.
 *
 * @example
 * ```ts
 * const ids = await page.evaluate(() => {
 *   ${API_SETUP}
 *   const oid = crypto.randomUUID();
 *   await post('owners', { id: oid, name: 'Ana' });
 *   return { oid };
 * });
 * ```
 */
export const API_SETUP = `
const _sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
const _session = JSON.parse(_sessionStr);
const _token = _session.access_token;
const userId = _session.user.id;
const post = (table, body) =>
  fetch('${SUPABASE_URL}/rest/v1/' + table, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: '${SUPABASE_ANON_KEY}',
      Authorization: 'Bearer ' + _token,
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  });
`;

/** Busca o token de acesso atual do localStorage */
export function getAccessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const str = localStorage.getItem("sb-ohyplfpcwxzakujjfwdf-auth-token");
    if (!str) return null;
    return JSON.parse(str).access_token ?? null;
  });
}
