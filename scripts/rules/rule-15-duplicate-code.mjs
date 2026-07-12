#!/usr/bin/env node

/**
 * rule-15-duplicate-code.mjs — Verifica regra #15: sem duplicatas > 75%.
 *
 * Compara arquivos .tsx em src/components/ (exceto ui/) usando
 * coeficiente Dice nas linhas (trimmed). Flag se similaridade > 75%.
 *
 * Uso: node scripts/rules/rule-15-duplicate-code.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve, relative, extname } from "path";

const COMPONENTS = resolve(ROOT, "src/components");
const EXCLUDE_DIRS = new Set(["ui"]);

/** List all .tsx files recursively, skipping excluded dirs */
function listComponents(dir, prefix = "") {
  const result = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) {
        result.push(...listComponents(full, join(prefix, e.name)));
      }
    } else if (e.name.endsWith(".tsx")) {
      result.push({ path: full, rel: join(prefix, e.name) });
    }
  }
  return result;
}

/**
 * Dice coefficient between two arrays of lines.
 * Basta comparar linhas (trimmed, não vazias) como sets.
 */
function diceCoefficient(linesA, linesB) {
  const setA = new Set(linesA.map(l => l.trim()).filter(Boolean));
  const setB = new Set(linesB.map(l => l.trim()).filter(Boolean));

  let intersection = 0;
  for (const line of setA) {
    if (setB.has(line)) intersection++;
  }

  const total = setA.size + setB.size;
  if (total === 0) return 0;
  return (2 * intersection) / total;
}

// ── Main ─────────────────────────────────────────────────────────────

const files = listComponents(COMPONENTS);
const SIMILARITY_THRESHOLD = 0.75;
const MIN_LINES = 20; // ignore tiny files
const errors = [];

for (let i = 0; i < files.length; i++) {
  const contentA = readFileSync(files[i].path, "utf-8");
  const linesA = contentA.split("\n");

  // Skip non-component files (e.g. index, barrel)
  const baseName = files[i].rel.split("/").pop() || "";
  if (baseName === "index.tsx" || baseName === "index.ts") continue;

  for (let j = i + 1; j < files.length; j++) {
    const contentB = readFileSync(files[j].path, "utf-8");
    const linesB = contentB.split("\n");

    // Only compare files of similar size (0.5x to 2x)
    if (Math.min(linesA.length, linesB.length) < MIN_LINES) continue;
    const ratio = linesA.length / linesB.length;
    if (ratio < 0.5 || ratio > 2.0) continue;

    const dice = diceCoefficient(linesA, linesB);

    if (dice >= SIMILARITY_THRESHOLD) {
      errors.push({
        fileA: files[i].rel,
        fileB: files[j].rel,
        similarity: (dice * 100).toFixed(1),
        linesA: linesA.length,
        linesB: linesB.length,
      });
    }
  }
}

if (errors.length > 0) {
  for (const e of errors.sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity))) {
    warn(`Duplicatas ${e.similarity}%: ${e.fileA} (${e.linesA} linhas) ≈ ${e.fileB} (${e.linesB} linhas)`);
  }
  err(`${errors.length} par(es) de componente(s) com similaridade > ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}% (regra #15)`);
  process.exit(1);
}

ok("nenhuma duplicata suspeita entre componentes (regra #15)");
