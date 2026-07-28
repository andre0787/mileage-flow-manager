#!/usr/bin/env node

/**
 * rule-35-auth-gate.mjs — Valida que o AUTH gate está documentado
 * e referenciado nas skills do projeto.
 *
 * Regra 35: Antes de push/merge/deploy irreversível, exija as
 * palavras exatas do usuário. AUTH: usuário disse "<citação>".
 */

import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const FABLE_DOC = resolve(ROOT, "docs/fable-gates.md");
const AGENTS = resolve(ROOT, "AGENTS.md");

let pass = true;

// 1. AUTH gate must be documented in fable-gates.md
if (!existsSync(FABLE_DOC)) {
  console.log("  ❌ rule-35: docs/fable-gates.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(FABLE_DOC, "utf8");
  if (!content.includes("## 🔐 AUTH Gate")) {
    console.log("  ❌ rule-35: docs/fable-gates.md não contém seção AUTH Gate");
    pass = false;
  } else {
    console.log("  ✅ rule-35: AUTH Gate documentado em docs/fable-gates.md");
  }
}

// 2. Rule 35 must exist in AGENTS.md
if (!existsSync(AGENTS)) {
  console.log("  ❌ rule-35: AGENTS.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(AGENTS, "utf8");
  if (!content.includes("rule-35")) {
    console.log("  ❌ rule-35: não referenciada em AGENTS.md");
    pass = false;
  } else {
    console.log("  ✅ rule-35: referenciada em AGENTS.md");
  }
}

if (!pass) process.exit(1);
