/**
 * report-git.mjs — Funções puras de Git para o gerador de briefing.
 *
 * getDiff, getChangedFiles, getBranch, getPR, derivePrRows, etc.
 * Sem efeitos colaterais: apenas leitura do repositório via execSync.
 *
 * deps: child_process (execSync), report-cli (ROOT, DIFF_BASE, PREFIX)
 */

import { execSync } from "child_process";
import { ROOT, DIFF_BASE, PREFIX } from "./report-cli.mjs";

// ── Git helper ──────────────────────────────────────────────────────
function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "n/a";
  }
}

// ── Dados Git ───────────────────────────────────────────────────────
export function getDiff() {
  const mergeBase =
    DIFF_BASE ||
    git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const diff = git(`git diff ${mergeBase}..HEAD`);
  return diff !== "n/a" ? diff : git("git diff HEAD~1..HEAD");
}

export function getChangedFiles() {
  const mergeBase =
    DIFF_BASE ||
    git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const out = git(`git diff ${mergeBase}..HEAD --name-status`);
  if (out === "n/a") return git("git diff HEAD~1..HEAD --name-status");
  return out;
}

export function getBranch() {
  return git("git rev-parse --abbrev-ref HEAD");
}

export function getCommit() {
  return git("git log -1 --format='%h — %s'");
}

export function getPR() {
  const branch = getBranch();
  try {
    const out = execSync(`gh pr list --head "${branch}" --json number,title 2>/dev/null`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5_000,
    });
    const list = JSON.parse(out);
    if (list.length > 0) return { number: list[0].number, title: list[0].title };
  } catch {}
  return null;
}

