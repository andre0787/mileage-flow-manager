#!/usr/bin/env node
// metrics/lib.mjs — Helpers puros das métricas do programa (P2-21).
// ponytail: funções puras, zero deps, sem filesystem.

export const CATEGORY_PREFIXES = {
  feat: "feature",
  fix: "bugfix",
  docs: "docs",
  chore: "chore",
  refactor: "refactor",
};

/**
 * Categoria da tarefa a partir do prefixo da branch.
 * @param {string} branch
 * @returns {string} "feature" | "bugfix" | "docs" | "chore" | "refactor" | "outro"
 */
export function categoryFromBranch(branch) {
  const prefix = (branch || "").split("/")[0];
  return CATEGORY_PREFIXES[prefix] ?? "outro";
}

/**
 * Verde-na-1ª (local): 1º pre-pr PASS na branch sem rule:fail anterior.
 * @param {Array<object>} events
 * @param {string} branch
 * @returns {{green: boolean, firstPassAt: string|null}}
 */
export function firstGreenPrLocal(events, branch) {
  const scoped = events.filter((e) => (e.branch ?? e.data?.branch) === branch);
  const firstPass = scoped.find(
    (e) =>
      e.type === "pre-pr" &&
      (e.errors === 0 || e.description?.includes("PASS") || e.data?.result === "PASS"),
  );
  if (!firstPass) return { green: false, firstPassAt: null };
  const firstPassIdx = scoped.indexOf(firstPass);
  const earlierFails = scoped
    .slice(0, firstPassIdx)
    .filter((e) => e.type === "rule:fail");
  return { green: earlierFails.length === 0, firstPassAt: firstPass.timestamp };
}

/**
 * Proxy de bypass --no-verify: PR mergeado sem NENHUM evento pre-pr na branch.
 * Limitação documentada: o GitHub não expõe a flag; apenas a ausência de gate local.
 * @param {{number:number, state?:string, mergedAt?:string|null, headRefName?:string, branch?:string}} pr
 * @param {Array<object>} events
 * @returns {boolean}
 */
export function proxyBypassPr(pr, events) {
  const branch = pr.headRefName ?? pr.branch ?? "";
  const merged = pr.state === "MERGED" || Boolean(pr.mergedAt);
  if (!branch || !merged) return false;
  return !events.some(
    (e) => e.type === "pre-pr" && (e.branch ?? e.data?.branch) === branch,
  );
}

/** Nomes de check que pulam por design (docs-only / cron), não evasão. */
export const E2E_SKIP_BY_DESIGN = new Set(["e2e-smoke", "e2e-smoke-prod", "e2e-full"]);

/**
 * True se o check-run "skipped" é skip por design (não evasão).
 * @param {string} name
 * @returns {boolean}
 */
export function isSkipByDesign(name) {
  return E2E_SKIP_BY_DESIGN.has(name);
}

/**
 * Agrupa eventos por modelo (resolvedModel > model > "sem-modelo").
 * @param {Array<object>} events
 * @returns {Array<{model:string, events:Array<object>}>}
 */
export function splitByModel(events) {
  const map = new Map();
  for (const e of events) {
    const model = e.resolvedModel ?? e.model ?? "sem-modelo";
    if (!map.has(model)) map.set(model, []);
    map.get(model).push(e);
  }
  return [...map.entries()].map(([model, grouped]) => ({ model, events: grouped }));
}
