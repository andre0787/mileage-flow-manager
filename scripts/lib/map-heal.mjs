#!/usr/bin/env node

/**
 * map-heal.mjs — Auto-registro de docs novos no MAP.md (Trava C).
 *
 * Council 2026-08-05, Fase 2: docs novos fora do MAP.md (rule-17 ×12) são
 * registrados automaticamente em uma seção dedicada "🤖 Índice Auto-Gerado"
 * com marcação `(auto)`. O índice curado original permanece intacto; a seção
 * auto é a pista para o humano revisar e mover a entrada para a tabela correta.
 *
 * Idempotente: docs já presentes no MAP.md não geram heal.
 * Não atua em docs fora da regra (reports/, archive/, council/, thoughts/).
 *
 * ponytail: fs + execSync nativo, zero deps.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, dirname, relative } from "path";

/** Prefixo da seção dedicada ao índice auto-gerado (marcação clara "auto"). */
export const AUTO_SECTION = "## 🤖 Índice Auto-Gerado (pre-pr)";

/** Regra curada por este heal (usada no evento healed). */
export const HEALED_RULE = "rule-17-new-docs-valid";

/** Diretórios de docs que a rule-17 não exige no MAP.md. */
const IGNORED_PREFIXES = [
  "docs/reports/",
  "docs/archive/",
  "docs/council/",
  "docs/thoughts/",
];

function mapPath(root) {
  return resolve(root, "docs/MAP.md");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lista docs .md novos em docs/ (untracked, modificados ou novos vs main).
 * Respeita PRE_PR_MOCK_DIFF (mesmo contrato da rule-17) e limpa o ambiente
 * Git herdado de hooks (GIT_INDEX_FILE aponta para índice temporário).
 * @param {string} root
 * @returns {string[]}
 */
function diffDocs(root) {
  if (process.env.PRE_PR_MOCK_DIFF !== undefined) {
    return process.env.PRE_PR_MOCK_DIFF.split(",").filter(Boolean);
  }
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
    delete env[key];
  }
  const run = (cmd) => {
    try { return execSync(cmd, { cwd: root, env, encoding: "utf8", timeout: 5000 }).trim(); }
    catch { return ""; }
  };

  const files = new Set();
  const currentBranch = run("git rev-parse --abbrev-ref HEAD");
  if (currentBranch && currentBranch !== "main" && currentBranch !== "master") {
    const mergeBase = run("git merge-base main HEAD");
    const ref = mergeBase ? `${mergeBase}...HEAD` : "main...HEAD";
    run(`git diff ${ref} --name-only`).split("\n").filter(Boolean).forEach((f) => files.add(f));
  }
  run("git status --porcelain").split("\n").forEach((line) => {
    const f = line.slice(3).trim();
    if (f) files.add(f);
  });
  return Array.from(files);
}

/**
 * Expande diretórios inteiros do diff (git status mostra "docs/" quando o
 * diretório inteiro é novo) em arquivos .md individuais.
 * @param {string} root
 * @param {string[]} files
 * @returns {string[]}
 */
function expandDirs(root, files) {
  const out = [];
  for (const f of files) {
    const abs = resolve(root, f);
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      try {
        const list = execSync(`find "${abs}" -name "*.md"`, {
          cwd: root, encoding: "utf8", timeout: 5000,
        }).trim().split("\n").filter(Boolean);
        for (const item of list) out.push(relative(root, item).replace(/\\/g, "/"));
      } catch { /* ignora */ }
    } else {
      out.push(f);
    }
  }
  return out;
}

/**
 * Detecta docs .md novos em docs/ que não estão no MAP.md e os registra na
 * seção auto-gerada.
 * @param {string} root
 * @returns {string[]} regras healadas (vazio se nada foi curado)
 */
export function healMapDocs(root) {
  const changed = expandDirs(root, diffDocs(root));

  const newDocs = changed.filter((f) => {
    if (!f.endsWith(".md")) return false;
    if (!f.startsWith("docs/")) return false;
    if (f === "docs/MAP.md") return false; // o próprio índice não se auto-registra
    if (IGNORED_PREFIXES.some((p) => f.startsWith(p))) return false;
    return existsSync(resolve(root, f));
  });

  if (newDocs.length === 0) return [];

  const mapFile = mapPath(root);
  let content = existsSync(mapFile) ? readFileSync(mapFile, "utf8") : "";

  const missing = newDocs.filter((f) => {
    const fileName = f.split("/").pop();
    return !content.includes(fileName);
  });

  if (missing.length === 0) return [];

  // Garante a seção auto (no fim do arquivo, fora do índice curado)
  if (!content.includes(AUTO_SECTION)) {
    const header = content.trim().length > 0 ? "\n" : "";
    content += `${header}${AUTO_SECTION}\n\nDocs novos registrados automaticamente pelo pre-pr (marcação \`(auto)\` — mova para a tabela curada acima se pertinente):\n\n| Arquivo | Registrado em |\n|---------|---------------|\n`;
  }

  const date = today();
  for (const f of missing) {
    content += `| \`${f}\` (auto) | ${date} |\n`;
  }

  const dir = dirname(mapFile);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(mapFile, content, "utf8");

  return [HEALED_RULE];
}
