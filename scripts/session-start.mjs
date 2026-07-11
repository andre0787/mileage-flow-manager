#!/usr/bin/env node

/**
 * session-start.mjs — Resumo comprimido (~400 tokens) pro início de sessão.
 *
 * Uso: node scripts/session-start.mjs
 *
 * ponytail: fs + execSync, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const has = p => existsSync(resolve(ROOT, p));
const read = p => has(p) ? readFileSync(resolve(ROOT, p), "utf8") : null;

const handoff = read("HANDOFF.md");
const agenda = read("docs/AGENDA.md");

// Garante que o pre-commit hook está ativo
(() => { try { execSync("git config core.hooksPath .githooks", { cwd: ROOT, encoding: "utf8", timeout: 3000 }); } catch {} })();

const branch = (() => { try { return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim(); } catch { return "?"; } })();
const commit = (() => { try { return execSync("git log -1 --format='%h — %s'", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim(); } catch { return "?"; } })();
const prs = (() => { try { const o = execSync("gh pr list --state open --json number,title 2>/dev/null", { cwd: ROOT, encoding: "utf8", timeout: 5000 }); const l = JSON.parse(o); return l.length ? l.map(p => `#${p.number}`).join(", ") : "nenhum"; } catch { return "?"; } })();
const status = (() => { try { const o = execSync("git status --short", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim(); return o || "limpo"; } catch { return "?"; } })();

// Feedback de usuários pendentes — executa 1x
const feedbackOutput = (() => {
  try { return execSync("node scripts/check-feedback.mjs", { cwd: ROOT, encoding: "utf8", timeout: 15000 }).trim(); }
  catch { return "📬 Feedback: ?"; }
})();
const feedback = feedbackOutput.split("\n")[0];
const feedbackItems = feedbackOutput.split("\n").slice(1).join("\n");

// Extrai seções compactas da agenda
function sec(txt, start, end) {
  if (!txt) return "";
  const i = txt.indexOf(start);
  if (i < 0) return "";
  const j = end ? txt.indexOf(end, i + 1) : txt.length;
  return txt.slice(i, j > i ? j : txt.length);
}

const sectionAtual = sec(agenda, "## 🎯", "## ✅");
const sectionBacklog = sec(agenda, "## 📌 Backlog Futuro", "## 🐞");

// Conta quantas sprints tem ⬜
const hasPendentes = (sectionAtual + sectionBacklog).includes("- [ ]");

// Backlog items
const backlogItems = (sectionBacklog || "")
  .split("\n")
  .filter(l => l.trim().startsWith("- [ ]"))
  .map(l => "  " + l.replace("- [ ]", "⬜").trim())
  .join("\n") || "(vazio)";

// Bugs abertos
const bugsSec = sec(agenda, "### Abertos", "### Corrigidos");
const bugsOpen = (bugsSec || "")
  .split("\n")
  .filter(l => l.includes("- [ ]"))
  .map(l => "  " + l.replace("- [ ]", "⬜").trim())
  .join("\n");
const bugs = bugsOpen || "(nenhum)";

// Ideias pendentes (docs/IDEIAS.md)
const ideias = read("docs/IDEIAS.md");
const ideiasPendentes = (ideias || "")
  .split("\n")
  .filter(l => l.trim().startsWith("- [ ]"))
  .map(l => "  " + l.replace("- [ ]", "⬜").trim())
  .join("\n") || "(vazio)";

// Sessão atual compacta
const sprintAtual = hasPendentes
  ? (sectionAtual.includes("⬜") ? sectionAtual.slice(0, sectionAtual.indexOf("\n## ") < 0 ? 200 : sectionAtual.indexOf("\n## ")) : "Backlog tem itens pendentes")
  : "(todas sprints concluídas)";

// Handoff: algo em andamento?
const inProgress = (handoff || "").includes("### In Progress") && !(handoff || "").includes("-(nenhum)");

console.log([
  `branch: ${branch}`,
  `commit: ${commit}`,
  `files:  ${status.split("\n").length - 1} pendente(s)`,
  `PRs:    ${prs}`,
  "",
  `## 🎯 Sprint: ${!hasPendentes ? "todas concluídas" : "há pendentes"}`,
  "",
  "## 📌 Backlog futuro",
  backlogItems,
  "",
  "## 💭 Ideias pendentes (IDEIAS.md)",
  ideiasPendentes,
  "",
  "## 🐞 Bugs abertos",
  bugs,
  "",
  "## 📋 Regras ativas",
  "  council-to-superpowers p/ features",
  "  grid-cols-1 sm:grid-cols-2",
  "  DRY: regra negócio em src/lib/",
  "  report HTML antes do PR (npm run report)",
  "  pre-pr check antes do PR (npm run pre-pr)",
  "  session-end p/ finalizar (npm run session:end)",
  "  registrar bugs ao encontrar",
  "  IDEIAS.md lido no início de sessão",
  "  feedback: npm run feedback:check",
  "  🚫 pre-commit bloqueia main (git hook)",
  "",
  inProgress ? "▶️  HANDOFF indica algo em andamento — continua." : "",
  ideiasPendentes.includes("⬜") ? "💡 IDEIAS.md tem pendentes — perguntar ao usuário." : "",
  feedbackItems ? `\n## 📬 Feedback de usuários\n${feedbackItems}` : "",
  feedback,
].filter(l => l !== "").join("\n"));
