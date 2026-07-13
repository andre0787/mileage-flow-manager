#!/usr/bin/env node

/**
 * rule-09-handoff.mjs — Verifica regra #9: docs/handoff.md existe e tem conteúdo.
 *
 * Valida:
 * 1. docs/handoff.md existe
 * 2. Não está vazio (> 100 chars)
 * 3. Contém seções esperadas (Estado Atual, Próximos Passos)
 *
 * Uso: node scripts/rules/rule-09-handoff.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, ROOT } from "../lib.mjs";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const branch = git("git rev-parse --abbrev-ref HEAD");

// Em main/master, não há sessão ativa — HANDOFF não é obrigatório
if (branch === "main" || branch === "master") {
  ok("main/master — HANDOFF não aplicável (regra #9)");
  process.exit(0);
}

const handoffPath = resolve(ROOT, "docs/handoff.md");

if (!existsSync(handoffPath)) {
  err("docs/handoff.md não encontrado (regra #9)");
  err("Crie com: npm run session:start");
  process.exit(1);
}

const content = readFileSync(handoffPath, "utf8").trim();

if (content.length < 100) {
  err("docs/handoff.md muito curto ou vazio (regra #9)");
  process.exit(1);
}

// Verifica se contém seções mínimas esperadas
const contentLower = content.toLowerCase();
const requiredSections = ["estado atual", "próxima sessão"];
const missing = requiredSections.filter(s => !contentLower.includes(s));

if (missing.length > 0) {
  err(`docs/handoff.md sem seções mínimas (regra #9): ${missing.join(", ")}`);
  err("Atualize com: npm run session:start");
  process.exit(1);
}

ok("docs/handoff.md presente e válido (regra #9)");
