#!/usr/bin/env node

/**
 * rule-42-coverage-gate.mjs — Regra #42 (Coverage Gate)
 *
 * Garante que a cobertura de testes (linhas) das áreas de negócio não caia
 * abaixo do limite. Lê coverage/coverage-summary.json (gerado por
 * `npm run coverage` com provider v8).
 *
 * - Relatório AUSENTE → skip (fail-open). O nightly roda `npm run coverage`
 *   seguido deste gate, então a proteção existe no CI mesmo sem relatório local.
 * - total.lines.pct < limite → fail (exit 1).
 * - Relatório com mtime > 7 dias → aviso (não bloqueia; dados possivelmente velhos).
 *
 * Regra #42: "Cobertura de testes ≥ 75% de linhas nas áreas de negócio
 * (src/lib, kpi, workflow) para todo relatório de coverage gerado."
 *
 * Uso: node scripts/rules/rule-42-coverage-gate.mjs
 * Env: COVERAGE_MIN_PCT (padrão 75), MOCK_ROOT (fixtures de teste)
 */

import { readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const REPORT = resolve(ROOT, "coverage/coverage-summary.json");
const MIN_LINES_PCT = Number(process.env.COVERAGE_MIN_PCT ?? 75);
const STALE_DAYS = 7;
const DAY_MS = 86_400_000;

export function checkCoverageGate({ reportPath = REPORT, minLinesPct = MIN_LINES_PCT } = {}) {
  if (!existsSync(reportPath)) {
    console.log(
      "  ⏭️  rule-42: coverage/coverage-summary.json ausente (skip — rode `npm run coverage`; nightly roda o gate)",
    );
    return { pass: true, skipped: true, errors: [] };
  }

  let total;
  try {
    total = JSON.parse(readFileSync(reportPath, "utf8"))?.total?.lines;
  } catch {
    return {
      pass: false,
      skipped: false,
      errors: ["coverage-summary.json inválido ou sem total.lines"],
    };
  }
  if (typeof total?.pct !== "number") {
    return {
      pass: false,
      skipped: false,
      errors: ["coverage-summary.json sem total.lines.pct válido"],
    };
  }

  const pct = total.pct;
  const ageDays = (Date.now() - statSync(reportPath).mtimeMs) / DAY_MS;
  if (ageDays > STALE_DAYS) {
    console.log(
      `  ⚠️  rule-42: relatório com ${Math.round(ageDays)} dias — rode npm run coverage para atualizar`,
    );
  }

  if (pct < minLinesPct) {
    const msg = `cobertura ${pct.toFixed(1)}% abaixo do limite de ${minLinesPct}%`;
    console.error(`❌ rule-42: ${msg}`);
    return { pass: false, skipped: false, errors: [msg] };
  }

  console.log(`  ✅ rule-42: cobertura de linhas ${pct.toFixed(1)}% (limite ${minLinesPct}%)`);
  return { pass: true, skipped: false, errors: [] };
}

// CLI
const results = checkCoverageGate();
if (!results.pass) {
  for (const err of results.errors) console.error(`   • ${err}`);
  process.exit(1);
}
