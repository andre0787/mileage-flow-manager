#!/usr/bin/env node

/**
 * context-pack.mjs — Gera pacote de contexto seletivo a partir de um task-card.
 *
 * Uso:
 *   node scripts/context-pack.mjs --task P1-09
 *   node scripts/context-pack.mjs --task P1-11 --out /tmp/context.md
 *
 * Output: card + seções relevantes de CONVENTIONS.md + arquivos da área +
 *         contratos/invariantes + comandos de verificação + CI.
 *
 * ponytail: extração determinística por mapeamento de palavras-chave,
 * sem parser semântico de código.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TASKS_DIR = resolve(ROOT, "docs/tasks");
const CONVENTIONS_PATH = resolve(ROOT, "docs/CONVENTIONS.md");
const ARCHITECTURE_PATH = resolve(ROOT, "docs/ARCHITECTURE.md");
const STACK_PATH = resolve(ROOT, "docs/STACK.md");

// ── Mapeamento: palavra-chave no card → seções da CONVENTIONS.md ──
// Cada entrada: { keywords, sections } — se o card (título/objetivo/meta)
// contém qualquer keyword, a seção é incluída.
const AREA_RULES = [
  {
    keywords: ["móbile", "mobile", "viewport", "scroll", "teclado", "keyboard"],
    sections: ["React & Estado", "shadcn/ui", "Imutabilidade de Estado", "Promessas de UI"],
  },
  {
    keywords: ["financeiro", "saldo", "custo", "lucro", "amount", "balance", "invested", "total_invested"],
    sections: ["Invariantes Financeiras", "Estoques e Cache"],
  },
  {
    keywords: ["workflow", "task:state", "task-state", "task-card", "task-validate", "task:validate"],
    sections: ["CI/CD & Verificação", "Relatório Pós-Implementação"],
  },
  {
    keywords: ["context:pack", "context-pack", "contexto seletivo", "pacote de contexto"],
    sections: ["Gerenciamento de Contexto", "Handoff — Atualização Obrigatória Pós-PR"],
  },
  {
    keywords: ["teste", "test", "e2e", "playwright", "vitest"],
    sections: ["CI/CD & Verificação"],
  },
  {
    keywords: ["query", "cache", "supabase", "database", "invalidar", "mutation"],
    sections: ["Config Global", "Estoques e Cache", "React & Estado"],
  },
  {
    keywords: ["formulário", "dropdown", "tabela", "botão", "sidebar", "dialog", "sheet", "drawer", "componente", "responsivo", "layout"],
    sections: ["shadcn/ui", "Imutabilidade de Estado", "Promessas de UI"],
  },
];

// Seções sempre incluídas
const ALWAYS_INCLUDE = ["Nomenclatura", "Importações", "Escopo Estrito"];

// ── Help ─────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
📦 context:pack — Gera pacote de contexto seletivo

Uso:  node scripts/context-pack.mjs --task <card-id> [--out <path>]

Exemplos:
  node scripts/context-pack.mjs --task P1-09
  node scripts/context-pack.mjs --task P1-11 --out /tmp/p1-11-context.md
`);
}

// ── Encontrar card ───────────────────────────────────────────────
function findCardContent(cardId) {
  for (const f of readdirSync(TASKS_DIR)) {
    if (f === "_TEMPLATE.md" || f === "ROADMAP.md") continue;
    const content = readFileSync(resolve(TASKS_DIR, f), "utf8");
    const m = content.match(/^\|\s*`id`\s*\|\s*(.+?)\s*\|/m);
    if (m && m[1].trim() === cardId) return { content, file: f };
  }
  return null;
}

// ── Extrair metadados de tabela ──────────────────────────────────
function parseMeta(cardContent) {
  const meta = {};
  const rowRe = /^\|\s*`(\w+)`\s*\|\s*(.+?)\s*\|/gm;
  let match;
  while ((match = rowRe.exec(cardContent)) !== null) {
    meta[match[1]] = match[2].trim();
  }
  return meta;
}

// ── Extrair seção por heading ────────────────────────────────────
function extractSection(content, heading) {
  // Busca "## heading" ou "## heading — ..." na linha
  const re = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |--).*(\\n(?!## ).*)*`, "m");
  const m = content.match(re);
  if (m) return m[0].trim();
  // Fallback: "## heading"
  const re2 = new RegExp(
    `^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(\\n(?!## ).*)*(?=\\n## |$)`,
    "m"
  );
  const m2 = content.match(re2);
  if (m2) return m2[0].trim();
  return null;
}

function extractAllSections(content) {
  const sections = {};
  const headingRe = /^## (.+)/gm;
  let lastHeading = null;
  let lastIndex = 0;
  let match;
  while ((match = headingRe.exec(content)) !== null) {
    if (lastHeading !== null) {
      sections[lastHeading] = content.slice(lastIndex, match.index).trim();
    }
    lastHeading = match[1].trim();
    lastIndex = headingRe.lastIndex;
  }
  if (lastHeading !== null) {
    sections[lastHeading] = content.slice(lastIndex).trim();
  }
  return sections;
}

// ── Selecionar seções relevantes ─────────────────────────────────
function selectSections(cardText) {
  const lower = cardText.toLowerCase();
  const selected = new Set(ALWAYS_INCLUDE);

  for (const rule of AREA_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        rule.sections.forEach((l) => selected.add(l));
        break;
      }
    }
  }

  return [...selected];
}

// ── Main ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let taskId = null;
let outPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--task" && args[i + 1]) taskId = args[++i];
  else if (args[i] === "--out" && args[i + 1]) outPath = args[++i];
  else if (args[i] === "--help" || args[i] === "-h") { showHelp(); process.exit(0); }
}

if (!taskId) {
  console.log("❌ Passe --task <id>");
  showHelp();
  process.exit(1);
}

const card = findCardContent(taskId);
if (!card) {
  console.log(`❌ Card "${taskId}" não encontrado em docs/tasks/`);
  process.exit(1);
}

const meta = parseMeta(card.content);
const label = meta.id || taskId;
const area = meta.categoria || "???";

// Identificar seções relevantes
const selectedSections = selectSections(card.content + " " + (meta.objetivo || ""));

// Extrair
const conventions = readFileSync(CONVENTIONS_PATH, "utf8");
const allConvSections = extractAllSections(conventions);

// Pacote
const pack = [];

pack.push(`# 📦 Context Pack — ${label}`);
pack.push(`> Gerado: ${new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")}`);
pack.push(`> Card: \`${label}\` | Categoria: \`${area}\` | Arquivo: \`${card.file}\``);
pack.push("");

// 1. Card completo (compact)
pack.push("## 📋 Task Card");
pack.push("");
pack.push("```markdown");
pack.push(card.content.trim());
pack.push("```");
pack.push("");

// 2. Seções relevantes da CONVENTIONS.md
pack.push("## 📐 Convenções Relevantes");
pack.push(`> Seções selecionadas (${selectedSections.length}): ${selectedSections.join(", ")}`);
pack.push("");

for (const heading of selectedSections) {
  let section = allConvSections[heading];
  if (!section) section = extractSection(conventions, heading);
  if (section) {
    // Limitar seção a 80 linhas
    const lines = section.split("\n");
    const trimmed = lines.slice(0, 80).join("\n");
    pack.push(`### ${heading}`);
    pack.push("");
    pack.push(trimmed);
    pack.push("");
  }
}

// 3. Comandos de verificação
pack.push("## 🔧 Comandos de Verificação");
pack.push("");
const verifies = [];
if (area !== "docs") verifies.push("`npm run check` (typecheck + lint + format + unit + docs + build)");
verifies.push("`npm run test` — testes unitários");
verifies.push("`npm run pre-pr` — validação completa antes do PR");
pack.push(verifies.map((v) => `- ${v}`).join("\n"));

// 4. Stack
if (existsSync(STACK_PATH)) {
  pack.push("");
  pack.push("## 📦 Stack");
  pack.push("");
  pack.push(readFileSync(STACK_PATH, "utf8").trim());
  pack.push("");
}

// 5. Feedback
pack.push("");
pack.push("## ⚠️ Lembrete");
pack.push("> Toda regra imutável de AGENTS.md tem script de validação. `pre-pr` roda todos.");
pack.push("> Nenhum console.log em produção; usar `logInfo`/`logWarn`/`logError` de `@/lib/logger`.");

const output = pack.join("\n");

if (outPath) {
  writeFileSync(outPath, output);
  console.log(`✅ Pacote salvo: ${outPath} (${output.length} chars, ~${Math.round(output.length/4)} tokens)`);
} else {
  console.log(output);
  console.log(`\n---\n📊 ${output.length} chars (~${Math.round(output.length/4)} tokens)`);
}