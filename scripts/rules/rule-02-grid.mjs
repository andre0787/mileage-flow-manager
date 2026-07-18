#!/usr/bin/env node

/**
 * rule-02-grid.mjs — Verifica regra #2: grid max 2 colunas.
 *
 * Uso: node scripts/rules/rule-02-grid.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { git, ok, err, warn, ROOT } from "../lib.mjs";
import { resolve } from "path";

// ponytail: checks only staged additions vs HEAD, ignoring reformatted lines
const staged = git(`git diff --cached -- '*.tsx'`);

// Grid pattern is genuinely new if the diff has a `+` line with it
// but NO `-` line anywhere with the same pattern (pre-existing)
const removedHasGrid = /^-.*\bgrid-cols-[3-9]\b.*/m.test(staged);
const addedLines = [...staged.matchAll(/^\+(?!\+).*/gm)].map(m => m[0]);

const trulyNew = addedLines.filter(
  a => /\bgrid-cols-[3-9]\b|\bsm:grid-cols-[3-9]\b/.test(a) && !removedHasGrid
);

if (trulyNew.length > 0) {
  warn(`grid-cols-[3-9] novo: ${trulyNew.slice(0, 5).join(", ")}`);
  process.exit(1);
}
ok("nenhum grid-cols-3+ novo adicionado (regra #2)");
