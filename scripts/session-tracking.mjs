#!/usr/bin/env node

/**
 * session-tracking.mjs — Visualizador dos eventos de sessão.
 *
 * Uso:
 *   node scripts/session-tracking.mjs                              # últimos 10 eventos
 *   node scripts/session-tracking.mjs --all                        # todos os eventos
 *   node scripts/session-tracking.mjs --type session:start         # filtra por tipo
 *   node scripts/session-tracking.mjs --since 2026-07-28           # desde data
 *   node scripts/session-tracking.mjs --stats                      # estatísticas agregadas
 *
 * ponytail: fs nativo, zero deps
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const LOG_PATH = resolve(ROOT, "docs/tracking/events.jsonl");

function readEvents() {
  if (!existsSync(LOG_PATH)) return [];
  return readFileSync(LOG_PATH, "utf8")
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function filterEvents(events, opts) {
  let filtered = [...events];

  if (opts.type) {
    filtered = filtered.filter((e) => e.type === opts.type);
  }

  if (opts.since) {
    const since = new Date(opts.since).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= since);
  }

  if (!opts.all) {
    filtered = filtered.slice(-10);
  }

  return filtered;
}

function formatEvents(events) {
  if (events.length === 0) {
    console.log("Nenhum evento registrado.");
    return;
  }

  const tipoWidth = Math.max(...events.map((e) => e.type.length), 15);
  const descWidth = Math.max(...events.map((e) => (e.description || "").length), 30);

  console.log(
    `  ${"Timestamp".padEnd(25)} ${"Tipo".padEnd(tipoWidth)} ${"Descrição".padEnd(descWidth)} Branch`
  );
  console.log(
    `  ${"─".repeat(24)}─ ${"─".repeat(tipoWidth)}─ ${"─".repeat(descWidth)}─ ──────`
  );

  for (const event of events) {
    const ts = new Date(event.timestamp).toLocaleString("pt-BR", { timeZone: "UTC" });
    const tipo = event.type.padEnd(tipoWidth);
    const desc = (event.description || "").substring(0, 40).padEnd(descWidth);
    const branch = event.branch || "";
    console.log(`  ${ts.padEnd(25)} ${tipo} ${desc} ${branch}`);
  }
}

function showStats(events) {
  if (events.length === 0) {
    console.log("Nenhum evento registrado.");
    return;
  }

  const tipos = {};
  for (const e of events) {
    tipos[e.type] = (tipos[e.type] || 0) + 1;
  }

  const porDia = {};
  for (const e of events) {
    const dia = e.timestamp.substring(0, 10);
    porDia[dia] = (porDia[dia] || 0) + 1;
  }

  console.log(`\n📊 Estatísticas de Eventos (total: ${events.length})`);
  console.log(`\nPor tipo:`);
  for (const [tipo, count] of Object.entries(tipos).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tipo.padEnd(20)} ${count}`);
  }

  console.log(`\nPor dia:`);
  for (const [dia, count] of Object.entries(porDia).sort()) {
    console.log(`  ${dia.padEnd(15)} ${count} eventos`);
  }

  // Duração da última sessão
  const starts = events.filter((e) => e.type === "session:start");
  const ends = events.filter((e) => e.type === "session:end");

  if (starts.length > 0 && ends.length > 0) {
    const lastStart = new Date(starts[starts.length - 1].timestamp);
    const lastEnd = new Date(ends[ends.length - 1].timestamp);
    const duracao = Math.round((lastEnd - lastStart) / 60000);
    console.log(`\n⏱️  Última sessão: ${duracao} minutos`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const opts = {
    all: args.includes("--all"),
    type: args.includes("--type") ? args[args.indexOf("--type") + 1] : null,
    since: args.includes("--since") ? args[args.indexOf("--since") + 1] : null,
    stats: args.includes("--stats"),
  };

  const events = readEvents();
  if (opts.stats) {
    showStats(events);
    return;
  }

  const filtered = filterEvents(events, opts);
  formatEvents(filtered);
}

main();
