#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import {
  assertValidRouterConfig,
  createCompletedEvent,
  createResolvedEvent,
  normalizeTaskContext,
  resolveRoute,
} from "./lib/llm-router.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CONFIG_PATH = resolve(ROOT, "config/llm-router.json");
const TASKS_DIR = resolve(ROOT, "docs/tasks");
const EVENT_LOG_SCRIPT = resolve(ROOT, "scripts/event-log.mjs");

const CARD_CATEGORY_MAP = Object.freeze({
  feat: "feature",
  fix: "bugfix",
  docs: "docs",
  refactor: "refactor",
  chore: "chore",
  test: "chore",
});

function usage() {
  return [
    "Uso:",
    "  npm run llm:route -- validate [--config <path>]",
    "  npm run llm:route -- resolve --task <ID> [--profile <profile>] [--no-log]",
    "  npm run llm:route -- resolve --context '<json>' [--profile <profile>] [--no-log]",
    "  npm run llm:route -- complete --event '<json>' [--no-log]",
  ].join("\n");
}

function requireValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} exige um valor`);
  return value;
}

function parseArgs(args) {
  const command = args[0];
  if (command === "--help" || command === "-h") return { command: "help" };
  if (!command || !["validate", "resolve", "complete"].includes(command)) {
    throw new Error(`Comando inválido: ${command || "(ausente)"}\n${usage()}`);
  }

  const options = { command, noLog: false };
  for (let index = 1; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--no-log") {
      options.noLog = true;
    } else if (flag === "--config") {
      options.configPath = requireValue(args, index, flag);
      index += 1;
    } else if (flag === "--task") {
      options.taskId = requireValue(args, index, flag);
      index += 1;
    } else if (flag === "--context") {
      options.contextJson = requireValue(args, index, flag);
      index += 1;
    } else if (flag === "--profile") {
      options.profile = requireValue(args, index, flag);
      index += 1;
    } else if (flag === "--event") {
      options.eventJson = requireValue(args, index, flag);
      index += 1;
    } else if (flag === "--help" || flag === "-h") {
      options.command = "help";
    } else {
      throw new Error(`Opção inválida: ${flag}\n${usage()}`);
    }
  }
  return options;
}

function loadJson(path, label) {
  const absolutePath = isAbsolute(path) ? path : resolve(process.cwd(), path);
  if (!existsSync(absolutePath)) throw new Error(`${label} não encontrado: ${absolutePath}`);
  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} JSON inválido: ${error.message}`);
  }
}

function loadConfig(configPath) {
  return loadJson(configPath || CONFIG_PATH, "Configuração");
}

function parseCardMetadata(content) {
  const metadata = {};
  const rowRe = /^\|\s*`(\w+)`\s*\|\s*(.+?)\s*\|/gm;
  let match;
  while ((match = rowRe.exec(content)) !== null) metadata[match[1]] = match[2].trim();
  return metadata;
}

function findTaskCard(taskId) {
  const files = readdirSync(TASKS_DIR)
    .filter((file) => file.endsWith(".md") && file !== "_TEMPLATE.md" && file !== "ROADMAP.md")
    .sort();
  for (const file of files) {
    const content = readFileSync(resolve(TASKS_DIR, file), "utf8");
    const metadata = parseCardMetadata(content);
    if (metadata.id === taskId) return { file, metadata };
  }
  throw new Error(`Task-card "${taskId}" não encontrado em docs/tasks/`);
}

function cardContext(taskId) {
  const card = findTaskCard(taskId);
  const rawCategory = card.metadata.categoria?.trim().toLowerCase();
  const category = CARD_CATEGORY_MAP[rawCategory];
  if (!category)
    throw new Error(`Categoria de task-card inválida: "${card.metadata.categoria || ""}"`);

  const context = {
    taskId: card.metadata.id,
    category,
    source: "task-card",
  };
  for (const field of ["capability", "phase", "modelProfileOverride", "retrySafety"]) {
    if (card.metadata[field]) context[field] = card.metadata[field].replace(/^`|`$/g, "");
  }
  return context;
}

function parseContext(options) {
  if (options.taskId && options.contextJson)
    throw new Error("Use apenas --task ou --context, não ambos");
  if (!options.taskId && !options.contextJson)
    throw new Error("resolve exige --task <ID> ou --context '<json>'");

  let context;
  if (options.taskId) {
    context = cardContext(options.taskId);
  } else {
    try {
      context = JSON.parse(options.contextJson);
    } catch (error) {
      throw new Error(`Contexto JSON inválido: ${error.message}`);
    }
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      throw new Error("Contexto JSON inválido: esperado um objeto");
    }
    if (typeof context.category !== "string" || !context.category.trim()) {
      throw new Error("Contexto JSON exige category normalizada");
    }
  }

  if (options.profile) {
    context = {
      ...context,
      modelProfileOverride: options.profile,
      source: "manual",
    };
  }
  return normalizeTaskContext(context);
}

function recordEvent(type, description, event, noLog) {
  if (noLog) return;
  const result = spawnSync(
    process.execPath,
    [EVENT_LOG_SCRIPT, type, description, "--meta", JSON.stringify(event)],
    {
      cwd: ROOT,
      env: process.env,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `event-log falhou para ${type}`).trim());
  }
}

function runValidate(options) {
  const config = loadConfig(options.configPath);
  assertValidRouterConfig(config);
  console.log("Configuração LLM router válida");
}

function runResolve(options) {
  const config = loadConfig(options.configPath);
  assertValidRouterConfig(config);
  const context = parseContext(options);
  const decision = resolveRoute(context, config);
  const event = createResolvedEvent(context, decision);
  recordEvent("llm.route.resolved", "LLM route resolved", event, options.noLog);
  console.log(JSON.stringify(decision));
}

function runComplete(options) {
  if (!options.eventJson) throw new Error("complete exige --event '<json>'");
  let rawEvent;
  try {
    rawEvent = JSON.parse(options.eventJson);
  } catch (error) {
    throw new Error(`Evento JSON inválido: ${error.message}`);
  }
  const event = createCompletedEvent(rawEvent);
  recordEvent("llm.route.completed", "LLM route completed", event, options.noLog);
  console.log(JSON.stringify(event));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help") {
    console.log(usage());
    return;
  }
  if (options.command === "validate") runValidate(options);
  if (options.command === "resolve") runResolve(options);
  if (options.command === "complete") runComplete(options);
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
}
