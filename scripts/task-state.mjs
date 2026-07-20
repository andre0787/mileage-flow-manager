#!/usr/bin/env node

/**
 * task-state.mjs — Transição de estado verificável para task-cards.
 *
 * Uso:
 *   node scripts/task-state.mjs P?-NN <novo-estado>
 *   node scripts/task-state.mjs P1-11 implementing
 *
 * Máquina de estados (fonte: WORKFLOW-MANIFEST.md):
 *   pending → planned → implementing → verified → review → done
 *   pending → blocked
 *   blocked → pending | planned
 *
 * ponytail: sem dependências, só fs nativo. Escreve o campo `estado`
 * diretamente no markdown do card.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TASKS_DIR = resolve(ROOT, "docs/tasks");

// ── Máquina de estados ──────────────────────────────────────────
const VALID_TRANSITIONS = {
  pending: ["planned", "implementing", "blocked"],
  blocked: ["pending", "planned"],
  planned: ["implementing"], // só redirect, pode voltar também
  implementing: ["verified", "planned"],
  verified: ["review", "implementing"],
  review: ["done", "implementing"],
  done: ["review"], // rever: pode reabrir
};

// ── Ajuda ────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
🔄 task-state — Transição de estado para task-cards

Uso:  node scripts/task-state.mjs <card-id> <novo-estado>

Estados: pending | blocked | planned | implementing | verified | review | done

Transições válidas:
  pending     → planned, implementing, blocked
  blocked     → pending, planned
  planned     → implementing
  implementing → verified, review
  verified    → review, implementing
  review      → done, implementing
  done        → review

Exemplos:
  node scripts/task-state.mjs P1-11 implementing
  node scripts/task-state.mjs P1-09 planned
`);
}

// ── Encontrar card ───────────────────────────────────────────────
function findCardFile(cardId) {
  if (!cardId) return null;
  const files = [];
  for (const f of readdirSync(TASKS_DIR)) {
    if (f === "_TEMPLATE.md" || f === "ROADMAP.md") continue;
    const content = readFileSync(resolve(TASKS_DIR, f), "utf8");
    const m = content.match(/^\|\s*`id`\s*\|\s*(.+?)\s*\|/m);
    if (m && m[1].trim() === cardId) {
      return resolve(TASKS_DIR, f);
    }
  }
  return null;
}

// ── Extrair/campo estado ─────────────────────────────────────────
function extractField(content, field) {
  const re = new RegExp(`^\\|\\s*\`${field}\`\\s*\\|\\s*(.+?)\\s*\\|`, "m");
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

function setField(content, field, newVal) {
  const re = new RegExp(
    `^\\|\\s*\`${field}\`\\s*\\|\\s*.+?\\s*\\|`,
    "m"
  );
  if (!content.match(re)) return null;
  return content.replace(re, `| \`${field}\` | ${newVal} |`);
}

// ── Main ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length < 2 || args.includes("--help") || args.includes("-h")) {
  showHelp();
  process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
}

const [cardId, nextState] = args;
const cardPath = findCardFile(cardId);

if (!cardPath) {
  console.log(`❌ Card "${cardId}" não encontrado em docs/tasks/`);
  process.exit(1);
}

const content = readFileSync(cardPath, "utf8");
const currentState = extractField(content, "estado");

if (!currentState) {
  console.log(`❌ Card "${cardId}" não tem campo \`estado\` na tabela de metadados`);
  process.exit(1);
}

// ── Validar transição ────────────────────────────────────────────
const allowed = VALID_TRANSITIONS[currentState];
if (!allowed) {
  console.log(`❌ Estado atual "${currentState}" não reconhecido`);
  process.exit(1);
}

if (!allowed.includes(nextState)) {
  console.log(`❌ Transição inválida: "${currentState}" → "${nextState}"`);
  console.log(`   Válidas: ${currentState} → ${allowed.join(" | ")}`);
  process.exit(1);
}

// ── Aplicar ──────────────────────────────────────────────────────
const updated = setField(content, "estado", nextState);
if (!updated) {
  console.log(`❌ Falha ao atualizar campo \`estado\``);
  process.exit(1);
}

writeFileSync(cardPath, updated);
console.log(`✅ ${cardId}: "${currentState}" → "${nextState}"`);

// Registra evidência rápida
const stamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
console.log(`📝 ${basename(cardPath)} atualizado às ${stamp}`);