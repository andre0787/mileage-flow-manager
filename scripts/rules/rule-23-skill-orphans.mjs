#!/usr/bin/env node

/**
 * rule-23-skill-orphans.mjs — Verifica regra #23: skills referenciadas existem.
 *
 * Skills que o council-to-superpowers referencia mas não existem em .pi/skills/
 * causam falha silenciosa no workflow. Esta regra garante que toda skill
 * referenciada existe (como diretório ou symlink válido).
 *
 * Uso: node scripts/rules/rule-23-skill-orphans.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";

const SKILLS_DIR = resolve(ROOT, ".pi/skills");

// Skills que o repositório referencia (por nome)
// Fonte: AGENTS.md (regra 8), council-to-superpowers, small-model-execution
const REFERENCED_SKILLS = [
  "llm-council",
  "brainstorming",
  "writing-plans",
  "using-git-worktrees",
  "test-driven-development",
  "subagent-driven-development",
  "executing-plans",
  "requesting-code-review",
  "finishing-a-development-branch",
  "systematic-debugging",
  "verification-before-completion",
  "dispatching-parallel-agents",
  "receiving-code-review",
  "small-model-execution",
];

// Skills que existem no Superpowers mas não estão em .pi/skills/ (podem ser úteis)
const SUPERPOWERS_ONLY = [
  "using-superpowers",
  "writing-skills",
];

const errors = [];

// Check 1: referenced skills exist
for (const skill of REFERENCED_SKILLS) {
  const skillPath = join(SKILLS_DIR, skill, "SKILL.md");
  if (!existsSync(skillPath)) {
    errors.push(`Skill referenciada mas não existe: .pi/skills/${skill}/SKILL.md`);
  }
}

// Check 2: symlinks are valid (not broken)
const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isSymbolicLink()) {
    const target = resolve(SKILLS_DIR, entry.name);
    if (!existsSync(target)) {
      errors.push(`Symlink quebrado: .pi/skills/${entry.name} → (inexistente)`);
    }
  }
}

if (errors.length > 0) {
  for (const e of errors) warn(e);
  err(`${errors.length} skill(s) órfã(s) (regra #23)`);
  process.exit(1);
}

ok("todas as skills referenciadas existem (regra #23)");
