#!/usr/bin/env node

/**
 * telemetry-persist.mjs — Persiste envelopes de telemetria (P7, SDD §19-21).
 *
 * Lê docs/tracking/events.jsonl, filtra envelopes persistíveis
 * (eventos execution, agent e graph.query) e insere na ai_telemetry via REST.
 * Fail-open: sem credenciais ou falha de rede → imprime e sai com 0.
 *
 * Uso:
 *   node scripts/telemetry-persist.mjs          # insere envelopes novos
 *   node scripts/telemetry-persist.mjs --dry-run # lista sem inserir
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (fallback ANON), SUPABASE_ANON_KEY
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
const DRY_RUN = process.argv.includes("--dry-run");
const SESSION_ID = process.env.TELEMETRY_SESSION_ID;

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

// ── Espelha src/ai/telemetry/persist.ts (conversão pura) ─────────────────
const PERSISTABLE = /^(execution\.|agent\.|graph\.query\.)/;

function toRecord(env) {
  const tokensUsed = (env.inputTokens ?? 0) + (env.outputTokens ?? 0);
  const costPer1k = 0.003;
  const cost = Math.round((tokensUsed / 1000) * costPer1k * 100000) / 100000;
  return {
    session_id: SESSION_ID || env.sessionId || git("git rev-parse --abbrev-ref HEAD"),
    area: env.agentRole ?? env.agentAdapter ?? null,
    tokens_used: tokensUsed,
    prompt_tokens_saved_by_pruning: env.tokensSaved ?? 0,
    total_execution_time_ms: env.durationMs ?? 0,
    cost_estimate: cost,
    success_rate: env.success ? 1 : 0,
    event_type: env.eventType,
    task_id: env.taskId ?? null,
    execution_id: env.executionId ?? null,
    agent_adapter: env.agentAdapter ?? null,
    agent_role: env.agentRole ?? null,
    model: env.model ?? null,
    tool_calls: env.toolCalls ?? null,
    error_code: env.errorCode ?? null,
  };
}

// ── Executa ───────────────────────────────────────────────────────────────
const events = readEvents();
const envelopes = events
  .filter((e) => typeof e.eventType === "string" && PERSISTABLE.test(e.eventType))
  .map(toRecord);

console.log("── TELEMETRY PERSIST (P7) ──");
console.log(`eventos lidos: ${events.length} · envelopes persistíveis: ${envelopes.length}`);
if (DRY_RUN || envelopes.length === 0) {
  if (envelopes.length > 0) console.log(JSON.stringify(envelopes, null, 2));
  console.log(DRY_RUN ? "(dry-run — nada inserido)" : "(nenhum envelope — nada a inserir)");
  process.exit(0);
}

const url = process.env.SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

let inserted = 0;
for (const record of envelopes) {
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
      inserted += 1;
    } else {
      console.log(`⚠️  insert falhou (${res.status}) — ${record.event_type} (fail-open)`);
    }
  } catch (err) {
    console.log(`⚠️  sem conexão Supabase (${err.message}) — fail-open`);
    break;
  }
}
console.log(`✅ ${inserted}/${envelopes.length} envelopes persistidos na ai_telemetry`);
