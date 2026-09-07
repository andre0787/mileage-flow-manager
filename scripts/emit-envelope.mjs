#!/usr/bin/env node

/**
 * emit-envelope.mjs — Emite um envelope §19 (P7 Telemetry) para o pipeline real.
 *
 * Anexa o envelope em docs/tracking/envelopes.jsonl (canônico, commitado) e
 * tenta insert direto na ai_telemetry (upsert idempotente em event_id) quando
 * houver SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY no env ou no .env local.
 * Fail-open: nunca quebra o chamador (session-start/pre-pr/session-end).
 *
 * Uso:
 *   node scripts/emit-envelope.mjs --type execution.started --role task \
 *     [--task <id>] [--duration-ms <n>] [--fail] [--desc "<texto>"]
 *
 * Tipos persistíveis: execution.* | agent.* | graph.query.*
 * Roles mapeados no DAG (pipeline-definition.ts): task, classifier, graph-*,
 * architect, implementer, tester, reviewer, tools, result, final-validator.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (fallback SUPABASE_ANON_KEY).
 *      Variáveis do .env local são carregadas (sem sobrescrever o env).
 *
 * ponytail: stdlib, zero deps.
 */

import { appendFileSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENVELOPES_PATH = resolve(ROOT, "docs/tracking/envelopes.jsonl");

/** Tipos que a ai_telemetry aceita (espelha PERSISTABLE de telemetry-persist.mjs). */
const PERSISTABLE = /^(execution\.|agent\.|graph\.query\.)/;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

/** Carrega KEY=VALUE do .env local (sem sobrescrever env existente). */
function loadDotEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key] === undefined) {
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  }
}

function gitBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Constrói o envelope (puro, testável). Campos ausentes são omitidos —
 * o persist (script + REST) trata undefined como NULL/0.
 * @param {{ type: string, role: string, task?: string|null, durationMs?: number|null, success?: boolean, desc?: string|null, branch?: string }} input
 */
export function buildEnvelope(input) {
  const eventType = String(input.type || "");
  if (!PERSISTABLE.test(eventType)) {
    throw new Error(`eventType não persistível: "${eventType}" (use execution.* | agent.* | graph.query.*)`);
  }
  const role = String(input.role || "").trim();
  if (!role) throw new Error("agentRole obrigatório (--role)");
  const env = {
    eventId: `env-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventType,
    timestamp: new Date().toISOString(),
    sessionId: input.branch || gitBranch(),
    agentAdapter: "milescontrol",
    agentRole: role,
    success: input.success !== false,
    errorCode: null,
  };
  if (input.task) env.taskId = String(input.task);
  if (input.durationMs !== undefined && input.durationMs !== null) {
    const ms = Number(input.durationMs);
    if (Number.isFinite(ms) && ms >= 0) env.durationMs = Math.round(ms);
  }
  if (input.desc) env.phase = String(input.desc).slice(0, 120);
  return env;
}

function restUpsert(env) {
  const url = process.env.SUPABASE_URL || "https://ohyplfpcwxzakujjfwdf.supabase.co";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) return "(sem credenciais — só envelopes.jsonl)";
  const tokensUsed = 0;
  const record = {
    event_id: env.eventId,
    user_id: process.env.SUPABASE_SERVICE_KEY ? null : undefined,
    session_id: env.sessionId,
    area: env.agentRole,
    tokens_used: tokensUsed,
    prompt_tokens_saved_by_pruning: 0,
    total_execution_time_ms: env.durationMs ?? 0,
    cost_estimate: 0,
    success_rate: env.success ? 1 : 0,
    event_type: env.eventType,
    task_id: env.taskId ?? null,
    execution_id: env.executionId ?? null,
    agent_adapter: env.agentAdapter,
    agent_role: env.agentRole,
    model: null,
    tool_calls: null,
    error_code: null,
  };
  if (record.user_id === undefined) delete record.user_id;
  return fetch(`${url}/rest/v1/ai_telemetry?on_conflict=event_id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(record),
  })
    .then((res) => (res.ok ? "insert ok" : `insert falhou (${res.status}) — fail-open`))
    .catch((err) => `sem conexão Supabase (${err.message}) — fail-open`);
}

async function main() {
  const type = arg("type");
  const role = arg("role");
  const task = arg("task");
  const durationMs = arg("duration-ms");
  const desc = arg("desc");
  const success = !flag("fail");

  if (!type || !role) {
    console.error("❌ uso: emit-envelope.mjs --type <execution.*|agent.*|graph.query.*> --role <role> [--task id] [--duration-ms n] [--fail] [--desc txt]");
    process.exit(1);
  }

  let env;
  try {
    env = buildEnvelope({ type, role, task, durationMs, success, desc });
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  // 1) Sink canônico: envelopes.jsonl (o telemetry:persist do nightly lê daqui).
  appendFileSync(ENVELOPES_PATH, JSON.stringify(env) + "\n", "utf8");
  console.log(`📡 envelope ${env.eventType} (${env.agentRole}) → envelopes.jsonl`);

  // 2) Insert direto (fail-open) — DAG atualiza na hora, sem esperar o nightly.
  loadDotEnv();
  const rest = await restUpsert(env);
  console.log(`   ai_telemetry: ${rest}`);
}

if (process.argv[1] === import.meta.filename) {
  main().catch((err) => {
    console.error(`❌ emit-envelope falhou: ${err?.message ?? err}`);
    process.exit(1);
  });
}
