#!/usr/bin/env node

/**
 * task-validate.mjs — Valida todos os task-cards em docs/tasks/ contra o schema.
 *
 * Uso:
 *   node scripts/task-validate.mjs           # valida todos os cards
 *   node scripts/task-validate.mjs --strict  # exit 1 se falhar
 *
 * ponytail: sem dependências externas, só fs nativo.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCHEMA_PATH = resolve(ROOT, "docs/task-card.schema.json");
const TASKS_DIR = resolve(ROOT, "docs/tasks");
const EXCLUDE = new Set(["_TEMPLATE.md", "ROADMAP.md"]);

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const requiredFields = new Set(schema.required);

const enums = {};
for (const [key, val] of Object.entries(schema.properties)) {
  if (val.enum) enums[key] = val.enum;
}

const REQUIRED_SECTIONS = [
  "Objetivo", "Não objetivos", "Contexto",
  "Arquivos permitidos", "Critérios de aceite",
  "Riscos / Invariantes", "Testes obrigatórios",
  "Evidência de pronto",
];

let errors = 0;

function ok(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { errors++; console.log(`  ❌ ${msg}`); }

// ── Parse metadata table ────────────────────────────────────────
function parseTable(content) {
  const meta = {};
  const rowRe = /^\|\s*`(\w+)`\s*\|\s*(.+?)\s*\|/gm;
  let match;
  while ((match = rowRe.exec(content)) !== null) {
    let val = match[2].trim();
    if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
    }
    meta[match[1]] = val;
  }
  return meta;
}

// ── Parse sections (line-by-line, robust) ───────────────────────
function parseSections(content) {
  const sections = {};
  let currentHeading = null;
  const lines = content.split("\n");
  for (const line of lines) {
    const m = line.match(/^## (.+)/);
    if (m) {
      currentHeading = m[1].trim();
      sections[currentHeading] = [];
    } else if (currentHeading) {
      sections[currentHeading].push(line);
    }
  }
  const result = {};
  for (const [h, lns] of Object.entries(sections)) {
    result[h] = lns.join("\n").trim();
  }
  return result;
}

// ── Validate one card ────────────────────────────────────────────
function validateCard(filePath) {
  const name = basename(filePath);
  const content = readFileSync(filePath, "utf8");
  const meta = parseTable(content);
  const sections = parseSections(content);
  const issues = [];

  // 1. Required table fields
  for (const field of requiredFields) {
    const val = meta[field];
    if (val === undefined || val === "") {
      issues.push(`campo "${field}" ausente na tabela`);
      continue;
    }
    const raw = String(val).trim();
    if (enums[field]) {
      // Strip emoji suffixes like ✅ for enum matching
      const clean = raw.replace(/[✅❌🟡🔴🟢].*$/, "").trim();
      if (!enums[field].includes(clean)) {
        issues.push(`"${field}" = "${raw}" — inválido. Valores: ${enums[field].join(" | ")}`);
      }
    }
    if (field === "id" && !/^P[0-9]+(-[A-Z0-9]+)?$/.test(raw)) {
      issues.push(`"id" = "${raw}" — não segue padrão P?-NN`);
    }
  }

  // 2. Required sections
  for (const section of REQUIRED_SECTIONS) {
    const body = sections[section];
    if (!body || body.length < 3) {
      issues.push(`seção "## ${section}" ausente ou vazia`);
    }
  }

  if (issues.length === 0) {
    ok(name);
    return true;
  }
  console.log(`  ❌ ${name}`);
  for (const i of issues) fail(`  ${i}`);
  return false;
}

// ── Main ─────────────────────────────────────────────────────────
console.log("\n📋 TASK CARD VALIDATION\n  Schema: docs/task-card.schema.json\n");

const files = readdirSync(TASKS_DIR)
  .filter(f => f.endsWith(".md") && !EXCLUDE.has(f))
  .sort();

if (files.length === 0) {
  console.log("  ⚠️  Nenhum task-card encontrado");
  process.exit(0);
}

let valid = 0;
for (const file of files) {
  if (validateCard(resolve(TASKS_DIR, file))) valid++;
}

const total = files.length;
console.log(`\n📊 Resultado: ${valid}/${total} cards válidos`);

if (errors > 0) {
  process.exit(1);
} else {
  ok("Todos os cards válidos!");
}
