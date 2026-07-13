#!/usr/bin/env node

/**
 * rule-13-validations.mjs — Verifica regra #13: toda regra tem validação automática.
 *
 * Lê AGENTS.md, extrai regras numeradas (#1, #2, ... #17) e verifica
 * se existe scripts/rules/rule-XX-*.mjs correspondente.
 *
 * Regras sem script automático possível (processuais/estilo) são ignoradas
 * com aviso, mas NÃO bloqueiam — a regra #13 exige validação "quando possível".
 *
 * Uso: node scripts/rules/rule-13-validations.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";

const AGENTS_PATH = resolve(ROOT, "AGENTS.md");
const RULES_DIR = resolve(ROOT, "scripts/rules");

// ── Regras que NÃO podem ser automatizadas com scripts simples ──
const UNVERIFIABLE = new Set([
  1,  // council-to-superpowers — processo, não código
  3,  // DRY — requer AST analysis
  6,  // Ponytail mode — estilo de desenvolvimento
  12, // Ideias externas — muito vago
]);

// Lê AGENTS.md e extrai linhas que definem regras numeradas: "#N. **Título**"
const agents = readFileSync(AGENTS_PATH, "utf8");
const rulePattern = /^(\d+)\.\s+\*\*/gm;
const definedRules = new Set();
let match;
while ((match = rulePattern.exec(agents)) !== null) {
  definedRules.add(parseInt(match[1]));
}

if (definedRules.size === 0) {
  err("Nenhuma regra numerada encontrada em AGENTS.md");
  process.exit(1);
}

// Lista scripts rules disponíveis
const existingScripts = new Set(
  readdirSync(RULES_DIR)
    .filter(f => f.endsWith(".mjs"))
    .map(f => {
      const m = f.match(/^rule-(\d+)/);
      return m ? parseInt(m[1]) : null;
    })
    .filter(Boolean)
);

let missing = [];
let unverifiableMissing = [];
let extraScripts = [];

for (const num of [...definedRules].sort((a, b) => a - b)) {
  if (UNVERIFIABLE.has(num)) {
    if (!existingScripts.has(num)) {
      unverifiableMissing.push(num);
    }
    continue;
  }
  if (!existingScripts.has(num)) {
    missing.push(num);
  }
}

// Scripts extras (que validam algo não listado como regra numerada em AGENTS.md)
for (const num of [...existingScripts].sort((a, b) => a - b)) {
  if (!definedRules.has(num)) {
    extraScripts.push(num);
  }
}

let hasError = false;

if (missing.length > 0) {
  err(`Regras SEM script de validação: #${missing.join(", #")}`);
  err("Crie scripts/rules/rule-0N-*.mjs para cada uma (ou adicione à UNVERIFIABLE se não for automatizável)");
  hasError = true;
}

if (unverifiableMissing.length > 0) {
  warn(`Regras não-automatizáveis (sem script, OK): #${unverifiableMissing.join(", #")}`);
}

if (extraScripts.length > 0) {
  warn(`Scripts sem regra correspondente em AGENTS.md: rule-${extraScripts.join(", rule-")}`);
}

if (!hasError) {
  ok(`todas as ${definedRules.size} regras têm validação automática (regra #13)`);
}
