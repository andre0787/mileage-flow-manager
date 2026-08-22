#!/usr/bin/env node

/**
 * context-audit.mjs — Auditoria de consumo de tokens/contexto do workflow.
 *
 * Estima o custo de contexto de uma sessão típica por categoria e identifica
 * os maiores consumidores. Tokens estimados = bytes / 4 (heurística ~4 chars).
 *
 * Uso:
 *   node scripts/context-audit.mjs           # relatório no console
 *   node scripts/context-audit.mjs --write   # salva docs/context-audit.md
 *
 * ponytail: zero deps, funções puras exportadas para teste.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOCS = resolve(ROOT, "docs");

/** Categorias → docs carregados (tabela do AGENTS.md — lazy loading). */
export const CATEGORY_DOCS = {
  feature: [
    "AGENTS.md",
    "docs/WORKFLOW-QUICKSTART.md",
    "docs/conventions/common.md",
    "docs/conventions/feature.md",
  ],
  bugfix: [
    "AGENTS.md",
    "docs/DEBUG.md",
    "docs/conventions/common.md",
    "docs/conventions/bugfix.md",
  ],
  docs: ["AGENTS.md"],
  refactor: [
    "AGENTS.md",
    "docs/conventions/common.md",
    "docs/conventions/refactor.md",
    "docs/ARCHITECTURE.md",
  ],
  chore: ["AGENTS.md"],
};

/** Tokens estimados a partir de bytes (heurística ~4 chars/token). */
export function bytesToTokens(bytes) {
  return Math.round((bytes || 0) / 4);
}

/** Lê o tamanho em caracteres de um caminho relativo (ou null se não existir). */
export function readSize(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), "utf8").length;
  } catch {
    return null;
  }
}

/** Soma caracteres de uma lista de paths (null-safe). Retorna { chars, tokens }. */
export function sumDocs(paths) {
  let chars = 0;
  const breakdown = [];
  for (const p of paths) {
    const size = readSize(p);
    if (size != null) {
      chars += size;
      breakdown.push({ path: p, chars: size, tokens: bytesToTokens(size) });
    }
  }
  return { chars, tokens: bytesToTokens(chars), breakdown };
}

/** Auditoria completa por categoria + overhead fixo. */
export function auditContext(now = new Date()) {
  const categories = {};
  for (const [cat, paths] of Object.entries(CATEGORY_DOCS)) {
    const s = sumDocs(paths);
    categories[cat] = {
      tokens: s.tokens,
      chars: s.chars,
      docs: s.breakdown.map((d) => `${d.path} (${d.tokens} tok)`).join(", "),
    };
  }

  // Overhead fixo por sessão (handoff + tracking ativos)
  const overhead = {
    handoff: bytesToTokens(readSize("docs/handoff.md") || 0),
    events: bytesToTokens(readSize("docs/tracking/events.jsonl") || 0),
    quality: bytesToTokens(readSize("docs/tracking/quality.jsonl") || 0),
  };

  // Maiores consumidores de docs (top 8)
  const allDocs = [
    "AGENTS.md",
    "docs/WORKFLOW.md",
    "docs/WORKFLOW-QUICKSTART.md",
    "docs/WORKFLOW-MANIFEST.md",
    "docs/MAP.md",
    "docs/conventions/common.md",
    "docs/conventions/feature.md",
    "docs/conventions/bugfix.md",
    "docs/conventions/refactor.md",
    "docs/conventions/workflow.md",
    "docs/ARCHITECTURE.md",
    "docs/STACK.md",
    "docs/handoff.md",
    "docs/LLM-ROUTER.md",
    "docs/CONTEXT-MANAGEMENT.md",
  ]
    .map((p) => ({ path: p, tokens: bytesToTokens(readSize(p) || 0) }))
    .filter((d) => d.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens);

  // Status por faixa de tokens da categoria mais pesada + overhead fixo.
  // Para modelos menores, tracking enorme é tão prejudicial quanto docs grandes,
  // mesmo quando não deveria ser carregado como contexto de trabalho.
  const maxCat = Math.max(...Object.values(categories).map((c) => c.tokens));
  const maxOverhead = Math.max(...Object.values(overhead));
  const status =
    maxOverhead > 20000
      ? { label: "Pesado — tracking", tone: "red" }
      : maxCat < 4000
        ? { label: "Enxuto", tone: "green" }
        : maxCat < 8000
          ? { label: "Moderado", tone: "amber" }
          : { label: "Pesado — otimizar", tone: "red" };

  return {
    categories,
    overhead,
    topDocs: allDocs.slice(0, 8),
    status,
    date: now.toISOString().slice(0, 10),
  };
}

/** Gera relatório markdown (usado no console e --write). */
export function renderMarkdown(audit) {
  const catRows = Object.entries(audit.categories)
    .map(([cat, c]) => `| ${cat} | ${c.tokens} | ${c.docs} |`)
    .join("\n");
  const topRows = audit.topDocs.map((d) => `| ${d.path} | ${d.tokens} |`).join("\n");
  return `# 🔬 Auditoria de Contexto — ${audit.date}

**Status: ${audit.status.label}** (categoria mais pesada: ${Math.max(...Object.values(audit.categories).map((c) => c.tokens))} tokens)

## Custo por categoria de sessão (docs carregados)

| Categoria | Tokens | Docs |
|---|---|---|
${catRows}

## Overhead fixo por sessão

- handoff.md: **${audit.overhead.handoff}** tokens
- events.jsonl: **${audit.overhead.events}** tokens
- quality.jsonl: **${audit.overhead.quality}** tokens

## Maiores consumidores de docs (top ${audit.topDocs.length})

| Arquivo | Tokens |
|---|---|
${topRows}

## Dicas de otimização

1. **Tracking**: rode \`npm run context:trim\` quando events/quality passarem dos budgets ativos (~80KB/40KB por padrão).
2. **WORKFLOW.md** é o doc mais pesado — a categoria feature agora carrega \`WORKFLOW-QUICKSTART.md\` (enxuto); leia o completo on-demand.
3. **context-pack** (\`npm run context:pack\`) entrega só as seções relevantes por task.
4. **Nav gate** (\`npm run nav:gate\`): use CRG para navegar sem ler arquivos inteiros.
`;
}

// ── CLI ───────────────────────────────────────────────────────────────
const IS_MAIN =
  process.argv[1] &&
  fileURLToPath(pathToFileURL(resolve(process.argv[1]))) === fileURLToPath(import.meta.url);

if (IS_MAIN) {
  const audit = auditContext();
  const md = renderMarkdown(audit);
  console.log(md);
  if (process.argv.includes("--write")) {
    writeFileSync(resolve(ROOT, "docs/context-audit.md"), md);
    console.log("✅ Salvo: docs/context-audit.md");
  }
}
