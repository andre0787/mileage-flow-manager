#!/usr/bin/env node

/**
 * migrate-bugs.mjs — Migra bugs da AGENDA.md para GitHub Issues.
 *
 * Lê docs/AGENDA.md, extrai bugs abertos (seção "🐞 Bugs Encontrados → Abertos"),
 * e cria issues no GitHub (dry-run por padrão).
 *
 * Uso:
 *   node scripts/migrate-bugs.mjs              # dry-run (só mostra)
 *   node scripts/migrate-bugs.mjs --apply      # cria issues no GitHub
 *
 * ponytail: fs + execSync, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const AGENDA_PATH = resolve(ROOT, "docs/AGENDA.md");
const DRY_RUN = !process.argv.includes("--apply");

function parseBugs(content) {
  const bugs = [];
  const abertosMatch = content.match(/### Abertos\n([\s\S]*?)(?=\n### |\n##|$)/);
  if (!abertosMatch) return bugs;

  let currentBug = null;
  for (const line of abertosMatch[1].split("\n")) {
    const bugMatch = line.match(/^- \[ \]\s*(.+)/);
    if (bugMatch) {
      if (currentBug) bugs.push(currentBug);
      currentBug = { title: bugMatch[1].trim(), desc: "" };
    } else if (currentBug && line.trim()) {
      currentBug.desc += line.trim() + " ";
    }
  }
  if (currentBug) bugs.push(currentBug);
  return bugs;
}

function main() {
  if (!existsSync(AGENDA_PATH)) {
    console.log("AGENDA.md não encontrado — nada a migrar.");
    return;
  }

  const content = readFileSync(AGENDA_PATH, "utf8");
  const bugs = parseBugs(content);

  if (bugs.length === 0) {
    console.log("✅ Nenhum bug aberto encontrado na AGENDA.md.");
    return;
  }

  console.log(`📋 ${bugs.length} bug(s) encontrado(s) na AGENDA.md:\n`);

  for (const bug of bugs) {
    const desc = `> Bug migrado automaticamente de docs/AGENDA.md\n\n**Descrição:** ${bug.desc || "Sem detalhes."}`;
    console.log(`  ${DRY_RUN ? "🔍 [DRY-RUN]" : "🚀"} ${bug.title}`);

    if (!DRY_RUN) {
      try {
        const result = execSync(
          `gh issue create --title "${bug.title.replace(/"/g, '\\"')}" --body '${desc.replace(/'/g, "'\\''")}' --label bug`,
          { cwd: ROOT, encoding: "utf8", timeout: 10000 }
        ).trim();
        console.log(`     ✅ Criado: ${result}`);
      } catch (e) {
        console.error(`     ❌ Falha ao criar issue: ${e.message}`);
      }
    }
  }

  if (DRY_RUN) {
    console.log("\nModo dry-run. Para criar as issues: node scripts/migrate-bugs.mjs --apply");
  }
}

main();
