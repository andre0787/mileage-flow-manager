#!/usr/bin/env node

/**
 * trim-tracking.mjs — Rotação de telemetria (events/quality) com arquivamento.
 *
 * Mantém docs/tracking/events.jsonl e quality.jsonl enxutos (ativos para os
 * scripts e diffs de git pequenos) e arquiva linhas antigas em
 * docs/tracking/archive/<arquivo>-YYYY-MM.jsonl — histórico preservado.
 *
 * Uso:
 *   node scripts/trim-tracking.mjs              # dry-run (mostra o que faria)
 *   node scripts/trim-tracking.mjs --apply      # aplica a rotação
 *   node scripts/trim-tracking.mjs --events 1200 --quality 600   # limites custom
 *
 * ponytail: usa splitAtLimit de lib/log-trim.mjs, zero deps.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { splitAtLimit } from "./lib/log-trim.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TRACKING_DIR = resolve(ROOT, "docs/tracking");
const ARCHIVE_DIR = resolve(TRACKING_DIR, "archive");

const SHOULD_APPLY = process.argv.includes("--apply");

function flagInt(flag, def) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || def : def;
}

const LIMITS = {
  "events.jsonl": flagInt("--events", 1200),
  "quality.jsonl": flagInt("--quality", 600),
};

/** Exportada para testes: decide arquivo de archive pelo mês da 1ª linha arquivada. */
export function archiveNameFor(ts, base) {
  const month = String(ts || "").slice(0, 7) || "unknown";
  return `${base.replace(/\.jsonl$/, "")}-${month}.jsonl`;
}

/** Exportada para testes: linha JSON que não pode ser parseada é ignorada (corrompida). */
export function isUsableLine(line) {
  if (!line || !line.trim()) return false;
  try {
    JSON.parse(line);
    return true;
  } catch {
    return false;
  }
}

/** Executa a rotação de um arquivo. Retorna resumo { file, kept, archived, archiveFiles }. */
export function trimFile(file, max, now = new Date()) {
  const path = resolve(TRACKING_DIR, file);
  if (!existsSync(path)) return { file, kept: 0, archived: 0, archiveFiles: [] };
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const usable = lines.filter(isUsableLine);
  if (usable.length !== lines.length) {
    // Linhas corrompidas são descartadas na rotação (defesa contra log truncado)
    if (SHOULD_APPLY) writeFileSync(path, usable.join("\n") + (usable.length ? "\n" : ""));
  }
  const { kept, archived } = splitAtLimit(usable, max);
  const archiveFiles = [];
  if (SHOULD_APPLY && archived.length > 0) {
    if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });
    const byMonth = {};
    for (const line of archived) {
      try {
        const ts = JSON.parse(line).timestamp || "";
        const name = archiveNameFor(ts, file);
        (byMonth[name] = byMonth[name] || []).push(line);
      } catch {
        /* linha já validada — não deve chegar aqui */
      }
    }
    for (const [name, archLines] of Object.entries(byMonth)) {
      const target = resolve(ARCHIVE_DIR, name);
      appendFileSync(target, archLines.join("\n") + "\n");
      archiveFiles.push(name);
    }
    const final = kept.join("\n") + (kept.length ? "\n" : "");
    writeFileSync(path, final);
  }
  return { file, kept: kept.length, archived: archived.length, archiveFiles };
}

// ── CLI ───────────────────────────────────────────────────────────────
const IS_MAIN =
  process.argv[1] &&
  fileURLToPath(pathToFileURL(resolve(process.argv[1]))) === fileURLToPath(import.meta.url);

if (IS_MAIN) {
  console.log(`${SHOULD_APPLY ? "🔧 Aplicando" : "🔍 Dry-run"} rotação de telemetria (limites: events=${LIMITS["events.jsonl"]}, quality=${LIMITS["quality.jsonl"]})`);
  for (const [file, max] of Object.entries(LIMITS)) {
    const r = trimFile(file, max);
    if (r.archived > 0) {
      console.log(`  📦 ${file}: mantidas ${r.kept} · arquivadas ${r.archived} → ${r.archiveFiles.join(", ")}${SHOULD_APPLY ? "" : " (--apply para aplicar)"}`);
    } else {
      console.log(`  ✅ ${file}: ${r.kept} linhas — abaixo do limite, nada a arquivar`);
    }
  }
  if (!SHOULD_APPLY) {
    console.log("\n  Use --apply para executar a rotação (histórico vai para docs/tracking/archive/).");
  }
}
