#!/usr/bin/env node

/**
 * rule-34-twins-check.mjs — Valida que o TWINS check está documentado
 * e referenciado nas skills do projeto.
 *
 * Regra 34: Ao corrigir um bug, busque o mesmo padrão no projeto todo
 * e declare TWINS: searched <padrão> — found <N> locais.
 */

import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const FABLE_DOC = resolve(ROOT, "docs/fable-gates.md");
const AGENTS = resolve(ROOT, "AGENTS.md");

let pass = true;

// 1. TWINS check must be documented in fable-gates.md
if (!existsSync(FABLE_DOC)) {
  console.log("  ❌ rule-34: docs/fable-gates.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(FABLE_DOC, "utf8");
  if (!content.includes("## 🔁 TWINS Check")) {
    console.log("  ❌ rule-34: docs/fable-gates.md não contém seção TWINS Check");
    pass = false;
  } else {
    console.log("  ✅ rule-34: TWINS Check documentado em docs/fable-gates.md");
  }
}

// 2. Rule 34 must exist in AGENTS.md
if (!existsSync(AGENTS)) {
  console.log("  ❌ rule-34: AGENTS.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(AGENTS, "utf8");
  if (!content.includes("rule-34")) {
    console.log("  ❌ rule-34: não referenciada em AGENTS.md");
    pass = false;
  } else {
    console.log("  ✅ rule-34: referenciada em AGENTS.md");
  }
}

if (!pass) process.exit(1);
