/**
 * session-heal.mjs — Auto-correção de violações mecânicas de sessão no handoff.
 *
 * Travas do council 2026-08-05 (docs/council/2026-08-05-process-violations-veredito.md):
 * violações 100% mecânicas (o script tem toda a informação para corrigir) são
 * auto-corrigidas, não delegadas ao humano:
 *   - rule-26: branch da Sessão Atual difere da branch git atual
 *   - rule-02: "Docs carregados" não corresponde à categoria declarada
 *
 * O pre-pr-check chama healSession() ANTES do loop de regras; cada regra
 * auto-corrigida é registrada como evento `healed` (telemetria distinta de
 * `rule:fail` — o KPI não mistura fricção mecânica com violação humana).
 *
 * ponytail: fs + execSync nativos, zero deps.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DOCS_CARREGADOS = {
  feature: "WORKFLOW.md, CONVENTIONS.md",
  bugfix: "DEBUG.md, CONVENTIONS.md",
  docs: "AGENTS.md",
  refactor: "CONVENTIONS.md, ARCHITECTURE.md",
  chore: "AGENTS.md",
};

function gitBranch(root) {
  try {
    const env = { ...process.env };
    for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
      delete env[key];
    }
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: root, env, encoding: "utf8", timeout: 3000,
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Corrige violações mecânicas de sessão no docs/handoff.md.
 * @param {string} root - raiz do repositório
 * @returns {string[]} regras auto-corrigidas (ex: ["rule-26", "rule-02"])
 */
export function healSession(root) {
  const healed = [];
  const handoffPath = resolve(root, "docs/handoff.md");
  if (!existsSync(handoffPath)) return healed;

  const branch = gitBranch(root);
  if (!branch || branch === "main" || branch === "master") return healed;

  const content = readFileSync(handoffPath, "utf8");
  const sessionMatch = content.match(/## 🎯 Sessão Atual[\s\S]*?(?=\n## |\n---|$)/);
  if (!sessionMatch) return healed;
  let session = sessionMatch[0];

  // ── Trava B: rule-26 — branch da sessão difere da branch atual ──
  const branchMatch = session.match(/\*\*Branch:\*\*\s*`([^`]+)`/);
  if (branchMatch && branchMatch[1] !== branch) {
    session = session.replace(/\*\*Branch:\*\*\s*`[^`]+`/, `**Branch:** \`${branch}\``);
    healed.push("rule-26");
  }

  // ── Trava E: rule-02 — docs carregados não batem com a categoria ──
  const catMatch = session.match(/\*\*Categoria:\*\*\s*(\w+)/);
  const docsMatch = session.match(/\*\*Docs carregados:\*\*\s*(.+)/);
  if (
    catMatch &&
    DOCS_CARREGADOS[catMatch[1]] &&
    docsMatch &&
    docsMatch[1].trim() !== DOCS_CARREGADOS[catMatch[1]]
  ) {
    session = session.replace(
      /\*\*Docs carregados:\*\*\s*.+/,
      `**Docs carregados:** ${DOCS_CARREGADOS[catMatch[1]]}`,
    );
    healed.push("rule-02");
  }

  if (healed.length > 0) {
    writeFileSync(handoffPath, content.replace(sessionMatch[0], session), "utf8");
  }
  return healed;
}
