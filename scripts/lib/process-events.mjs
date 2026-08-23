
export const PROCESS_EVENT_TYPES = Object.freeze([
  "session",
  "session:start",
  "session:end",
  "commit",
  "pre-pr",
  "pr:create",
  "pr:merge",
  "rule:fail",
  "healed",
  "gate",
  "gate:blocked",

  "code-review:done",
  "coding:done",
  "custom",
]);

const CATEGORIES = new Set(["feature", "bugfix", "docs", "refactor", "chore"]);
const GATES = new Set(["intent", "twins", "auth", "council"]);
const SENSITIVE_KEYS = new Set([
  "prompt",
  "input",
  "output",
  "response",
  "token",
  "tokens",
  "apikey",
  "password",
  "secret",
  "credential",
  "credentials",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizedKey(key) {
  return key.toLowerCase().replace(/[_-]/g, "");
}

function addSensitiveIssues(value, issues, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) addSensitiveIssues(item, issues, seen);
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(normalizedKey(key))) {
      issues.push(`event contains sensitive field "${key}"`);
      continue;
    }
    addSensitiveIssues(nested, issues, seen);
  }
}

function valueFromEvent(event, key) {
  return event[key] ?? event.data?.[key];
}

function validateTimestamp(event, issues) {
  if (!nonEmptyString(event.timestamp)) {
    issues.push("timestamp must be a non-empty ISO string");
    return;
  }
  if (Number.isNaN(Date.parse(event.timestamp))) issues.push("timestamp must be a valid ISO string");
}

export function parseProcessEvents(raw) {
  if (typeof raw !== "string") throw new TypeError("event log must be a string");

  const events = [];
  for (const [index, line] of raw.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`JSON inválido na linha ${index + 1}: ${error.message}`);
    }
  }
  return events;
}

export function validateProcessEvent(event) {
  if (!isRecord(event)) return ["event must be an object"];

  const issues = [];
  addSensitiveIssues(event, issues);

  if (!nonEmptyString(event.type)) {
    issues.push("type must be a non-empty string");
    return issues;
  }
  if (!PROCESS_EVENT_TYPES.includes(event.type)) issues.push(`unknown event type "${event.type}"`);
  validateTimestamp(event, issues);

  const branch = valueFromEvent(event, "branch");
  switch (event.type) {
    case "session":
    case "session:start": {
      if (!nonEmptyString(branch)) issues.push(`${event.type} branch must be a non-empty string`);
      const category = event.categoria ?? event.category;
      if (category !== undefined && !CATEGORIES.has(category)) issues.push("session category is invalid");
      break;
    }
    case "session:end":
      if (!nonEmptyString(branch)) issues.push("session:end branch must be a non-empty string");
      break;
    case "pre-pr": {
      const errors = valueFromEvent(event, "errors");
      const legacyResult = event.data?.result;
      if (errors !== undefined && (!Number.isInteger(errors) || errors < 0)) {
        issues.push("pre-pr errors must be a non-negative integer");
      } else if (errors === undefined && !["PASS", "FAIL"].includes(legacyResult)) {
        issues.push("pre-pr errors or legacy data.result is required");
      }
      break;
    }
    case "rule:fail":
      if (!nonEmptyString(valueFromEvent(event, "rule"))) issues.push("rule:fail rule is required");
      break;
    case "healed":
      if (!nonEmptyString(valueFromEvent(event, "rule"))) issues.push("healed rule is required");
      break;
    case "gate:blocked": {
      if (!nonEmptyString(valueFromEvent(event, "rule"))) issues.push("gate:blocked rule is required");
      const gate = valueFromEvent(event, "gate");
      if (gate !== undefined && !GATES.has(gate)) issues.push("gate:blocked gate must be intent, twins, auth or council");
      break;
    }
    case "gate": {
      const gate = valueFromEvent(event, "gate");
      if (!GATES.has(gate)) issues.push("gate must be intent, twins or auth");
      break;
    }
    case "code-review:done":
    case "coding:done": {
      if (!nonEmptyString(valueFromEvent(event, "branch"))) {
        issues.push(`${event.type} branch must be a non-empty string`);
      }
      break;
    }

    default:
      break;
  }

  return issues;
}

export function validateProcessEvents(events) {
  if (!Array.isArray(events)) return [{ index: -1, type: "", issue: "events must be an array" }];

  const issues = [];
  for (const [index, event] of events.entries()) {
    for (const issue of validateProcessEvent(event)) {
      issues.push({ index, type: event?.type ?? "", issue });
    }
  }
  return issues;
}

export function summarizeProcessEvidence(events) {
  const safeEvents = Array.isArray(events) ? events : [];
  const byType = {};
  for (const event of safeEvents) {
    const type = event?.type ?? "unknown";
    byType[type] = (byType[type] ?? 0) + 1;
  }

  const issues = validateProcessEvents(safeEvents);

  return {
    total: safeEvents.length,
    invalid: issues.length,
    byType,
    unobserved: 0,
    issues,
  };
}
