#!/usr/bin/env node
// metrics/aggregate.mjs — Junta dados GitHub + events.jsonl e computa métricas.
// Reusa parseProcessEvents (process-events) e computeCycleTime (kpi-report).

import { readFileSync } from "fs";
import { resolve } from "path";
import { parseProcessEvents } from "../lib/process-events.mjs";
import { computeCycleTime } from "../kpi-report.mjs";
import {
  categoryFromBranch,
  firstGreenPrLocal,
  proxyBypassPr,
  isSkipByDesign,
  splitByModel,
} from "./lib.mjs";

/** Carrega e parseia docs/tracking/events.jsonl. */
export function loadLocalEvents() {
  const p = resolve(import.meta.dirname, "../../docs/tracking/events.jsonl");
  const events = parseProcessEvents(readFileSync(p, "utf8"));
  return { events, coverageSince: events[0]?.timestamp ?? null };
}

/**
 * Agrega métricas a partir dos dados GitHub + eventos locais.
 * @param {{ prs: Array<object>, checksByPr: Record<number, Array<object>> }} gh
 * @param {Array<object>} events
 * @param {{since?: string, coverageSince?: string|null}} opts
 * @returns {object}
 */
export function aggregate(gh, events, { since = "", coverageSince = null } = {}) {
  const prs = since
    ? gh.prs.filter((p) => p.createdAt >= since)
    : gh.prs;
  const merged = prs.filter((p) => Boolean(p.mergedAt));

  // Verde-na-1ª e bypass exigem eventos pre-pr: restringir à janela em que
  // events.jsonl já existia (coverageSince). PRs anteriores não têm dados,
  // não são falha nem bypass real (evita falso positivo de 73% → ~0%).
  const covered = merged.filter(
    (p) => !coverageSince || (p.mergedAt ?? "") >= coverageSince,
  );

  const byCategory = {};
  for (const pr of prs) {
    const cat = categoryFromBranch(pr.headRefName ?? "");
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  // Verde-na-1ª (local): 1º pre-pr PASS sem rule:fail anterior (janela coberta).
  const greenFirst = { total: 0, green: 0 };
  for (const pr of covered) {
    greenFirst.total += 1;
    const { green } = firstGreenPrLocal(events, pr.headRefName ?? "");
    if (green) greenFirst.green += 1;
  }

  // Tempo até verificação: reusa computeCycleTime (session:start → pre-pr PASS).
  const cycleHours = computeCycleTime(events);

  // Retrabalho: PRs mergeados com rule:fail na branch antes do 1º PASS.
  const rework = { prsWithFails: 0, totalRuleFails: 0 };
  for (const pr of merged) {
    const branch = pr.headRefName ?? "";
    const fails = events.filter(
      (e) => e.type === "rule:fail" && (e.branch ?? e.data?.branch) === branch,
    );
    if (fails.length > 0) rework.prsWithFails += 1;
    rework.totalRuleFails += fails.length;
  }

  // Skips E2E: check-runs com conclusion "skipped" (byDesign vs evasão).
  const e2eSkips = { total: 0, byDesign: 0 };
  for (const pr of prs) {
    for (const c of gh.checksByPr[pr.number] ?? []) {
      if (c.conclusion === "skipped") {
        e2eSkips.total += 1;
        if (isSkipByDesign(c.name)) e2eSkips.byDesign += 1;
      }
    }
  }

  // Bypass (proxy): PR mergeado sem evento pre-pr na branch (janela coberta).
  const bypassProxy = [];
  for (const pr of covered) {
    if (proxyBypassPr(pr, events)) bypassProxy.push(pr.number);
  }

  // Fatia por modelo quando eventos carregam resolvedModel/model.
  const byModel = splitByModel(events).map((g) => ({
    model: g.model,
    count: g.events.length,
  }));

  return {
    generatedAt: new Date().toISOString(),
    since: since || null,
    coverageSince: coverageSince || null,
    totals: { prs: prs.length, merged: merged.length, covered: covered.length },
    byCategory,
    greenFirst,
    cycleHours,
    rework,
    e2eSkips,
    bypassProxy,
    byModel,
  };
}
