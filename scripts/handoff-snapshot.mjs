#!/usr/bin/env node

/**
 * handoff-snapshot.mjs — Gera snapshot do projeto para o topo do handoff.md.
 *
 * Uso:
 *   node scripts/handoff-snapshot.mjs              # preview
 *   node scripts/handoff-snapshot.mjs --write      # atualiza docs/handoff.md
 *
 * ponytail: fs + execSync, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

function buildSnapshot() {
  const date = new Date().toISOString().slice(0, 10);

  let bugsSection =
    "- nenhum | [ver todos → Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)";
  try {
    const ghOut = execSync(
      `gh issue list --label bug --state open --json number,title --limit 10 2>/dev/null || true`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    ).trim();
    if (ghOut && ghOut !== "[]") {
      const issues = JSON.parse(ghOut);
      if (issues.length > 0) {
        const origin = execSync(
          "git remote get-url origin",
          { cwd: ROOT, encoding: "utf8", timeout: 3000 }
        )
          .trim()
          .replace(/\.git$/, "");
        bugsSection = issues
          .map(
            (i) =>
              `- [#${i.number}](${origin}/issues/${i.number}) — ${i.title}`
          )
          .join("\n");
      }
    }
  } catch {}

  let commits = "n/a";
  try {
    commits = execSync("git log --oneline -3", {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 3000,
    }).trim();
  } catch {}

  return [
    `> ⏰ Snapshot atualizado em: ${date}`,
    "",
    "### 🏗️ Projeto",
    "",
    "**Stack:** React + Vite + Supabase + Tailwind | pt-BR",
    "**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests",
    "**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria",
    "**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR",
    "",
    "### 🐞 Bugs Abertos",
    "",
    bugsSection,
    "",
    "### 📋 Commits Recentes",
    "",
    "```",
    commits,
    "```",
  ].join("\n");
}

function main() {
  const snapshot = buildSnapshot();

  if (process.argv.includes("--write") && existsSync(HANDOFF_PATH)) {
    const current = readFileSync(HANDOFF_PATH, "utf8");

    if (current.includes("## 🏗️ Projeto")) {
      // Substitui bloco do snapshot existente
      const before = current.split("## 🏗️ Projeto")[0];
      const after = current.includes("## 🧭 Estado Atual")
        ? "## 🧭 Estado Atual" +
          current.split("## 🧭 Estado Atual").slice(1).join("## 🧭 Estado Atual")
        : "";
      writeFileSync(
        HANDOFF_PATH,
        before + "## 🏗️ Projeto\n\n" + snapshot + "\n\n" + after
      );
    } else {
      // Insere depois do header (---)
      const lines = current.split("\n");
      const headerEnd = lines.findIndex((l) => l.startsWith("---")) + 1;
      lines.splice(headerEnd, 0, "", "## 🏗️ Projeto", "", snapshot);
      writeFileSync(HANDOFF_PATH, lines.join("\n"));
    }
    console.log("✅ handoff.md snapshot atualizado");
  } else {
    console.log(snapshot);
  }
}

main();
