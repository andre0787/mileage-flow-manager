#!/usr/bin/env node

/**
 * prompt-manifest.mjs — Gera/valida manifesto de hashes de prompts.
 *
 * Uso:
 *   node scripts/prompt-manifest.mjs --write    # atualiza .prompts-manifest.json
 *   node scripts/prompt-manifest.mjs --check    # valida (exit 1 se divergir)
 *   node scripts/prompt-manifest.mjs --list     # lista arquivos monitorados
 *
 * ponytail: fs + crypto nativos, zero deps
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

const ROOT = resolve(import.meta.dirname, "..");
const MANIFEST_PATH = resolve(ROOT, ".prompts-manifest.json");
const MANIFEST_VERSION = 1;

// Arquivos monitorados — paths relativos à raiz do projeto
const PROMPT_FILES = [
  // Skills
  ".pi/skills/council-to-superpowers/SKILL.md",
  ".pi/skills/handoff/SKILL.md",
  ".pi/skills/llm-council/SKILL.md",
  ".pi/skills/small-model-execution/SKILL.md",
  // Docs de configuração do agente
  "AGENTS.md",
  "CLAUDE.md",
  // Contexto por diretório (pi ≥ 0.84) — substitui AGENTS.md em docs/tasks/
  "docs/tasks/AGENTS.override.md",
  // Docs de workflow
  "docs/CONTEXT-MANAGEMENT.md",
  "docs/WORKFLOW-MANIFEST.md",
  "docs/WORKFLOW.md",
];

function sha256(filePath) {
  const absPath = resolve(ROOT, filePath);
  if (!existsSync(absPath)) return null;
  const content = readFileSync(absPath);
  return createHash("sha256").update(content).digest("hex");
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }
}

function generateManifest() {
  const prompts = {};
  for (const file of PROMPT_FILES) {
    const hash = sha256(file);
    if (hash) prompts[file] = `sha256-${hash}`;
  }
  return {
    version: MANIFEST_VERSION,
    updatedAt: new Date().toISOString(),
    prompts,
  };
}

function writeManifest() {
  const manifest = generateManifest();
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✅ .prompts-manifest.json atualizado (${Object.keys(manifest.prompts).length} arquivos)`);
  return manifest;
}

function checkManifest() {
  const manifest = readManifest();
  if (!manifest) {
    console.error("❌ .prompts-manifest.json não encontrado. Execute: npm run prompt:manifest");
    process.exit(1);
  }

  if (manifest.version !== MANIFEST_VERSION) {
    console.error(`❌ Versão do manifesto desatualizada (${manifest.version}). Execute: npm run prompt:manifest`);
    process.exit(1);
  }

  let errors = 0;
  let warnings = 0;
  const current = generateManifest();

  for (const file of PROMPT_FILES) {
    const expected = manifest.prompts[file];
    const actual = current.prompts[file];

    if (!expected && actual) {
      console.warn(`  ⚠️  Arquivo monitorado não está no manifesto: ${file}`);
      warnings++;
      continue;
    }

    if (expected && !actual) {
      console.error(`  ❌ Arquivo não encontrado (foi removido?): ${file}`);
      errors++;
      continue;
    }

    if (expected !== actual) {
      console.error(`  ❌ Hash diverge: ${file}`);
      console.error(`     esperado: ${expected}`);
      console.error(`     atual:    ${actual}`);
      console.error(`     Execute: npm run prompt:manifest`);
      errors++;
    }
  }

  // Verifica entradas obsoletas no manifesto (arquivos que não existem mais)
  for (const file of Object.keys(manifest.prompts)) {
    if (!PROMPT_FILES.includes(file)) {
      const absPath = resolve(ROOT, file);
      if (!existsSync(absPath)) {
        console.warn(`  ⚠️  Entrada obsoleta no manifesto (arquivo removido): ${file}`);
        warnings++;
      }
    }
  }

  if (errors > 0) {
    console.error(`\n❌ ${errors} erro(s) de hash. Execute: npm run prompt:manifest`);
    process.exit(1);
  }

  if (warnings > 0) {
    console.log(`  ⚠️  ${warnings} warning(s) — manifesto pode precisar de atualização`);
  }

  console.log(`  ✅ prompt:manifest — ${Object.keys(manifest.prompts).length} arquivos, todos íntegros`);
}

function listFiles() {
  console.log("Arquivos monitorados pelo prompt-manifest:");
  for (const file of PROMPT_FILES) {
    const absPath = resolve(ROOT, file);
    const exists = existsSync(absPath);
    console.log(`  ${exists ? "📄" : "❌"} ${file}`);
  }
}

// ── Main ──
const args = process.argv.slice(2);

if (args.includes("--write")) {
  writeManifest();
} else if (args.includes("--check")) {
  checkManifest();
} else if (args.includes("--list")) {
  listFiles();
} else {
  console.log("Uso: node scripts/prompt-manifest.mjs [--write | --check | --list]");
  process.exit(1);
}
