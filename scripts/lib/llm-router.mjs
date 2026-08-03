const CONFIG_VERSION = 1;
const ROUTER_CONFIG_KEYS = [
  "version",
  "aliases",
  "profiles",
  "categoryDefaults",
  "globalDefault",
  "routes",
];
const PROFILE_KEYS = ["primary", "fallbacks"];
const ROUTE_KEYS = ["category", "capability", "profile"];
const EVENT_FIELDS = [
  "taskId",
  "model",
  "provider",
  "attempt",
  "status",
  "durationMs",
  "failureKind",
];
const SENSITIVE_EVENT_FIELDS = new Set([
  "prompt",
  "input",
  "output",
  "response",
  "token",
  "tokens",
  "apiKey",
  "api_key",
  "password",
  "secret",
  "credential",
  "credentials",
]);

export const CATEGORIES = Object.freeze(["feature", "bugfix", "docs", "refactor", "chore"]);
export const CAPABILITIES = Object.freeze([
  "analysis",
  "planning",
  "implementation",
  "debugging",
  "testing",
  "review",
  "documentation",
  "visual-inspection",
]);
export const ROUTE_SOURCES = Object.freeze([
  "manual",
  "task-card",
  "category-capability",
  "category-default",
  "global-default",
]);
export const CONTEXT_SOURCES = Object.freeze(["manual", "task-card", "orchestrator-inference"]);
export const RETRY_SAFETY_VALUES = Object.freeze(["read-only", "may-write"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function addRequiredIssue(issues, object, key, label) {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    issues.push(`${label} is required`);
  }
}

function addUnknownKeyIssues(issues, object, allowedKeys, label) {
  for (const key of Object.keys(object)) {
    if (!allowedKeys.includes(key)) issues.push(`${label} has unknown property "${key}"`);
  }
}

function addStringIssue(issues, value, label) {
  if (!isNonEmptyString(value)) issues.push(`${label} must be a non-empty string`);
}

export class RouterConfigError extends Error {
  constructor(issues) {
    const normalizedIssues = Array.isArray(issues)
      ? issues.map((issue) => String(issue)).filter(Boolean)
      : [String(issues)];
    super(
      `Invalid LLM router configuration:\n${normalizedIssues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    this.name = "RouterConfigError";
    this.issues = Object.freeze(normalizedIssues);
  }
}

export function validateRouterConfig(config) {
  const issues = [];

  if (!isRecord(config)) return ["config must be an object"];

  addUnknownKeyIssues(issues, config, ROUTER_CONFIG_KEYS, "config");
  for (const key of ROUTER_CONFIG_KEYS) addRequiredIssue(issues, config, key, `config.${key}`);

  if (config.version !== CONFIG_VERSION) {
    issues.push(`config.version must be ${CONFIG_VERSION}`);
  }

  const aliases = config.aliases;
  const aliasNames = new Set();
  if (!isRecord(aliases)) {
    issues.push("config.aliases must be an object");
  } else {
    if (Object.keys(aliases).length === 0)
      issues.push("config.aliases must contain at least one alias");
    for (const [alias, model] of Object.entries(aliases)) {
      aliasNames.add(alias);
      addStringIssue(issues, model, `alias "${alias}"`);
    }
  }

  const profiles = config.profiles;
  const profileNames = new Set();
  if (!isRecord(profiles)) {
    issues.push("config.profiles must be an object");
  } else {
    if (Object.keys(profiles).length === 0)
      issues.push("config.profiles must contain at least one profile");
    for (const [profileName, profile] of Object.entries(profiles)) {
      profileNames.add(profileName);
      if (!isRecord(profile)) {
        issues.push(`profile "${profileName}" must be an object`);
        continue;
      }

      addUnknownKeyIssues(issues, profile, PROFILE_KEYS, `profile "${profileName}"`);
      addRequiredIssue(issues, profile, "primary", `profile "${profileName}".primary`);
      addRequiredIssue(issues, profile, "fallbacks", `profile "${profileName}".fallbacks`);

      if (!isNonEmptyString(profile.primary)) {
        issues.push(`profile "${profileName}" primary must be a non-empty string`);
      } else if (!aliasNames.has(profile.primary)) {
        issues.push(`profile "${profileName}" primary alias "${profile.primary}" does not exist`);
      }

      if (!Array.isArray(profile.fallbacks)) {
        issues.push(`profile "${profileName}" fallbacks must be an array`);
        continue;
      }

      const fallbackNames = new Set();
      for (const fallback of profile.fallbacks) {
        if (!isNonEmptyString(fallback)) {
          issues.push(`profile "${profileName}" fallback must be a non-empty string`);
          continue;
        }
        if (fallbackNames.has(fallback)) {
          issues.push(`profile "${profileName}" has duplicate fallback "${fallback}"`);
        }
        fallbackNames.add(fallback);
        if (fallback === profile.primary) {
          issues.push(`profile "${profileName}" fallback "${fallback}" repeats primary`);
        }
        if (!aliasNames.has(fallback)) {
          issues.push(`profile "${profileName}" fallback alias "${fallback}" does not exist`);
        }
      }
    }
  }

  const categoryDefaults = config.categoryDefaults;
  if (!isRecord(categoryDefaults)) {
    issues.push("config.categoryDefaults must be an object");
  } else {
    for (const [category, profile] of Object.entries(categoryDefaults)) {
      if (!CATEGORIES.includes(category))
        issues.push(`category default "${category}" is not a valid category`);
      if (!isNonEmptyString(profile)) {
        issues.push(`category default "${category}" must reference a profile name`);
      } else if (!profileNames.has(profile)) {
        issues.push(`category default "${category}" references unknown profile "${profile}"`);
      }
    }
  }

  if (!isNonEmptyString(config.globalDefault)) {
    issues.push("config.globalDefault must be a non-empty profile name");
  } else if (!profileNames.has(config.globalDefault)) {
    issues.push(`global default references unknown profile "${config.globalDefault}"`);
  }

  if (!Array.isArray(config.routes)) {
    issues.push("config.routes must be an array");
  } else {
    const combinations = new Set();
    config.routes.forEach((route, index) => {
      const label = `route[${index}]`;
      if (!isRecord(route)) {
        issues.push(`${label} must be an object`);
        return;
      }
      addUnknownKeyIssues(issues, route, ROUTE_KEYS, label);
      for (const key of ROUTE_KEYS) addRequiredIssue(issues, route, key, `${label}.${key}`);

      if (!CATEGORIES.includes(route.category)) {
        issues.push(`${label}.category "${route.category}" is invalid`);
      }
      if (!CAPABILITIES.includes(route.capability)) {
        issues.push(`${label}.capability "${route.capability}" is invalid`);
      }
      if (!isNonEmptyString(route.profile)) {
        issues.push(`${label}.profile must be a non-empty profile name`);
      } else if (!profileNames.has(route.profile)) {
        issues.push(`${label}.profile references unknown profile "${route.profile}"`);
      }

      if (isNonEmptyString(route.category) && isNonEmptyString(route.capability)) {
        const combination = `${route.category}\u0000${route.capability}`;
        if (combinations.has(combination))
          issues.push(`${label} duplicates category + capability combination`);
        combinations.add(combination);
      }
    });
  }

  return issues;
}

export function assertValidRouterConfig(config) {
  const issues = validateRouterConfig(config);
  if (issues.length > 0) throw new RouterConfigError(issues);
  return config;
}

export function normalizeTaskContext(input) {
  const issues = [];
  if (!isRecord(input)) throw new RouterConfigError(["task context must be an object"]);

  const taskId = cleanString(input.taskId);
  if (!isNonEmptyString(taskId)) issues.push("taskId must be a non-empty string");

  const category =
    typeof input.category === "string" ? input.category.trim().toLowerCase() : input.category;
  if (!CATEGORIES.includes(category)) issues.push(`category "${input.category ?? ""}" is invalid`);

  const capability =
    input.capability === undefined || input.capability === null
      ? undefined
      : typeof input.capability === "string"
        ? input.capability.trim().toLowerCase()
        : input.capability;
  if (capability !== undefined && !CAPABILITIES.includes(capability)) {
    issues.push(`capability "${input.capability}" is invalid`);
  }

  const phase =
    input.phase === undefined || input.phase === null ? undefined : cleanString(input.phase);
  if (phase !== undefined && !isNonEmptyString(phase))
    issues.push("phase must be a non-empty string when provided");

  const modelProfileOverride =
    input.modelProfileOverride === undefined || input.modelProfileOverride === null
      ? undefined
      : cleanString(input.modelProfileOverride);
  if (modelProfileOverride !== undefined && !isNonEmptyString(modelProfileOverride)) {
    issues.push("modelProfileOverride must be a non-empty string when provided");
  }

  const retrySafety = input.retrySafety === undefined ? "may-write" : input.retrySafety;
  if (!RETRY_SAFETY_VALUES.includes(retrySafety)) {
    issues.push(`retrySafety "${input.retrySafety}" is invalid`);
  }

  const source = input.source === undefined ? "orchestrator-inference" : input.source;
  if (!CONTEXT_SOURCES.includes(source)) issues.push(`source "${source}" is invalid`);

  if (issues.length > 0) throw new RouterConfigError(issues);

  return {
    taskId,
    category,
    ...(capability === undefined ? {} : { capability }),
    ...(phase === undefined ? {} : { phase }),
    ...(modelProfileOverride === undefined ? {} : { modelProfileOverride }),
    retrySafety,
    source,
  };
}

function getProfile(config, reference, label) {
  if (Object.prototype.hasOwnProperty.call(config.profiles, reference)) {
    return { profile: reference, definition: config.profiles[reference] };
  }
  if (Object.prototype.hasOwnProperty.call(config.aliases, reference)) {
    return {
      profile: reference,
      definition: { primary: reference, fallbacks: [] },
    };
  }
  throw new RouterConfigError([
    `${label} "${reference}" does not reference a configured profile or alias`,
  ]);
}

function expandDecision(profileReference, source, retrySafety, config) {
  const selected = getProfile(config, profileReference, "route reference");
  const { primary, fallbacks } = selected.definition;
  return {
    profile: selected.profile,
    model: config.aliases[primary],
    fallbackModels: fallbacks.map((alias) => config.aliases[alias]),
    source,
    retrySafety,
  };
}

export function resolveRoute(context, config) {
  assertValidRouterConfig(config);
  const normalized = normalizeTaskContext(context);

  if (normalized.modelProfileOverride !== undefined) {
    if (normalized.source !== "manual" && normalized.source !== "task-card") {
      throw new RouterConfigError([
        "modelProfileOverride requires source to be manual or task-card",
      ]);
    }
    return expandDecision(
      normalized.modelProfileOverride,
      normalized.source,
      normalized.retrySafety,
      config,
    );
  }

  if (normalized.capability !== undefined) {
    const route = config.routes.find(
      (candidate) =>
        candidate.category === normalized.category &&
        candidate.capability === normalized.capability,
    );
    if (route)
      return expandDecision(route.profile, "category-capability", normalized.retrySafety, config);
  }

  const categoryProfile = config.categoryDefaults[normalized.category];
  if (categoryProfile !== undefined) {
    return expandDecision(categoryProfile, "category-default", normalized.retrySafety, config);
  }

  return expandDecision(config.globalDefault, "global-default", normalized.retrySafety, config);
}

export function createResolvedEvent(context, decision) {
  const normalized = normalizeTaskContext(context);
  return {
    type: "llm.route.resolved",
    taskId: normalized.taskId,
    category: normalized.category,
    capability: normalized.capability ?? null,
    profile: decision.profile,
    model: decision.model,
    fallbackModels: [...decision.fallbackModels],
    source: decision.source,
    retrySafety: decision.retrySafety,
    configVersion: CONFIG_VERSION,
  };
}

export function createCompletedEvent(input) {
  if (!isRecord(input)) throw new RouterConfigError(["completion event must be an object"]);

  const issues = [];
  for (const key of Object.keys(input)) {
    if (SENSITIVE_EVENT_FIELDS.has(key)) {
      issues.push(
        `completion event field "${key}" is not allowed because it may contain sensitive content`,
      );
    } else if (!EVENT_FIELDS.includes(key)) {
      issues.push(`completion event field "${key}" is not allowed`);
    }
  }

  for (const key of ["taskId", "model", "status"]) {
    if (!isNonEmptyString(input[key]))
      issues.push(`completion event ${key} must be a non-empty string`);
  }
  if (input.provider !== undefined && !isNonEmptyString(input.provider)) {
    issues.push("completion event provider must be a non-empty string when provided");
  }
  if (input.attempt !== undefined && (!Number.isInteger(input.attempt) || input.attempt < 1)) {
    issues.push("completion event attempt must be a positive integer when provided");
  }
  if (
    input.durationMs !== undefined &&
    (!Number.isFinite(input.durationMs) || input.durationMs < 0)
  ) {
    issues.push("completion event durationMs must be a non-negative number when provided");
  }
  if (input.failureKind !== undefined && !isNonEmptyString(input.failureKind)) {
    issues.push("completion event failureKind must be a non-empty string when provided");
  }

  if (issues.length > 0) throw new RouterConfigError(issues);

  const event = { type: "llm.route.completed" };
  for (const field of EVENT_FIELDS) {
    if (input[field] !== undefined) event[field] = input[field];
  }
  return event;
}

export function validateRouterEvent(event) {
  if (!isRecord(event)) return ["router event must be an object"];

  if (event.type === "llm.route.resolved") {
    const issues = [];
    for (const key of ["taskId", "category", "profile", "model", "source", "retrySafety"]) {
      if (!isNonEmptyString(event[key])) issues.push(`resolved event ${key} must be a non-empty string`);
    }
    if (!CATEGORIES.includes(event.category)) issues.push(`resolved event category is invalid`);
    if (event.capability !== null && event.capability !== undefined && !CAPABILITIES.includes(event.capability)) {
      issues.push("resolved event capability is invalid");
    }
    if (!ROUTE_SOURCES.includes(event.source)) issues.push("resolved event source is invalid");
    if (!RETRY_SAFETY_VALUES.includes(event.retrySafety)) issues.push("resolved event retrySafety is invalid");
    if (!Array.isArray(event.fallbackModels) || event.fallbackModels.some((model) => !isNonEmptyString(model))) {
      issues.push("resolved event fallbackModels must be an array of non-empty strings");
    }
    if (event.configVersion !== CONFIG_VERSION) issues.push(`resolved event configVersion must be ${CONFIG_VERSION}`);
    return issues;
  }

  if (event.type === "llm.route.completed") {
    const payload = {};
    for (const field of EVENT_FIELDS) {
      if (event[field] !== undefined) payload[field] = event[field];
    }
    try {
      createCompletedEvent(payload);
      return [];
    } catch (error) {
      return error instanceof RouterConfigError ? [...error.issues] : [String(error.message || error)];
    }
  }

  return [`unknown router event type "${event.type ?? ""}"`];
}
