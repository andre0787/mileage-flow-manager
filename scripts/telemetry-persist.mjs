#!/usr/bin/env node

/**
 * telemetry-persist.mjs — Persiste envelopes de telemetria (P7, SDD §19-21).
 *
 * Lê docs/tracking/envelopes.jsonl (canônico) + events.jsonl (legado), filtra
 * envelopes persistíveis (eventos execution, agent e graph.query) e insere na
 * ai_telemetry via REST.
 * Fail-open: sem credenciais ou falha de rede → imprime e sai com 0.
 *
 * Uso:
 *   node scripts/telemetry-persist.mjs          # insere envelopes novos
 *   node scripts/telemetry-persist.mjs --dry-run # lista sem inserir
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (fallback ANON), SUPABASE_ANON_KEY
 *
 * ponytail: stdlib, zero deps.
 */

import { readFileSync, writeFileSync, existsSync, openSync, closeSync, unlinkSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EVENTS_PATH = resolve(ROOT, "docs/tracking/events.jsonl");
// Envelopes §19 vivem em arquivo próprio (events.jsonl é process log — rule-36).
const ENVELOPES_PATH = resolve(ROOT, "docs/tracking/envelopes.jsonl");
const DRY_RUN = process.argv.includes("--dry-run");
const SESSION_ID = process.env.TELEMETRY_SESSION_ID;
const USER_ID = process.env.TELEMETRY_USER_ID || process.env.SUPABASE_USER_ID;
const PERSISTED_IDS_PATH = resolve(ROOT, "docs/tracking/telemetry-persisted.json");
const PERSIST_LOCK_PATH = resolve(ROOT, "docs/tracking/.telemetry-persist.lock");
let persistLockFd = null;
let persistLockToken = null;

function processStartTime(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    return stat.split(" ")[21] ?? null;
  } catch {
    return null;
  }
}

function acquirePersistLock() {
  try {
    if (existsSync(PERSIST_LOCK_PATH)) {
      const current = JSON.parse(readFileSync(PERSIST_LOCK_PATH, "utf8"));
      const ownerStart = processStartTime(Number(current.pid));
      if (ownerStart && ownerStart === current.startTime) return false;
      if (Date.now() - statSync(PERSIST_LOCK_PATH).mtimeMs < 3_600_000) return false;
      unlinkSync(PERSIST_LOCK_PATH);
    }
    persistLockToken = `${process.pid}:${Date.now()}:${Math.random()}`;
    persistLockFd = openSync(PERSIST_LOCK_PATH, "wx");
    writeFileSync(persistLockFd, JSON.stringify({
      token: persistLockToken,
      pid: process.pid,
      startTime: processStartTime(process.pid),
    }) + "\n");
    return true;
  } catch {
    try {
      if (existsSync(PERSIST_LOCK_PATH) && Date.now() - statSync(PERSIST_LOCK_PATH).mtimeMs >= 3_600_000) unlinkSync(PERSIST_LOCK_PATH);
    } catch { /* fail-open */ }
    return false;
  }
}

function releasePersistLock() {
  if (persistLockFd === null) return;
  closeSync(persistLockFd);
  persistLockFd = null;
  try {
    const owner = JSON.parse(readFileSync(PERSIST_LOCK_PATH, "utf8"));
    if (owner.token === persistLockToken && existsSync(PERSIST_LOCK_PATH)) unlinkSync(PERSIST_LOCK_PATH);
  } catch { /* fail-open */ }
  persistLockToken = null;
}

process.on("exit", releasePersistLock);

function readPersistedIds() {
  if (!existsSync(PERSISTED_IDS_PATH)) return new Set();
  try {
    const ids = JSON.parse(readFileSync(PERSISTED_IDS_PATH, "utf8"));
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "?";
  }
}

function readEvents() {
  // Lê envelopes.jsonl (canônico) + events.jsonl (legado/process log) — dedupe por eventId.
  const paths = [ENVELOPES_PATH, EVENTS_PATH].filter((p) => existsSync(p));
  const byId = new Map();
  for (const p of paths) {
    for (const line of readFileSync(p, "utf8").split("\n").filter(Boolean)) {
      try {
        const e = JSON.parse(line);
        if (e?.eventId && !byId.has(e.eventId)) byId.set(e.eventId, e);
      } catch {
        /* linha inválida */
      }
    }
  }
  return [...byId.values()];
}

// ── Espelha src/ai/telemetry/persist.ts (conversão pura) ─────────────────
const PERSISTABLE = /^(execution\.|agent\.|graph\.query\.)/;
const validMetric = (value) => value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

function toRecord(env) {
  const tokensUsed = (env.inputTokens ?? 0) + (env.outputTokens ?? 0);
  const costPer1k = 0.003;
  const cost = Math.round((tokensUsed / 1000) * costPer1k * 100000) / 100000;
  return {
    user_id: USER_ID,
    session_id: SESSION_ID || env.sessionId || git("git rev-parse --abbrev-ref HEAD"),
    area: env.agentRole ?? env.agentAdapter ?? null,
    tokens_used: tokensUsed,
    prompt_tokens_saved_by_pruning: env.tokensSaved ?? 0,
    total_execution_time_ms: env.durationMs ?? 0,
    cost_estimate: cost,
    success_rate: env.success === false ? 0 : 1,
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
if (!USER_ID) {
  console.log("⚠️ TELEMETRY_USER_ID ausente — nada persistido (fail-open)");
  process.exit(0);
}

if (!DRY_RUN && !acquirePersistLock()) {
  console.log("ℹ️ outra persistência está em andamento — nada enviado");
  process.exit(0);
}

const events = readEvents();
const persistedIds = readPersistedIds();
const persistableEvents = events.filter(
  (e) =>
    typeof e.eventId === "string" &&
    !persistedIds.has(e.eventId) &&
    typeof e.eventType === "string" &&
    PERSISTABLE.test(e.eventType) &&
    typeof e.model === "string" &&
    e.model.length > 0 &&
    e.model !== "unset" &&
    validMetric(e.inputTokens) &&
    validMetric(e.outputTokens) &&
    validMetric(e.tokensSaved) &&
    validMetric(e.durationMs) &&
    (e.success === undefined || typeof e.success === "boolean"),
);
const envelopes = persistableEvents.map(toRecord);

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
for (let index = 0; index < envelopes.length; index += 1) {
  const record = envelopes[index];
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
      const eventId = persistableEvents[index].eventId;
      persistedIds.add(eventId);
      writeFileSync(PERSISTED_IDS_PATH, JSON.stringify([...persistedIds], null, 2) + "\n");
    } else {
      console.log(`⚠️  insert falhou (${res.status}) — ${record.event_type} (fail-open)`);
    }
  } catch (err) {
    console.log(`⚠️  sem conexão Supabase (${err.message}) — fail-open`);
    break;
  }
}
console.log(`✅ ${inserted}/${envelopes.length} envelopes persistidos na ai_telemetry`);
releasePersistLock();
