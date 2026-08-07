#!/usr/bin/env node

/**
 * rule-29-prompt-version.mjs — Valida que todo prompt/skill modificado
 * teve seu hash atualizado no .prompts-manifest.json.
 *
 * Regra #29: "Todo prompt versionado no manifesto"
 *
 * Uso:
 *   node scripts/rules/rule-29-prompt-version.mjs
 *
 * ponytail: execSync + crypto nativos, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

const ROOT = resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = resolve(ROOT, ".prompts-manifest.json");

// Mesma lista do prompt-manifest.mjs
const PROMPT_FILES = [
  ".pi/skills/council-to-superpowers/SKILL.md",
  ".pi/skills/handoff/SKILL.md",
  ".pi/skills/llm-council/SKILL.md",
  ".pi/skills/small-model-execution/SKILL.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/tasks/AGENTS.override.md",
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

function main() {
  const branch = (() => {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    } catch {
      return "?";
    }
  })();

  if (!existsSync(MANIFEST_PATH)) {
    if (branch === "main" || branch === "master") {
      console.log("  ⏭️  rule-29: main/master — manifesto não encontrado, pulando");
      return;
    }
    console.error("❌ rule-29: .prompts-manifest.json não encontrado. Execute: npm run prompt:manifest");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  let errors = 0;

  for (const file of PROMPT_FILES) {
    const absPath = resolve(ROOT, file);
    if (!existsSync(absPath)) continue;

    // Verifica se o arquivo está modificado (working tree ou staged vs HEAD)
    let isModified = false;
    try {
      const diffStatus = execSync(
        `git diff --name-only HEAD -- "${file}" 2>/dev/null || true`,
        { cwd: ROOT, encoding: "utf8", timeout: 3000 }
      ).trim();
      isModified = diffStatus.length > 0;
    } catch {
      // Se git falhar, assume não modificado
    }

    if (!isModified) continue;

    const expectedHash = manifest.prompts?.[file];
    if (!expectedHash) {
      console.error(`❌ rule-29: "${file}" foi modificado mas não está no manifesto.`);
      console.error(`   Execute: npm run prompt:manifest`);
      errors++;
      continue;
    }

    const actualHash = sha256(file);
    const fullHash = `sha256-${actualHash}`;

    if (fullHash !== expectedHash) {
      console.error(`❌ rule-29: "${file}" foi modificado mas manifesto não foi atualizado.`);
      console.error(`   esperado: ${expectedHash}`);
      console.error(`   atual:    ${fullHash}`);
      console.error(`   Execute: npm run prompt:manifest`);
      errors++;
    }
  }

  if (errors > 0) {
    process.exit(1);
  }

  console.log(`  ✅ rule-29: todos os arquivos monitorados com hashes consistentes`);
}

main();
