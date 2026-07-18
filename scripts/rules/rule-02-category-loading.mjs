#!/usr/bin/env node

/**
 * rule-02-category-loading.mjs — Valida que os docs carregados correspondem à categoria.
 *
 * Lê docs/handoff.md e verifica se a seção "Docs carregados" contém
 * APENAS os docs esperados para a categoria declarada.
 *
 * Regra #02: "Lazy loading por categoria — AGENTS.md"
 *
 * ponytail: fs + regex, zero deps
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

const CATEGORY_MAP = {
  feature: ["WORKFLOW.md", "CONVENTIONS.md"],
  bugfix: ["DEBUG.md", "CONVENTIONS.md"],
  docs: ["AGENTS.md"],
  refactor: ["CONVENTIONS.md", "ARCHITECTURE.md"],
  chore: ["AGENTS.md"],
};

function main() {
  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-02: handoff.md não encontrado, pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");

  const catMatch = content.match(/-?\s*\*\*Categoria:\*\*\s*(\w+)/);
  if (!catMatch) {
    console.log("  ⏭️  rule-02: categoria não definida no handoff, pulando");
    return;
  }
  const category = catMatch[1];

  const docsMatch = content.match(/-?\s*\*\*Docs carregados:\*\*\s*(.*)/);
  if (!docsMatch) {
    console.error("❌ rule-02: seção 'Docs carregados' não encontrada no handoff.md");
    process.exit(1);
    return;
  }
  const docsLoaded = docsMatch[1].split(",").map(d => d.trim()).filter(Boolean);

  if (!CATEGORY_MAP[category]) {
    console.log(`  ⚠️  rule-02: categoria '${category}' não mapeada, pulando`);
    return;
  }

  const allowedDocs = CATEGORY_MAP[category];
  const violations = docsLoaded.filter(d => !allowedDocs.includes(d));
  if (violations.length > 0) {
    console.error(`❌ rule-02: docs fora da categoria '${category}': ${violations.join(", ")}. Permitidos: ${allowedDocs.join(", ") || "nenhum"}`);
    process.exit(1);
  }

  console.log(`  ✅ rule-02: docs carregados compatíveis com categoria '${category}'`);
}

main();