/** Título real de um PR pelo número via gh (null se indisponível). */
export function prTitle(number) {
  try {
    const out = execSync(`gh pr view ${number} --json title --jq .title 2>/dev/null`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5_000,
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

/** Soma linhas (add+del) do numstat de um git diff (renames/binary '-' ignorados). */
export function numstatLines(numstat) {
  let lines = 0;
  for (const nl of String(numstat).split("\n")) {
    const m = nl.match(/^(\d+)\s+(\d+)/);
    if (m) lines += parseInt(m[1], 10) + parseInt(m[2], 10);
  }
  return lines;
}

// ── Tipo / Benefício / Impacto ─────────────────────────────────────
export const TYPE_BENEFIT = {
  fix: "Comportamento corrigido e validado — menos erro e retrabalho",
  feat: "Nova capacidade entregue e validada",
  refactor: "Código mais simples — menor custo de manutenção",
  docs: "Documentação/processo atualizados — mais rastreabilidade",
  chore: "Ajuste de processo validado",
};
export const TYPE_IMPACT = {
  fix: "Menos risco de erro para o usuário e a operação",
  feat: "Nova alavanca de uso/negócio",
  refactor: "Menos custo em mudanças futuras",
  docs: "Menos fricção e melhor governança",
  chore: "Processo mais confiável e audável",
};
const DEFAULT_BENEFIT = "Mudança validada pelo fluxo de qualidade";
const DEFAULT_IMPACT = "Risco controlado antes da produção";

export function typeOf(subject) {
  if (/^fix(\(|\s|:|$)/i.test(subject)) return "fix";
  if (/^feat(\(|\s|:|$)/i.test(subject)) return "feat";
  if (/^refactor(\(|\s|:|$)/i.test(subject)) return "refactor";
  if (/^docs(\(|\s|:|$)/i.test(subject)) return "docs";
  if (/^(chore|style|build)(\(|\s|:|$)/i.test(subject)) return "chore";
  return "auto";
}

// ── Parsing de commits ─────────────────────────────────────────────
/**
 * Converte UM registro de commit (git log --format='%x1f…%x1e') em linha da
 * tabela. Função pura (sem git) para ser testável.
 */
export function parseCommitRecord(record) {
  const clean = String(record).replace(/\x1e+$/, "");
  const parts = clean.split("\x1f");
  const sha = (parts[1] || "").trim();
  const subject = (parts[2] || "").trim();
  if (!sha || !subject) return null;
  const body =
    parts
      .slice(3)
      .join("\x1f")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)[0] || "";
  const type = typeOf(subject);
  return {
    item: sha,
    fix: body ? `${subject} — ${body}` : subject,
    benefit: TYPE_BENEFIT[type] || DEFAULT_BENEFIT,
    impact: TYPE_IMPACT[type] || DEFAULT_IMPACT,
    tokens: null,
  };
}

// ── Linhas do Detalhamento por item ────────────────────────────────
export function deriveTableRows(baseRef = null) {
  const base =
    baseRef ||
    DIFF_BASE ||
    git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const logOut = git(`git log --no-merges ${base}..HEAD --format='%x1f%h%x1f%s%x1f%b%x1e'`);
  if (logOut === "n/a" || !logOut || logOut === "") return [];
  const rows = [];
  for (const record of logOut.split("\x1e")) {
    const row = parseCommitRecord(record);
    if (!row) continue;
    let lines = 0;
    const numstat = git(`git show --numstat --format= ${row.item}`);
    for (const nl of numstat.split("\n")) {
      const m = nl.match(/^(\d+)\s+(\d+)/);
      if (m) lines += parseInt(m[1], 10) + parseInt(m[2], 10);
    }
    rows.push({ ...row, tokens: lines > 0 ? `~${Math.round(lines * 0.75)}` : "—" });
  }
  return rows;
}

/** Monta a linha do Detalhamento ao nível de PR (função pura). */
export function buildPrRow({ number, title, lines }) {
  const type = typeOf(title || "");
  return {
    item: number ? `PR #${number}` : "PR",
    fix: title,
    benefit: TYPE_BENEFIT[type] || DEFAULT_BENEFIT,
    impact: TYPE_IMPACT[type] || DEFAULT_IMPACT,
    tokens: lines > 0 ? `~${Math.round(lines * 0.75)}` : "—",
  };
}

/**
 * Deriva linhas do Detalhamento ao nível de PR (não de commit):
 * cada PR merged no range base..HEAD vira UMA linha com o título real do PR
 * e custo de token agregado (diff do merge). Sem merges no range, usa o PR
 * aberto da branch. Sem PR, retorna [] para o fallbackTableRow.
 */
export function derivePrRows(baseRef = null) {
  const base =
    baseRef ||
    DIFF_BASE ||
    git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const rows = [];

  // 1. PRs merged no range (backfill/histórico)
  const mergesOut = git(`git log --merges ${base}..HEAD --format='%h|%s'`);
  if (mergesOut && mergesOut !== "n/a" && mergesOut !== "") {
    for (const line of mergesOut.split("\n")) {
      const [sha, subject] = line.split("|");
      const prNum = (subject || "").match(/Merge pull request #(\d+)/)?.[1];
      if (!prNum) continue;
      const title = prTitle(prNum) || subject;
      const lines = numstatLines(git(`git diff ${sha}^1..${sha} --numstat`));
      rows.push(buildPrRow({ number: prNum, title, lines }));
    }
  }

  // 2. PR aberto da branch corrente
  const current = getPR();
  if (current) {
    const lines = numstatLines(git(`git diff ${base}..HEAD --numstat`));
    rows.push(buildPrRow({ number: current.number, title: current.title, lines }));
  }

  return rows;
}

/** Linha de fallback quando não há commits nem --rows. */
export function fallbackTableRow(task, impactProduto, impactNegocio, metrics) {
  return {
    item: "Entrega da sessão",
    fix: task,
    benefit: impactProduto || DEFAULT_BENEFIT,
    impact: impactNegocio || DEFAULT_IMPACT,
    tokens: metrics && metrics.tokens > 0 ? `~${metrics.tokens}` : "—",
  };
}
