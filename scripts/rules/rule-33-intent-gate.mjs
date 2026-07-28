#!/usr/bin/env node

/**
 * rule-33-intent-gate.mjs — Valida que o INTENT gate está documentado
 * e referenciado nas skills do projeto.
 *
 * Regra 33: Antes de qualquer mudança de comportamento, declare
 * INTENT: código faz X; teste espera Y; spec diz Z.
 */

import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const COUNCIL_SKILL = resolve(ROOT, ".pi/skills/council-to-superpowers/SKILL.md");
const FABLE_DOC = resolve(ROOT, "docs/fable-gates.md");
const AGENTS = resolve(ROOT, "AGENTS.md");

let pass = true;

// 1. INTENT gate must be documented in fable-gates.md
if (!existsSync(FABLE_DOC)) {
  console.log("  ❌ rule-33: docs/fable-gates.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(FABLE_DOC, "utf8");
  if (!content.includes("## 🧠 INTENT Gate")) {
    console.log("  ❌ rule-33: docs/fable-gates.md não contém seção INTENT Gate");
    pass = false;
  } else {
    console.log("  ✅ rule-33: INTENT Gate documentado em docs/fable-gates.md");
  }
}

// 2. INTENT gate must be in council-to-superpowers skill
if (!existsSync(COUNCIL_SKILL)) {
  console.log("  ❌ rule-33: .pi/skills/council-to-superpowers/SKILL.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(COUNCIL_SKILL, "utf8");
  if (!content.includes("INTENT Gate")) {
    console.log("  ❌ rule-33: council-to-superpowers não contém INTENT Gate");
    pass = false;
  } else {
    console.log("  ✅ rule-33: INTENT Gate presente em council-to-superpowers");
  }
}

// 3. Rule 33 must exist in AGENTS.md
if (!existsSync(AGENTS)) {
  console.log("  ❌ rule-33: AGENTS.md não encontrado");
  pass = false;
} else {
  const content = readFileSync(AGENTS, "utf8");
  if (!content.includes("rule-33")) {
    console.log("  ❌ rule-33: não referenciada em AGENTS.md");
    pass = false;
  } else {
    console.log("  ✅ rule-33: referenciada em AGENTS.md");
  }
}

if (!pass) process.exit(1);
