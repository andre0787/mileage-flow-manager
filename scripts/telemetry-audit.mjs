#!/usr/bin/env node

/**
 * telemetry-audit.mjs — Auditoria e registro de telemetria da IA (rule-48).
 *
 * Lê docs/tracking/events.jsonl e resume a sessão atual (tempo, eventos);
 * com `--record`, monta um registro ai_telemetry (via src/lib/aiTelemetry) e
 * tenta inserir no Supabase REST (fail-open — sem credenciais, apenas imprime).
 *
 * Uso:
 *   node scripts/telemetry-audit.mjs              # resumo da sessão
 *   node scripts/telemetry-audit.mjs --record     # imprime/insere registro
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY (opcional para insert)
 *
 * ponytail: stdlib, zero deps.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EVENTS_PATH = resolve(ROOT, "docs/tracking/events.jsonl");
const RECORD = process.argv.includes("--record");

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "?";
  }
}

function readEvents() {
  if (!existsSync(EVENTS_PATH)) return [];
  return readFileSync(EVENTS_PATH, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ── Resumo da sessão ───────────────────────────────────────────────────
const events = readEvents();
// Último session:start (o log acumula sessões — o find() pegaria a primeira)
const sessionStart = [...events].reverse().find((e) => e.type === "session:start");
const sessionEnd = events.filter((e) => e.type === "session:end").at(-1);

const startTs = sessionStart ? new Date(sessionStart.timestamp).getTime() : null;
// Sessão ainda aberta (último end anterior ao start) → usa agora
const lastEndTs = sessionEnd ? new Date(sessionEnd.timestamp).getTime() : null;
const endTs =
  startTs !== null && lastEndTs !== null && lastEndTs >= startTs ? lastEndTs : Date.now();
const elapsedMs = startTs ? Math.max(0, endTs - startTs) : 0;

console.log("── TELEMETRY AUDIT ──");
console.log(`branch: ${git("git rev-parse --abbrev-ref HEAD")}`);
console.log(`eventos: ${events.length} (session:start ${sessionStart ? "✓" : "✗"}, session:end ${sessionEnd ? "✓" : "✗"})`);
console.log(`tempo de sessão: ${(elapsedMs / 60000).toFixed(1)} min`);

// Estimativa de tokens: 4 chars/token é heurística comum para texto de código
const totalChars = events.reduce((acc, e) => acc + (e.description?.length ?? 0), 0);
const tokensUsed = Math.max(0, Math.round(totalChars / 4));
console.log(`tokens estimados (heurística descrições): ~${tokensUsed}`);

if (!RECORD) {
  console.log("(use --record para montar/inserir o registro ai_telemetry)");
  process.exit(0);
}

// ── Monta registro (espelha src/lib/aiTelemetry.ts) ─────────────────────
const costPer1k = 0.003;
const costEstimate = Math.round(((tokensUsed / 1000) * costPer1k) * 100000) / 100000;
const record = {
  session_id: sessionStart?.branch ?? git("git rev-parse --abbrev-ref HEAD"),
  area: process.env.TELEMETRY_AREA || "workflow",
  tokens_used: tokensUsed,
  prompt_tokens_saved_by_pruning: 0,
  total_execution_time_ms: elapsedMs,
  cost_estimate: costEstimate,
  success_rate: 1,
};

const url = process.env.SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

try {
  const res = await fetch(`${url}/rest/v1/ai_telemetry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey || anonKey,
      Authorization: `Bearer ${serviceKey || anonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });
  if (res.ok) {
    console.log("✅ registro ai_telemetry inserido no Supabase");
  } else {
    console.log(`⚠️  insert falhou (${res.status}) — registro não persistido (fail-open)`);
    console.log(`   ${JSON.stringify(record)}`);
  }
} catch (err) {
  console.log(`⚠️  sem conexão Supabase (${err.message}) — registro não persistido (fail-open)`);
  console.log(`   ${JSON.stringify(record)}`);
}
