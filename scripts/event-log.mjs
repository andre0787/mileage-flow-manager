#!/usr/bin/env node

/**
 * event-log.mjs — Registrador de eventos leves para observabilidade.
 *
 * Uso:
 *   node scripts/event-log.mjs <tipo> <descrição> [--meta <json>]
 *
 * Tipos:
 *   session:start    — início de sessão
 *   session:end      — fim de sessão
 *   commit           — commit realizado
 *   pre-pr           — validação pré-PR executada
 *   pr:create        — PR criado
 *   pr:merge         — PR mergeado
 *   rule:fail        — regra de validação falhou
 *   custom           — evento customizado
 *
 * Exemplos:
 *   node scripts/event-log.mjs session:start "Início da sessão" --meta '{"branch":"feat/x"}'
 *   node scripts/event-log.mjs commit "feat: implementa X"
 *   node scripts/event-log.mjs rule:fail "rule-29 falhou" --meta '{"file":"SKILL.md"}'
 *
 * ponytail: fs nativo, zero deps
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const ROOT = resolve(import.meta.dirname, "..");
const TRACKING_DIR = resolve(ROOT, "docs/tracking");
const LOG_PATH = resolve(TRACKING_DIR, "events.jsonl");
const MAX_EVENTS = 1000; // mantém apenas os últimos N eventos

const TIPOS_VALIDOS = [
  "session:start",
  "session:end",
  "commit",
  "pre-pr",
  "pr:create",
  "pr:merge",
  "rule:fail",
  "custom",
];

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", timeout: 3000 }).trim();
  } catch {
    return "unknown";
  }
}

function getCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8", timeout: 3000 }).trim();
  } catch {
    return "unknown";
  }
}

function ensureDir() {
  if (!existsSync(TRACKING_DIR)) {
    mkdirSync(TRACKING_DIR, { recursive: true });
  }
}

function appendEvent(event) {
  ensureDir();
  appendFileSync(LOG_PATH, JSON.stringify(event) + "\n", "utf8");
}

function trimLog() {
  if (!existsSync(LOG_PATH)) return;
  const lines = readFileSync(LOG_PATH, "utf8").trimEnd().split("\n");
  if (lines.length > MAX_EVENTS) {
    const trimmed = lines.slice(lines.length - MAX_EVENTS);
    writeFileSync(LOG_PATH, trimmed.join("\n") + "\n", "utf8");
  }
}

function main() {
  const args = process.argv.slice(2);
  const tipo = args[0];
  const descricao = args[1];
  const metaIdx = args.indexOf("--meta");
  const meta = metaIdx >= 0 ? JSON.parse(args[metaIdx + 1] || "{}") : {};

  if (!tipo || !descricao) {
    console.error("❌ Uso: node scripts/event-log.mjs <tipo> <descrição> [--meta <json>]");
    console.error(`   Tipos válidos: ${TIPOS_VALIDOS.join(", ")}`);
    process.exit(1);
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    console.error(`❌ Tipo inválido: "${tipo}". Válidos: ${TIPOS_VALIDOS.join(", ")}`);
    process.exit(1);
  }

  const event = {
    timestamp: new Date().toISOString(),
    type: tipo,
    description: descricao,
    branch: getBranch(),
    commit: getCommit(),
    ...meta,
  };

  appendEvent(event);
  console.log(`  📝 event-log: ${tipo} — ${descricao}`);

  // trim if needed
  trimLog();
}

main();
