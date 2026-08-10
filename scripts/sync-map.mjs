#!/usr/bin/env node

/**
 * sync-map.mjs — Sincroniza a árvore de diretórios de src/ no docs/MAP.md.
 *
 * Contrato (Blueprint v4.0 P0, spec 2026-08-10):
 * - Gera árvore de diretórios de src/ (pastas e arquivos .ts/.tsx — árvore completa).
 * - Atualiza SOMENTE a seção delimitada por `<!-- STRUCTURE-START -->` …
 *   `<!-- STRUCTURE-END -->` no docs/MAP.md.
 * - Se a seção não existir, cria antes do heading "🤖 Índice Auto-Gerado".
 * - Nunca toca tabelas curadas nem o índice auto-gerado do pre-pr.
 * - `--dry-run` imprime diff sem escrever.
 * - Modo fixture: `MOCK_ROOT` aponta para a raiz do projeto sob teste.
 *
 * ponytail: fs + path nativos, zero deps.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join, relative, sep } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const MAP_PATH = join(ROOT, "docs", "MAP.md");

const STRUCTURE_START = "<!-- STRUCTURE-START -->";
const STRUCTURE_END = "<!-- STRUCTURE-END -->";
const INDEX_HEADING = "🤖 Índice Auto-Gerado";

const DRY_RUN = process.argv.slice(2).includes("--dry-run");

/** Coleta a árvore de src/: diretórios e arquivos .ts/.tsx */
function buildTree(dir) {
  const entries = readdirSync(dir)
    .map((name) => {
      const p = join(dir, name);
      const st = statSync(p);
      return { name, isDir: st.isDirectory(), path: p };
    })
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1; // pastas primeiro
      return a.name.localeCompare(b.name);
    });

  const lines = [];
  for (const entry of entries) {
    if (!entry.isDir && !/\.(ts|tsx)$/.test(entry.name)) continue;
    const isLast = entries[entries.length - 1] === entry;
    const prefix = isLast ? "└── " : "├── ";
    lines.push(`${prefix}${entry.name}${entry.isDir ? "/" : ""}`);
    if (entry.isDir) {
      const sub = buildTree(entry.path).map((l, i, arr) => {
        const last = i === arr.length - 1;
        return `${isLast ? "    " : "│   "}${l}`;
      });
      lines.push(...sub);
    }
  }
  return lines;
}

/** Gera a seção completa (marcadores + fenced code block com a árvore) */
function renderSection() {
  const tree = buildTree(SRC);
  const body = ["```tree", "src/", ...tree, "```"].join("\n");
  return `${STRUCTURE_START}\n${body}\n${STRUCTURE_END}`;
}

/**
 * Substitui/insere a seção STRUCTURE no MAP.md.
 * Se apenas UM dos marcadores existir (start sem end ou vice-versa), trata como
 * seção ausente: remove o marcador órfão e cria a seção completa — nunca deixa
 * marcador solto no arquivo.
 */
function applySection(markdown, section) {
  const startIdx = markdown.indexOf(STRUCTURE_START);
  const endIdx = markdown.indexOf(STRUCTURE_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = markdown.slice(0, startIdx);
    const after = markdown.slice(endIdx + STRUCTURE_END.length);
    return `${before}${section}${after}`;
  }

  // Marcador parcial: remove o marcador órfão (mantém o conteúdo restante) e
  // segue o fluxo de "seção ausente"
  let base = markdown;
  if (startIdx !== -1) {
    base = base.slice(0, startIdx) + base.slice(startIdx + STRUCTURE_START.length);
  }
  if (endIdx !== -1) {
    base = base.slice(0, endIdx) + base.slice(endIdx + STRUCTURE_END.length);
  }

  // Seção não existe: cria antes do índice auto-gerado (ou no fim)
  const headingIdx = base.indexOf(`## ${INDEX_HEADING}`);
  if (headingIdx !== -1) {
    const before = base.slice(0, headingIdx);
    const after = base.slice(headingIdx);
    return `${before}${section}\n\n${after}`;
  }

  return `${base.replace(/\n*$/, "")}\n\n${section}\n`;
}

/** Diff linha a linha: mostra todas as linhas divergentes (não só a primeira) */
function printDiff(oldText, newText) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  const prefix = "  ";
  let shown = 0;
  for (let i = 0; i < max; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) continue;
    if (o !== undefined) console.log(`${prefix}- ${o}`);
    if (n !== undefined) console.log(`${prefix}+ ${n}`);
    shown++;
  }
  if (shown === 0) console.log(`${prefix}(sem diferenças de conteúdo)`);
}

function main() {
  if (!existsSync(MAP_PATH)) {
    console.error("❌ sync-map: docs/MAP.md não encontrado");
    process.exit(1);
  }
  if (!existsSync(SRC)) {
    console.log("  ⏭️  sync-map: src/ não encontrado — nada a sincronizar");
    return;
  }

  const markdown = readFileSync(MAP_PATH, "utf8");
  const section = renderSection();
  const updated = applySection(markdown, section);

  if (updated === markdown) {
    console.log("  ✅ sync-map: seção STRUCTURE já está atualizada");
    return;
  }

  if (DRY_RUN) {
    console.log("  🔍 sync-map (dry-run): seção STRUCTURE seria atualizada:");
    printDiff(markdown, updated);
    return;
  }

  writeFileSync(MAP_PATH, updated);
  console.log("  ✅ sync-map: seção STRUCTURE atualizada em docs/MAP.md");
}

main();
