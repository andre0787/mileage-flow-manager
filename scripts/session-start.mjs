#!/usr/bin/env node

/**
 * session-start.mjs — Resumo comprimido (~300 tokens) pro início de sessão.
 *
 * Exibe snapshot do projeto, pergunta categoria/objetivo (se não for
 * continuação) e persiste no handoff.
 *
 * Uso: node scripts/session-start.mjs [--set-category <cat> <obj>]
 *
 * ponytail: fs + execSync + readline (stdlib), zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");
const CATEGORIAS = ["feature", "bugfix", "docs", "refactor", "chore"];
const DOCS_CARREGADOS = {
  feature: "WORKFLOW.md, CONVENTIONS.md",
  bugfix: "DEBUG.md, CONVENTIONS.md",
  docs: "AGENTS.md",
  refactor: "CONVENTIONS.md, ARCHITECTURE.md",
  chore: "AGENTS.md",
};
const LABELS = { feature: "feature", bugfix: "bugfix", docs: "docs", refactor: "refactor", chore: "chore" };

function readFile(p) {
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

async function main() {
  const handoff = readFile(HANDOFF_PATH);
  const setCatIdx = process.argv.indexOf("--set-category");

  // ─── Garante pre-commit hook ───
  try { execSync("git config core.hooksPath .githooks", { cwd: ROOT, encoding: "utf8", timeout: 3000 }); } catch {}

  // ─── Info do git ───
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

  // ─── Ideias pendentes ───
  const ideias = readFile(resolve(ROOT, "docs/IDEIAS.md"));
  const ideiasPendentes = (ideias || "")
    .split("\n")
    .filter(l => l.trim().startsWith("- [ ]"))
    .map(l => "  " + l.replace("- [ ]", "⬜").trim())
    .join("\n") || "(vazio)";

  // ─── Snapshot do handoff ───
  const snapshotMatch = (handoff || "").match(/## 🏗️ Projeto[\s\S]*?(?=\n## |\n---|$)/);
  const snapshot = snapshotMatch ? snapshotMatch[0].trim() : "(snapshot não encontrado)";

  // ─── Detecta sessão em andamento ───
  const sessaoMatch = (handoff || "").match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  const sessao = sessaoMatch ? sessaoMatch[0] : null;
  const inProgress = sessao !== null && sessao.includes("**Status:** in_progress") && !sessao.includes("descrição concisa");

  // ─── Output inicial ───
  console.log([
    `branch: ${branch}`,
    `commit: ${commit}`,
    `files:  ${status.split("\n").length - 1} pendente(s)`,
    `PRs:    ${prs}`,
    "",
    snapshot,
    "",
    "## 💭 Ideias pendentes (IDEIAS.md)",
    ideiasPendentes,
    "",
    inProgress ? "▶️  HANDOFF indica algo em andamento — continua." : "",
    ideiasPendentes.includes("⬜") ? "💡 IDEIAS.md tem pendentes — perguntar ao usuário." : "",
  ].filter(l => l !== "").join("\n"));

  // ─── Modo --set-category (não-interativo, pra testes) ───
  // Vem antes de inProgress porque --set-category é explícito (sobrescreve)
  if (setCatIdx >= 0) {
    const cat = (process.argv[setCatIdx + 1] || "").toLowerCase();
    const obj = process.argv[setCatIdx + 2] || "";
    if (!cat || !CATEGORIAS.includes(cat)) {
      console.error(`❌ Categoria inválida: "${cat}". Use uma de: ${CATEGORIAS.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    if (!obj) {
      console.error("❌ Objetivo obrigatório. Uso: --set-category <categoria> <objetivo>");
      process.exitCode = 1;
      return;
    }
    escreverSessao(cat, obj, branch, commit);
    console.log(`✅ Sessão iniciada: ${cat} — ${obj}`);
    return;
  }

  // ─── Continuação: só atualiza estado ───
  if (inProgress) {
    atualizarEstado(branch, commit);
    return;
  }

  // ─── Modo interativo: carrega feedback (lento) ───
  try {
    const fbOut = execSync("node scripts/check-feedback.mjs", { cwd: ROOT, encoding: "utf8", timeout: 10000 }).trim();
    const fb = fbOut.split("\n")[0];
    const fbItems = fbOut.split("\n").slice(1).join("\n");
    if (fbItems) console.log(`\n## 📬 Feedback de usuários\n${fbItems}`);
    console.log(fb);
  } catch { console.log("\n📬 Feedback: ?"); }

  // ─── Pergunta categoria e objetivo ───
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const resposta = await new Promise((resolve) => {
      rl.question(
        `\nCategoria da tarefa? (${CATEGORIAS.join("/")}) `,
        (cat) => {
          const c = cat.trim().toLowerCase();
          if (!c || !CATEGORIAS.includes(c)) {
            resolve({ err: `❌ Categoria inválida. Use uma de: ${CATEGORIAS.join(", ")}` });
            return;
          }
          rl.question(`Objetivo da sessão? (descrição concisa) `, (obj) => {
            resolve({ cat: c, obj: obj.trim() || "descrição concisa" });
          });
        }
      );
      rl.on("close", () => { process.exitCode = 1; });
    });

    if (resposta.err) {
      console.error(resposta.err);
      process.exitCode = 1;
      return;
    }

    escreverSessao(resposta.cat, resposta.obj, branch, commit);
  } finally {
    rl.close();
  }
}

// ─── Helpers ───

function escreverSessao(cat, obj, branchAtual, commitAtual) {
  const markdown = [
    `## 🎯 Sessão Atual`,
    `**Categoria:** ${LABELS[cat]}`,
    `**Objetivo:** ${obj}`,
    `**Status:** in_progress`,
    `**Branch:** \`${branchAtual}\``,
    `**Último commit:** ${commitAtual}`,
    `**Docs carregados:** ${DOCS_CARREGADOS[cat]}`,
  ].join("\n");

  const conteudo = readFileSync(HANDOFF_PATH, "utf8");
  const sessaoExistente = conteudo.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  let novo;
  if (sessaoExistente) {
    novo = conteudo.replace(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/, markdown);
  } else {
    const idx = conteudo.lastIndexOf("\n---");
    if (idx >= 0) {
      novo = conteudo.slice(0, idx) + "\n\n" + markdown + "\n\n" + conteudo.slice(idx);
    } else {
      novo = conteudo + "\n\n" + markdown + "\n";
    }
  }
  writeFileSync(HANDOFF_PATH, novo, "utf8");
  atualizarEstado(branchAtual, commitAtual);
}

function atualizarEstado(b, c) {
  const conteudo = readFileSync(HANDOFF_PATH, "utf8");
  const secao = conteudo.match(/## 🧭 Estado Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!secao) return;
  const atualizado = secao[0]
    .replace(/- \*\*Branch:\*\* .+/, `- **Branch:** \`${b}\``)
    .replace(/- \*\*Último commit:\*\* .+/, `- **Último commit:** \`${c}\``);
  writeFileSync(HANDOFF_PATH, conteudo.replace(secao[0], atualizado), "utf8");
}

await main();
