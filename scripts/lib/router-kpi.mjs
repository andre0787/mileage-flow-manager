/**
 * router-kpi.mjs — Agregador mensal puro dos KPIs do router LLM.
 *
 * Correlaciona eventos `llm.route.resolved` e `llm.route.completed` por
 * taskId para produzir o bloco `llmRouter` mensal do dashboard. Determinístico:
 * ordena por nome de modelo e por skill+modelo para JSON estável.
 *
 * ponytail: função pura, zero deps, sem filesystem.
 */

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled", "blocked"]);

function isResolved(event) {
  return event?.type === "llm.route.resolved";
}

function isCompleted(event) {
  return event?.type === "llm.route.completed";
}

function taskIdOf(event) {
  return event?.taskId ?? "";
}

function isTerminal(event) {
  return isCompleted(event) && TERMINAL_STATUSES.has(event.status);
}

function sortCompletions(a, b) {
  const attemptDiff = (a.attempt ?? 0) - (b.attempt ?? 0);
  if (attemptDiff !== 0) return attemptDiff;
  return String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""));
}

/**
 * Correlaciona resoluções e conclusões por taskId e resume o mês.
 * @param {Array<object>} events
 * @returns {object} bloco RouterMonthlyKPI
 */
export function computeRouterKPI(events) {
  const safe = Array.isArray(events) ? events : [];

  const resolutionsByTask = new Map();
  const completionsByTask = new Map();
  let resolvedCount = 0;
  let completionWithoutResolution = 0;

  for (const event of safe) {
    if (isResolved(event)) {
      resolvedCount += 1;
      const taskId = taskIdOf(event);
      if (!resolutionsByTask.has(taskId)) resolutionsByTask.set(taskId, []);
      resolutionsByTask.get(taskId).push(event);
    } else if (isCompleted(event)) {
      const taskId = taskIdOf(event);
      if (!completionsByTask.has(taskId)) completionsByTask.set(taskId, []);
      completionsByTask.get(taskId).push(event);
    }
  }

  let completedCount = 0;
  let failedCount = 0;
  let fallbackUsedCount = 0;
  const effectiveModels = new Set();
  const skillsByModel = new Set();

  const allTaskIds = new Set([...resolutionsByTask.keys(), ...completionsByTask.keys()]);
  for (const taskId of allTaskIds) {
    const resolutions = resolutionsByTask.get(taskId) ?? [];
    const completions = completionsByTask.get(taskId) ?? [];
    const terminal = completions.filter(isTerminal).sort(sortCompletions);
    const last = terminal.length > 0 ? terminal[terminal.length - 1] : null;

    if (last === null) {
      // Sem conclusão terminal: unobserved (mesmo que existam tentativas não terminais).
      if (resolutions.length === 0) completionWithoutResolution += 1;
      continue;
    }

    const resolution = resolutions.length > 0 ? resolutions[resolutions.length - 1] : null;
    const resolvedModel = last.resolvedModel ?? resolution?.model ?? null;
    const fallbackProven =
      last.fallbackUsed === true ||
      (resolvedModel !== null &&
        resolution !== null &&
        last.model !== resolvedModel &&
        Array.isArray(resolution.fallbackModels) &&
        resolution.fallbackModels.includes(last.model));

    if (last.status === "completed") {
      completedCount += 1;
      if (last.fallbackUsed === true || fallbackProven) fallbackUsedCount += 1;
    } else {
      failedCount += 1;
    }

    effectiveModels.add(last.model);
    for (const skill of Array.isArray(last.skills) ? last.skills : []) {
      skillsByModel.add(`${skill}\u0000${last.model}`);
    }
  }

  const unobserved = [...resolutionsByTask.keys()].filter(
    (taskId) => !(completionsByTask.get(taskId) ?? []).some(isTerminal),
  ).length;

  const models = [...effectiveModels].sort();
  const skillsByModelRows = [...skillsByModel]
    .map((row) => {
      const [skill, model] = row.split("\u0000");
      return { skill, model };
    })
    .sort((a, b) => a.skill.localeCompare(b.skill) || a.model.localeCompare(b.model));

  return {
    resolved: resolvedCount,
    completed: completedCount,
    failed: failedCount,
    unobserved,
    fallbackUsed: fallbackUsedCount,
    completionRate: resolvedCount > 0 ? Math.round((completedCount / resolvedCount) * 1000) / 10 : null,
    fallbackRate: completedCount > 0 ? Math.round((fallbackUsedCount / completedCount) * 1000) / 10 : null,
    models,
    skillsByModel: skillsByModelRows,
    ...(completionWithoutResolution > 0 ? { _unobservedCompletions: completionWithoutResolution } : {}),
  };
}
