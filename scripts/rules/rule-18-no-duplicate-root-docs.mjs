#!/usr/bin/env node

/**
 * rule-18-no-duplicate-root-docs.mjs — Impede duplicação de arquivos entre raiz e docs/.
 *
 * Verifica se algum arquivo .md existe tanto na raiz do projeto quanto em docs/
 * (mesmo nome, case-insensitive). Isso evita confusão de merge como a que
 * aconteceu com HANDOFF.md (root + docs/handoff.md com conteúdos diferentes).
 *
 * Ignora: docs/reports/, docs/archive/
 *
 * Uso:
 *   node scripts/rules/rule-18-no-duplicate-root-docs.mjs
 *
 * ponytail: readdirSync + forEach, zero deps
 */

import { readdirSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
let errors = 0;

// Lista arquivos .md na raiz
let rootFiles;
try {
  rootFiles = readdirSync(ROOT).filter(f => f.endsWith(".md") && !f.startsWith("."));
} catch {
  console.log("  ⚠️  não foi possível ler a raiz");
  process.exit(1);
}

// Lista arquivos .md em docs/
let docsFiles;
try {
  docsFiles = readdirSync(resolve(ROOT, "docs"))
    .filter(f => f.endsWith(".md") && !f.startsWith("."));
} catch {
  docsFiles = [];
}

// Mapa de nome lower -> arquivo em docs/
const docsMap = {};
for (const f of docsFiles) {
  docsMap[f.toLowerCase()] = f;
}

// Checa cada arquivo na raiz
for (const file of rootFiles) {
  const lower = file.toLowerCase();
  if (docsMap[lower]) {
    console.log(`  ❌ DUPLICADO: ${file} ≡ docs/${docsMap[lower]}`);
    errors++;
  }
}

if (errors > 0) {
  console.log(`\n  ❌ ${errors} arquivo(s) duplicado(s) entre raiz e docs/.`);
  console.log("     Remova o arquivo duplicado em docs/ e atualize referências.");
  process.exit(1);
} else {
  console.log("  ✅ nenhum arquivo duplicado entre raiz e docs/");
}
