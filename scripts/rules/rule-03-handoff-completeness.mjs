#!/usr/bin/env node

/**
 * rule-03-handoff-completeness.mjs — Valida que handoff.md tem campos obrigatórios.
 *
 * Regra #03: "Handoff completeness — AGENTS.md"
 *
 * ponytail: fs + regex, zero deps
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

const REQUIRED_SECTIONS = [
  { field: "Projeto", pattern: /## 🏗️ Projeto/ },
  { field: "Estado Atual", pattern: /## 🧭 Estado Atual/ },
  { field: "Branch", pattern: /\*\*Branch:\*\*/ },
  { field: "Bugs Abertos", pattern: /### 🐞 Bugs/ },
  { field: "Sessão Atual", pattern: /## 🎯 Sessão Atual/ },
  { field: "Categoria", pattern: /\*\*Categoria:\*\*/ },
  { field: "Docs carregados", pattern: /\*\*Docs carregados:\*\*/ },
  { field: "Última Sessão", pattern: /## ✅ Última Sessão/ },
];

function main() {
  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-03: handoff.md não encontrado, pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");
  const missing = REQUIRED_SECTIONS.filter(({ field, pattern }) => !pattern.test(content));

  if (missing.length > 0) {
    console.error(`❌ rule-03: seções ausentes no handoff.md: ${missing.map(m => m.field).join(", ")}`);
    process.exit(1);
  }

  console.log(`  ✅ rule-03: handoff.md completo (${REQUIRED_SECTIONS.length}/${REQUIRED_SECTIONS.length} campos)`);
}

main();
