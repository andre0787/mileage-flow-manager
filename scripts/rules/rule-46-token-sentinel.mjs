#!/usr/bin/env node

/**
 * rule-46-token-sentinel.mjs — Regra #46 (Token Sentinel)
 *
 * Higiene de contexto e persistência de sessão entre turnos de IA:
 * - HARD FAIL: docs/AI-SESSION-STATE.md ausente ou sem as seções obrigatórias
 *   (estrutura do Blueprint v9.0 — protocolo de transferência entre agentes).
 * - AVISO (não bloqueia): arquivo acima de 50 linhas (limite do blueprint);
 *   checklist de poda (≥20% de ruído) é diretriz subjetiva — registrada como
 *   aviso quando o arquivo está crescendo.
 *
 * Regra #46: "Todo turno de trabalho atualiza docs/AI-SESSION-STATE.md
 * (estrutura obrigatória, ≤50 linhas) como último ato."
 *
 * Uso: node scripts/rules/rule-46-token-sentinel.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const STATE_PATH = resolve(ROOT, "docs/AI-SESSION-STATE.md");
const MAX_LINES = 50;
const REQUIRED_SECTIONS = [
  "# AI Session State",
  "## Última Task",
  "## Estado dos Testes & Qualidade",
  "## Arquivos Modificados & Impacto",
  "## Pendências Imediatas",
  "## Governança de Contexto",
];

function main() {
  if (!existsSync(STATE_PATH)) {
    console.error(
      "❌ rule-46: docs/AI-SESSION-STATE.md ausente — todo turno deve atualizar o protocolo de persistência (estrutura do Blueprint v9.0)",
    );
    process.exit(1);
  }

  const content = readFileSync(STATE_PATH, "utf8");
  const missing = REQUIRED_SECTIONS.filter((s) => !content.includes(s));
  if (missing.length > 0) {
    console.error(
      `❌ rule-46: AI-SESSION-STATE.md sem seções obrigatórias: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const lines = content.split("\n").length;
  if (lines > MAX_LINES) {
    console.log(
      `  ⚠️  rule-46: AI-SESSION-STATE.md com ${lines} linhas (> ${MAX_LINES}) — enxugue (limite do blueprint)`,
    );
  } else {
    console.log(`  ✅ rule-46: AI-SESSION-STATE.md com ${lines} linhas (≤ ${MAX_LINES})`);
  }

  const branch = content.match(/\*\*Branch Atual:\*\*\s*(.+)/);
  if (branch) {
    console.log(`  ✅ rule-46: branch registrada no state (${branch[1].trim()})`);
  }
  console.log("  ✅ rule-46: token sentinel ok");
}

main();
