#!/usr/bin/env node

/**
 * telemetry-sanity.mjs — Gate do nightly: detecta pipeline de telemetria quebrado.
 *
 * Falha (exit 1) SOMENTE se: SUPABASE_SERVICE_KEY presente, o Supabase respondeu
 * e a ai_telemetry NÃO recebeu nenhuma linha nas últimas 26h. Qualquer outra
 * condição (sem credenciais, rede indisponível) é fail-open — não derruba o
 * nightly por causa de infraestrutura.
 *
 * Uso: node scripts/telemetry-sanity.mjs
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * ponytail: stdlib, zero deps.
 */

const WINDOW_HOURS = 26;

const url = process.env.SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";

// .env local (sem sobrescrever env) — no nightly as credenciais vêm dos secrets.
try {
  const envPath = new URL("../.env", import.meta.url);
  if (await import("fs").then((fs) => fs.existsSync(envPath))) {
    const { readFileSync } = await import("fs");
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^"|"$/g, "");
      }
    }
  }
} catch { /* fail-open */ }

const key = process.env.SUPABASE_SERVICE_KEY;

console.log("── TELEMETRY SANITY ──");

if (!key) {
  console.log("⚠️ SUPABASE_SERVICE_KEY ausente — check ignorado (fail-open)");
  process.exit(0);
}

const since = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();

try {
  const res = await fetch(
    `${url}/rest/v1/ai_telemetry?select=event_id&created_at=gte.${since}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        // Count exato em 1 requisição (sem baixar as linhas).
        Prefer: "count=exact",
        Range: "0-0",
      },
    },
  );
  if (!res.ok) {
    console.log(`⚠️ query falhou (${res.status}) — check ignorado (fail-open)`);
    process.exit(0);
  }
  const range = res.headers.get("content-range") || "";
  const total = Number.parseInt(range.split("/")[1] ?? "0", 10);
  if (!Number.isFinite(total)) {
    console.log("⚠️ content-range ausente — check ignorado (fail-open)");
    process.exit(0);
  }
  if (total === 0) {
    console.error(
      `❌ ai_telemetry sem NENHUMA linha nova em ${WINDOW_HOURS}h — pipeline de telemetria quebrado (persist falhou ou nenhum emissor rodou).`,
    );
    process.exit(1);
  }
  console.log(`✅ ${total} linha(s) nova(s) na ai_telemetry em ${WINDOW_HOURS}h`);
} catch (err) {
  console.log(`⚠️ sem conexão Supabase (${err?.message ?? err}) — check ignorado (fail-open)`);
}
