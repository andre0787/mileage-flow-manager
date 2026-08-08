#!/usr/bin/env node

/**
 * rule-39-coding-gate.mjs — Valida codificação por subagente especializado.
 *
 * Toda codificação (mudanças em código) exige execução por um subagente
 * especializado (skills subagent-driven-development / dispatching-parallel-agents).
 * A evidência é um evento `coding:done` no log de processo
 * (docs/tracking/events.jsonl) com branch da branch atual e subagent === true.
 *
 * Regra #39: "Codificação por subagente especializado obrigatória"
 *
 * ponytail: fs + execSync nativo, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const EVENTS_PATH = resolve(ROOT, "docs/tracking/events.jsonl");
const CODE_DIR_RE = /^(src|scripts|tests|\.pi)\//;
const CODE_FILE_RE = /(\.ts|\.tsx|\.mjs|\.js|\.jsx)$/;

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch { return "?"; }
}

/** Retorna paths únicos de arquivos alterados (committed vs base + working tree) */
function getChangedPaths() {
  const paths = new Set();

  // Committed: diff da branch vs base (merge-base com main, fallback HEAD~1)
  try {
    const base = execSync(
      "git merge-base HEAD main 2>/dev/null || git rev-parse HEAD~1",
      { cwd: ROOT, encoding: "utf8", timeout: 3000 },
    ).toString().trim();
    const changed = execSync(`git diff --name-only ${base}...HEAD`, {
      cwd: ROOT, encoding: "utf8", timeout: 3000,
    }).toString().split("\n");
    for (const p of changed) if (p.trim()) paths.add(p.trim());
  } catch { /* ignora erros de git */ }

  // Working tree + staged: git status --porcelain
  try {
    const status = execSync("git status --porcelain", {
      cwd: ROOT, encoding: "utf8", timeout: 3000,
    }).toString().split("\n");
    for (const line of status) {
      if (!line.trim() || line.includes("->")) continue;
      const p = line.slice(3).trim();
      if (p) paths.add(p);
    }
  } catch { /* ignora erros de git */ }

  return [...paths];
}

function main() {
  const branch = getBranch();

  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-39: main/master — regra não se aplica");
    return;
  }

  const changedPaths = getChangedPaths();
  const codePaths = changedPaths.filter(p => CODE_DIR_RE.test(p) || CODE_FILE_RE.test(p));

  if (codePaths.length === 0) {
    console.log("  ⏭️  rule-39: sem mudanças de código — regra não se aplica");
    return;
  }

  const eventsPath = process.env.PROCESS_EVENTS_PATH || EVENTS_PATH;

  if (!existsSync(eventsPath)) {
    console.error(`❌ rule-39: events.jsonl não encontrado em ${eventsPath}`);
    console.error("   Toda codificação exige execução por subagente especializado.");
    console.error("   Ação: execute a implementação via subagente (skills .pi/skills/subagent-driven-development/SKILL.md ou dispatching-parallel-agents)");
    console.error("   e registre: node scripts/event-log.mjs coding:done \"Codificação por subagente concluída\" --meta '{\"subagent\":true,\"skill\":\"subagent-driven-development\"}'");
    console.error("   Depois re-rode o pre-pr.");
    process.exit(1);
  }

  const lines = readFileSync(eventsPath, "utf8").split("\n").filter(l => l.trim() !== "");

  const found = lines.some(line => {
    try {
      const event = JSON.parse(line);
      return event.type === "coding:done" && event.branch === branch && event.subagent === true;
    } catch {
      return false;
    }
  });

  if (found) {
    console.log(`  ✅ rule-39: codificação por subagente confirmada (evento coding:done na branch ${branch})`);
    return;
  }

  console.error(`❌ rule-39: nenhuma evidência de codificação por subagente na branch ${branch}.`);
  console.error("   Ação: execute a implementação via subagente (skills .pi/skills/subagent-driven-development/SKILL.md ou dispatching-parallel-agents)");
  console.error("   e registre: node scripts/event-log.mjs coding:done \"Codificação por subagente concluída\" --meta '{\"subagent\":true,\"skill\":\"subagent-driven-development\"}'");
  console.error("   Depois re-rode o pre-pr.");
  process.exit(1);
}

main();
