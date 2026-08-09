#!/usr/bin/env node

/**
 * rule-26-session-started.mjs — Valida que npm run session:start foi executado.
 *
 * Verifica se docs/handoff.md contém seção "Sessão Atual" com:
 * - Categoria definida
 * - Objetivo definido
 * - Timestamp "Iniciada em:" presente
 * - Branch coincide com a branch atual
 *
 * Regra #26: "npm run session:start obrigatório no início de toda sessão"
 *
 * ponytail: fs + regex, zero deps
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

function main() {
  // Em main/master, não há sessão ativa — regra não se aplica
  const branch = (() => {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    } catch {
      return "?";
    }
  })();

  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-26: main/master — session:start não aplicável");
    return;
  }

  if (!existsSync(HANDOFF_PATH)) {
    console.error("❌ rule-26: docs/handoff.md não encontrado. Execute npm run session:start");
    process.exit(1);
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");

  // Verifica seção Sessão Atual
  const sessionMatch = content.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!sessionMatch) {
    console.error("❌ rule-26: seção 'Sessão Atual' não encontrada no handoff.md");
    console.error("   Execute: npm run session:start");
    process.exit(1);
  }

  const session = sessionMatch[0];

  // Sessão encerrada (Status: done) é registro histórico: a branch original
  // (ex: feat/workflow-tab, mergeada via PR) não deve ser validada contra a
  // branch git atual. Skip antes da checagem de branch (espelha o heal).
  const statusMatch = session.match(/\*\*Status:\*\*\s*(.+)/);
  const status = statusMatch ? statusMatch[1].trim() : "";

  if (status === "done") {
    console.log("  ⏭️  rule-26: sessão atual está marcada como 'done' — session:start foi executado anteriormente");
    return;
  }

  // Verifica categoria
  if (!/\*\*Categoria:\*\*/.test(session)) {
    console.error("❌ rule-26: 'Categoria' não definida na Sessão Atual");
    process.exit(1);
  }

  // Verifica objetivo (não pode ser placeholder)
  const objMatch = session.match(/\*\*Objetivo:\*\*\s*(.+)/);
  if (!objMatch || !objMatch[1] || objMatch[1].trim() === "descrição concisa") {
    console.error("❌ rule-26: 'Objetivo' não definido ou ainda é placeholder");
    console.error("   Execute: npm run session:start e informe a categoria e objetivo");
    process.exit(1);
  }

  // Verifica timestamp de início
  if (!/\*\*Iniciada em:\*\*/.test(session)) {
    console.error("❌ rule-26: timestamp 'Iniciada em:' ausente na Sessão Atual");
    console.error("   Esta versão do script exige session-start.mjs atualizado");
    process.exit(1);
  }

  // Verifica se a branch coincide
  const branchMatch = session.match(/\*\*Branch:\*\*\s*`([^`]+)`/);
  if (branchMatch && branchMatch[1] !== branch) {
    console.error(`❌ rule-26: branch na Sessão Atual ("${branchMatch[1]}") difere da branch atual ("${branch}")`);
    console.error("   Execute: npm run session:start para atualizar");
    process.exit(1);
  }

  console.log(`  ✅ rule-26: session:start executado (${status})`);
}

main();
