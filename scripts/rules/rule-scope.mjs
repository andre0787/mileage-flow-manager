#!/usr/bin/env node

/**
 * rule-scope.mjs — Regra de escopo: diff deve ficar dentro de arquivosPermitidos do card ativo.
 *
 * Lê o card em docs/tasks/ cujo estado não é "pending" nem "done",
 * compara o diff (base→HEAD + staged + untracked) com arquivosPermitidos.
 * Arquivos sensíveis (useDatabase, accounts, workflows, RLS) exigem flag.
 *
 * Uso: node scripts/rules/rule-scope.mjs
 * Exit: 0 = ok, 1 = violação
 *
 * ponytail: sem dependências, só fs + child_process nativos.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { git, ok, err, ROOT } from "../lib.mjs";

const TASKS_DIR = resolve(ROOT, "docs/tasks");
const EXCLUDE = new Set(["_TEMPLATE.md", "ROADMAP.md"]);

const ACTIVE_STATES = new Set(["planned", "implementing", "verified", "review"]);

// ── Parse metadata table ────────────────────────────────────────
function parseTable(content) {
  const meta = {};
  const rowRe = /^\|\s*`(\w+)`\s*\|\s*(.+?)\s*\|/gm;
  let match;
  while ((match = rowRe.exec(content)) !== null) {
    meta[match[1]] = match[2].trim();
  }
  return meta;
}

// ── Parse "Arquivos permitidos" section ─────────────────────────
function parseAllowedFiles(content) {
  const files = [];
  const lines = content.split("\n");
  let inSection = false;
  for (const line of lines) {
    if (line.startsWith("## Arquivos permitidos")) { inSection = true; continue; }
    if (inSection && line.startsWith("## ")) break;
    if (!inSection) continue;
    const itemMatch = line.match(/^\s*[-*]\s+`([^`]+)`/);
    if (itemMatch) files.push(itemMatch[1].trim());
  }
  return files;
}

// ── Match a file path against a pattern (simple wildcard: * only) ─
function matchesPattern(filePath, pattern) {
  if (pattern.includes("*")) {
    const prefix = pattern.split("*")[0];
    const suffix = pattern.split("*").slice(1).join("*");
    if (!suffix) return filePath.startsWith(prefix);
    return filePath.startsWith(prefix) && filePath.endsWith(suffix);
  }
  return filePath === pattern;
}

// ── Sensitive paths ──────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
  "src/hooks/useDatabase",
  "src/lib/accounts",
  ".github/workflows",
  "supabase",
];

function isSensitive(filePath) {
  return SENSITIVE_PATTERNS.some(p => filePath.startsWith(p));
}

// ── Encontra card ativo ──────────────────────────────────────────
let card = null;

// Permitir mock para testes
if (process.env.PRE_PR_MOCK_CARD) {
  const mockId = process.env.PRE_PR_MOCK_CARD;
  const files = readdirSync(TASKS_DIR)
    .filter(f => f.endsWith(".md") && !EXCLUDE.has(f));
  for (const file of files) {
    const content = readFileSync(resolve(TASKS_DIR, file), "utf8");
    const meta = parseTable(content);
    if (meta.id === mockId) {
      card = { id: meta.id, content, file };
      break;
    }
  }
}

if (!card) {
  const files = readdirSync(TASKS_DIR)
    .filter(f => f.endsWith(".md") && !EXCLUDE.has(f));
  const activeCards = [];
  for (const file of files) {
    const content = readFileSync(resolve(TASKS_DIR, file), "utf8");
    const meta = parseTable(content);
    if (meta.id && ACTIVE_STATES.has(meta.estado)) {
      activeCards.push({ id: meta.id, content, file });
    }
  }
  if (activeCards.length === 0) {
    ok("Nenhum card ativo encontrado — pulando verificação de escopo");
    process.exit(0);
  }
  card = activeCards[0];
}

const allowedPatterns = parseAllowedFiles(card.content);

if (allowedPatterns.length === 0) {
  err(`Card ${card.id} não define "Arquivos permitidos"`);
  process.exit(1);
}

// Get diff files
const diffFiles = [];
try {
  // Import getDiffFiles from lib
  const { getDiffFiles } = await import("../lib.mjs");
  diffFiles.push(...getDiffFiles());
} catch {
  err("Não foi possível obter arquivos do diff");
  process.exit(1);
}

if (diffFiles.length === 0) {
  ok("Nenhum arquivo alterado — escopo ok");
  process.exit(0);
}

// Check each file
const violations = [];
const sensitiveViolations = [];

for (const filePath of diffFiles) {
  // Skip auto-generated/workflow-managed files
  if (filePath.startsWith("docs/reports/")) continue;
  if (filePath === "docs/handoff.md") continue;
  // Skip docs/tasks/ cards themselves (updating estado is expected)
  if (filePath.startsWith("docs/tasks/") && filePath.endsWith(".md")) continue;

  const allowed = allowedPatterns.some(p => matchesPattern(filePath, p));
  if (!allowed) {
    const sensitive = isSensitive(filePath);
    const entry = { file: filePath, sensitive };
    if (sensitive) sensitiveViolations.push(entry);
    else violations.push(entry);
  }
}

// Handle sensitive files: they require --allow-sensitive flag or ALLOW_SENSITIVE env
const allowSensitive = process.argv.includes("--allow-sensitive") || process.env.ALLOW_SENSITIVE === "true";

let hasError = false;

if (sensitiveViolations.length > 0) {
  if (allowSensitive) {
    console.log(`  ⚠️  Arquivos sensíveis (permitido via flag):`);
    for (const v of sensitiveViolations) {
      console.log(`       ${v.file}`);
    }
  } else {
    err(`Arquivos sensíveis detectados fora de arquivosPermitidos — use --allow-sensitive se intencional:`);
    for (const v of sensitiveViolations) {
      console.log(`       ${v.file}`);
    }
    hasError = true;
  }
}

if (violations.length > 0) {
  err(`Arquivos fora de "arquivosPermitidos" do card ${card.id}:`);
  for (const v of violations) {
    console.log(`       ${v.file}`);
  }
  console.log(`\n     Arquivos permitidos pelo card ${card.id}:`);
  for (const p of allowedPatterns) {
    console.log(`       ${p}`);
  }
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

ok(`Todos os arquivos do diff estão dentro do escopo do card ${card.id}`);
