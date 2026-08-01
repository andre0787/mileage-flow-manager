#!/usr/bin/env node

/**
 * quality-log.mjs — Registro estruturado de métricas de qualidade.
 *
 * As rules 30/31/32 computam métricas (outcome grade, cobertura) durante o
 * pre-pr; este script persiste cada medição em docs/tracking/quality.jsonl
 * (JSONL), fonte única para os KPIs de qualidade na aba "KPIs de Processo".
 *
 * Uso:
 *   node scripts/quality-log.mjs rule-30 '{"outcomeGrade":87}'
 *   node scripts/quality-log.mjs rule-31 '{"covered":8,"total":8,"pct":100}'
 *   node scripts/quality-log.mjs rule-32 '{"covered":3,"total":3,"pct":100}'
 *
 * Ambiente de teste: com VITEST setado (vitest) ou EVENT_LOG_DISABLED,
 * nada é gravado — testes unitários não podem poluir o histórico real.
 *
 * ponytail: fs nativo, zero deps
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const TRACKING_DIR = resolve(ROOT, "docs/tracking");
const QUALITY_PATH = resolve(TRACKING_DIR, "quality.jsonl");
const MAX_LINES = 500; // mantém apenas as últimas N medições

function main() {
  const [rule, metaRaw] = process.argv.slice(2);

  if (!rule) {
    console.error("❌ Uso: node scripts/quality-log.mjs <rule> <json-meta>");
    process.exit(1);
  }

  let meta = {};
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      console.error(`❌ meta inválida: "${metaRaw}" — deve ser JSON`);
      process.exit(1);
    }
  }

  // Hermeticidade: nunca poluir em ambiente de teste
  if (process.env.VITEST || process.env.EVENT_LOG_DISABLED) {
    console.log(`  🔇 quality-log: ${rule} pulado (ambiente de teste)`);
    return;
  }

  if (!existsSync(TRACKING_DIR)) {
    mkdirSync(TRACKING_DIR, { recursive: true });
  }

  const entry = { timestamp: new Date().toISOString(), rule, ...meta };
  appendFileSync(QUALITY_PATH, JSON.stringify(entry) + "\n", "utf8");

  // Trim: mantém apenas as últimas MAX_LINES medições
  if (existsSync(QUALITY_PATH)) {
    const lines = readFileSync(QUALITY_PATH, "utf8").trimEnd().split("\n").filter(Boolean);
    if (lines.length > MAX_LINES) {
      writeFileSync(QUALITY_PATH, lines.slice(-MAX_LINES).join("\n") + "\n", "utf8");
    }
  }

  console.log(`  📊 quality-log: ${rule} — ${JSON.stringify(meta)}`);
}

main();
