#!/usr/bin/env node

/**
 * rule-28-spec-exists.mjs — Valida spec técnica no workflow refactor.
 *
 * Se a categoria da tarefa for "refactor" (ou "feature"), verifica que
 * existe ao menos uma spec em docs/superpowers/specs/ com data compatível
 * com a sessão atual.
 *
 * Regra #28: "Spec obrigatória no workflow refactor"
 *
 * ponytail: fs + glob pattern + execSync nativo, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");
const SPECS_DIR = resolve(ROOT, "docs/superpowers/specs");

const REQUIRES_SPEC = new Set(["refactor", "feature"]);

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch { return "?"; }
}

function main() {
  const branch = getBranch();

  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-28: main/master — spec não aplicável");
    return;
  }

  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-28: handoff.md não encontrado — pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");

  const sessionMatch = content.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!sessionMatch) {
    console.log("  ⏭️  rule-28: sessão atual não definida — pulando");
    return;
  }

  const session = sessionMatch[0];
  const catMatch = session.match(/\*\*Categoria:\*\*\s*(\w+)/);
  if (!catMatch) {
    console.log("  ⏭️  rule-28: categoria não definida — pulando");
    return;
  }

  const category = catMatch[1].toLowerCase();

  if (!REQUIRES_SPEC.has(category)) {
    console.log(`  ⏭️  rule-28: categoria "${category}" — spec não obrigatória`);
    return;
  }

  if (!existsSync(SPECS_DIR)) {
    console.error(`❌ rule-28: docs/superpowers/specs/ não encontrado. Crie o diretório com a spec técnica.`);
    process.exit(1);
  }

  const specFiles = readdirSync(SPECS_DIR)
    .filter(f => f.endsWith(".md"));

  if (specFiles.length === 0) {
    console.error("❌ rule-28: nenhuma spec encontrada em docs/superpowers/specs/");
    console.error("   Workflow refactor/feature exige spec técnica. Execute brainstorming primeiro.");
    process.exit(1);
  }

  // Pega a spec mais recente
  const latest = specFiles.sort().reverse()[0];
  const latestPath = resolve(SPECS_DIR, latest);
  const specContent = readFileSync(latestPath, "utf8");

  // Valida seções mínimas
  const requiredSections = ["# Design", "## Contexto", "## Abordagem"];
  const missing = requiredSections.filter(s => !specContent.includes(s));

  if (missing.length > 0) {
    console.error(`❌ rule-28: spec ${latest} sem seções obrigatórias: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`  ✅ rule-28: spec técnica encontrada (${latest})`);
}

main();
