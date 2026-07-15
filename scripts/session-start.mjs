#!/usr/bin/env node

/**
 * session-start.mjs — Resumo comprimido (~300 tokens) pro início de sessão.
 *
 * Agora usa o snapshot do handoff.md como fonte principal de contexto,
 * sem carregar o arquivo de AGENDA (arquivado em docs/archive/).
 *
 * Uso: node scripts/session-start.mjs
 *
 * ponytail: fs + execSync, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const has = p => existsSync(resolve(ROOT, p));
const read = p => has(p) ? readFileSync(resolve(ROOT, p), "utf8") : null;

const handoff = read("docs/handoff.md");

// Garante que o pre-commit hook está ativo
(() => {
  try {
    execSync("git config core.hooksPath .githooks", { cwd: ROOT, encoding: "utf8", timeout: 3000 });
  } catch {}
})();

const branch = (() => {
  try { return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim(); }
  catch { return "?"; }
})();
const commit = (() => {
  try { return execSync("git log -1 --format='%h — %s'", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim(); }
  catch { return "?"; }
})();
const prs = (() => {
  try {
    const o = execSync("gh pr list --state open --json number,title 2>/dev/null", { cwd: ROOT, encoding: "utf8", timeout: 5000 });
    const l = JSON.parse(o);
    return l.length ? l.map(p => `#${p.number}`).join(", ") : "nenhum";
  } catch { return "?"; }
})();
const status = (() => {
  try {
    const o = execSync("git status --short", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    return o || "limpo";
  } catch { return "?"; }
})();

// Feedback de usuários pendentes — executa 1x
const feedbackOutput = (() => {
  try { return execSync("node scripts/check-feedback.mjs", { cwd: ROOT, encoding: "utf8", timeout: 15000 }).trim(); }
  catch { return "📬 Feedback: ?"; }
})();
const feedback = feedbackOutput.split("\n")[0];
const feedbackItems = feedbackOutput.split("\n").slice(1).join("\n");

// Ideias pendentes (docs/IDEIAS.md)
const ideias = read("docs/IDEIAS.md");
const ideiasPendentes = (ideias || "")
  .split("\n")
  .filter(l => l.trim().startsWith("- [ ]"))
  .map(l => "  " + l.replace("- [ ]", "⬜").trim())
  .join("\n") || "(vazio)";

// Extrai snapshot do handoff (seção ## 🏗️ Projeto)
const snapshotMatch = (handoff || "").match(/## 🏗️ Projeto[\s\S]*?(?=\n---|$)/);
const snapshot = snapshotMatch ? snapshotMatch[0].trim() : "(snapshot não encontrado)";

// Extrai bugs do handoff (seção ### 🐞 Bugs)
const bugsMatch = (handoff || "").match(/### 🐞 Bugs[\s\S]*?(?=\n---|$)/);
const bugs = bugsMatch ? bugsMatch[0].trim() : "### 🐞 Bugs Abertos\n- nenhum";

// Extrai sessão atual do handoff
const sessaoAtual = (handoff || "").match(/## 🎯 Sessão Atual[\s\S]*?(?=\n---|$)/);
const inProgress = sessaoAtual !== null && (handoff || "").includes("**Objetivo:**");

console.log([
  `branch: ${branch}`,
  `commit: ${commit}`,
  `files:  ${status.split("\n").length - 1} pendente(s)`,
  `PRs:    ${prs}`,
  "",
  snapshot,
  "",
  bugs,
  "",
  "## 💭 Ideias pendentes (IDEIAS.md)",
  ideiasPendentes,
  "",
  inProgress ? "▶️  HANDOFF indica algo em andamento — continua." : "",
  ideiasPendentes.includes("⬜") ? "💡 IDEIAS.md tem pendentes — perguntar ao usuário." : "",
  feedbackItems ? `\n## 📬 Feedback de usuários\n${feedbackItems}` : "",
  feedback,
].filter(l => l !== "").join("\n"));
