#!/usr/bin/env node

/**
 * rule-38-code-review-gate.mjs — Valida revisão de código por subagente especializado.
 *
 * Todo PR exige que a revisão de código seja feita por um subagente especializado
 * (skill requesting-code-review). A evidência é um evento `code-review:done` no
 * log de processo (docs/tracking/events.jsonl) com branch da branch atual e
 * subagent === true.
 *
 * Regra #38: "Revisão de código por subagente especializado obrigatória antes de PR"
 *
 * ponytail: fs + execSync nativo, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const EVENTS_PATH = resolve(ROOT, "docs/tracking/events.jsonl");

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch { return "?"; }
}

function main() {
  const branch = getBranch();

  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-38: main/master — regra não se aplica");
    return;
  }

  const eventsPath = process.env.PROCESS_EVENTS_PATH || EVENTS_PATH;

  if (!existsSync(eventsPath)) {
    console.error(`❌ rule-38: events.jsonl não encontrado em ${eventsPath}`);
    console.error("   Todo PR exige code review por subagente especializado.");
    console.error("   Ação: despache o reviewer subagente via .pi/skills/requesting-code-review/SKILL.md (template code-reviewer.md)");
    console.error("   e registre: node scripts/event-log.mjs code-review:done \"Review aprovado por subagente\" --meta '{\"subagent\":true,\"verdict\":\"approved\"}'");
    console.error("   Depois re-rode o pre-pr.");
    process.exit(1);
  }

  const lines = readFileSync(eventsPath, "utf8").split("\n").filter(l => l.trim() !== "");

  const found = lines.some(line => {
    try {
      const event = JSON.parse(line);
      return event.type === "code-review:done" && event.branch === branch && event.subagent === true;
    } catch {
      return false;
    }
  });

  if (found) {
    console.log(`  ✅ rule-38: code review por subagente confirmado (evento code-review:done na branch ${branch})`);
    return;
  }

  console.error(`❌ rule-38: nenhuma evidência de code review por subagente na branch ${branch}.`);
  console.error("   Ação: despache o reviewer subagente via .pi/skills/requesting-code-review/SKILL.md (template code-reviewer.md)");
  console.error("   e registre: node scripts/event-log.mjs code-review:done \"Review aprovado por subagente\" --meta '{\"subagent\":true,\"verdict\":\"approved\"}'");
  console.error("   Depois re-rode o pre-pr.");
  process.exit(1);
}

main();
