#!/usr/bin/env node

/**
 * rule-27-council-veredict.mjs — Valida veredito do LLM Council no workflow feature.
 *
 * Se a categoria da tarefa for "feature", verifica que existe ao menos um
 * veredito do council em docs/council/ com data compatível com a sessão atual.
 *
 * Regra #27: "Council obrigatório no workflow feature"
 *
 * ponytail: fs + glob pattern + execSync nativo, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");
const COUNCIL_DIR = resolve(ROOT, "docs/council");

function getBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch { return "?"; }
}

function main() {
  const branch = getBranch();

  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-27: main/master — council não aplicável");
    return;
  }

  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-27: handoff.md não encontrado — pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");

  // Extrai categoria da Sessão Atual
  const sessionMatch = content.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!sessionMatch) {
    console.log("  ⏭️  rule-27: sessão atual não definida — pulando");
    return;
  }

  const session = sessionMatch[0];
  const catMatch = session.match(/\*\*Categoria:\*\*\s*(\w+)/);
  if (!catMatch) {
    console.log("  ⏭️  rule-27: categoria não definida — pulando");
    return;
  }

  const category = catMatch[1].toLowerCase();

  // Só valida para feature (council é etapa obrigatória do workflow feature)
  if (category !== "feature") {
    console.log(`  ⏭️  rule-27: categoria "${category}" — council não obrigatório`);
    return;
  }

  // Verifica se docs/council/ existe e tem arquivos
  if (!existsSync(COUNCIL_DIR)) {
    console.error("❌ rule-27: docs/council/ não encontrado.");
    console.error("   Workflow feature exige council antes de implementar.");
    console.error("   Ação: execute o council-to-superpowers →");
    console.error("   .pi/skills/council-to-superpowers/SKILL.md (5 advisors + peer review + chairman)");
    console.error("   e salve o veredito em docs/council/YYYY-MM-DD-<tema>-veredito.md");
    process.exit(1);
  }

  const councilFiles = readdirSync(COUNCIL_DIR)
    .filter(f => f.endsWith(".md") && f.includes("veredito"));

  if (councilFiles.length === 0) {
    console.error("❌ rule-27: nenhum veredito do council encontrado em docs/council/");
    console.error("   Ação: rode o council-to-superpowers (skill em .pi/skills/council-to-superpowers/SKILL.md)");
    console.error("   e salve o veredito com as seções canônicas. Exemplo:");
    console.error("   docs/council/2026-08-05-<tema>-veredito.md");
    process.exit(1);
  }

  // Pega o veredito mais recente
  const latest = councilFiles.sort().reverse()[0];
  const latestPath = resolve(COUNCIL_DIR, latest);
  const verdictContent = readFileSync(latestPath, "utf8");

  // Valida seções mínimas
  const requiredSections = ["# Veredito", "## Advisors", "## Síntese do Chairman"];
  const missing = requiredSections.filter(s => !verdictContent.includes(s));

  if (missing.length > 0) {
    console.error(`❌ rule-27: veredito ${latest} sem seções obrigatórias: ${missing.join(", ")}`);
    console.error("   Adicione as seções canônicas ao arquivo do veredito:");
    console.error("   - ## Advisors (5 advisors: Contrarian, First Principles, Expansionist, Outsider, Executor + peer review)");
    console.error("   - ## Síntese do Chairman (veredito final + próximos passos)");
    console.error("   Depois re-rode o pre-pr.");
    process.exit(1);
  }

  console.log(`  ✅ rule-27: council veredito encontrado (${latest})`);
}

main();
