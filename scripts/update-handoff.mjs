#!/usr/bin/env node

/**
 * update-handoff.mjs — Atualiza HANDOFF.md com estado atual do git.
 *
 * Uso:
 *   node scripts/update-handoff.mjs              # preview
 *   node scripts/update-handoff.mjs --write      # atualiza docs/handoff.md
 *
 * Depende de: git, node 22+
 * ponytail: template string + execSync, sem template engine
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const HANDOFF_PATH = join(ROOT, "docs/handoff.md");

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 5_000 }).trim();
  } catch {
    return "n/a";
  }
}

function readCurrent() {
  if (!existsSync(HANDOFF_PATH)) return null;
  return readFileSync(HANDOFF_PATH, "utf8");
}

function parseOldDate(content) {
  if (!content) return null;
  const m = content.match(/> ⏰ Última atualização: (\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function build() {
  const now = new Date().toISOString().slice(0, 10);
  const branch = git("git rev-parse --abbrev-ref HEAD");
  const lastCommit = git("git log -1 --format=%s");
  const lastCommitHash = git("git log -1 --format=%h");
  const originUrl = git("git remote get-url origin").replace(/\.git$/, "");
  const remoteBranch = git(`git rev-parse --abbrev-ref --symbolic-full-name @{upstream} 2>/dev/null || echo "no remote"`);

  // Count PRs
  const prs = git(`gh pr list --state open --json number,title 2>/dev/null || echo "[]"`);

  // Read current handoff for preserving custom notes
  const oldContent = readCurrent();
  const oldDate = parseOldDate(oldContent);

  return [
    "# HANDOFF — MilesControl",
    "",
    `> ⏰ Última atualização: ${now}`,
    oldDate ? `> Anterior: ${oldDate}` : null,
    "",
    "---",
    "",
    "## 🧭 Estado Atual",
    "",
    `- **Branch:** \`${branch}\``,
    `- **Último commit:** \`${lastCommitHash}\` — ${lastCommit}`,
    `- **Remote:** ${remoteBranch}`,
    "",
    "### 📋 PRs Abertos",
    "",
    prs.startsWith("[")
      ? (() => {
          try {
            const list = JSON.parse(prs);
            return list.length === 0
              ? "Nenhum PR aberto."
              : list.map(p => `- #${p.number} — ${p.title}`).join("\n");
          } catch {
            return "n/a";
          }
        })()
      : `Ver em: ${originUrl}/pulls`,
    "",
    "### 📊 Métricas (estimativa local)",
    "",
    (() => {
      try {
        const quality = execSync("node scripts/quality-report.mjs", {
          cwd: ROOT,
          encoding: "utf8",
          timeout: 10_000,
        });
        const testLine = quality.match(/\|\s*\*\*Total\*\*\s*\|\s*\*+\s*(\d+)\s*\*+/);
        const docLine = quality.match(/\|\s*Issues.*?\|\s*(\d+)\s*\|/);
        return [
          "| Métrica | Valor |",
          "|---------|-------|",
          `| Total testes | ${testLine ? testLine[1] : "n/a"} |`,
          `| Docs issues | ${docLine ? docLine[1] : "n/a"} |`,
          `| Branch | ${branch} |`,
          "",
        ].join("\n");
      } catch {
        return "Execute `node scripts/quality-report.mjs` para métricas.";
      }
    })(),
    "",
    "---",
    "",
    "_Atualizado automaticamente por \`scripts/update-handoff.mjs\`_",
    "",
    "## 🧠 Notas da Sessão Atual",
    "",
    "(Adicione notas manuais abaixo desta linha)",
    "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

const result = await build();

function writeHandoff() {
  // Preserva notas manuais (tudo após "## 🧠 Notas da Sessão Atual")
  const oldContent = readCurrent();
  if (oldContent) {
    const notesMatch = oldContent.match(/## 🧠 Notas da Sessão Atual[\s\S]*/);
    if (notesMatch) {
      // Replace only the auto section, preserve notes
      const newAuto = result.replace(/\n## 🧠 Notas da Sessão Atual[\s\S]*$/, "");
      writeFileSync(HANDOFF_PATH, newAuto + "\n" + notesMatch[0] + "\n");
      console.log("✅ docs/handoff.md atualizado (notas preservadas)");
      return;
    }
  }
  writeFileSync(HANDOFF_PATH, result);
  console.log("✅ docs/handoff.md atualizado");
}

if (process.argv.includes("--write")) {
  writeHandoff();
} else {
  console.log(result);
}
