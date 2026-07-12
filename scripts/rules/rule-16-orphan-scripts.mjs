#!/usr/bin/env node

/**
 * rule-16-orphan-scripts.mjs — Verifica regra #16: scripts têm npm atalho.
 *
 * Todo .mjs/.js em scripts/ DEVE ter um atalho npm em package.json
 * (ex: "quality": "node scripts/quality-report.mjs").
 *
 * Uso: node scripts/rules/rule-16-orphan-scripts.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const SCRIPTS_DIR = resolve(ROOT, "scripts");
const PACKAGE_JSON = resolve(ROOT, "package.json");

// ── Main ─────────────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf-8"));
const npmScripts = pkg.scripts || {};

// Gather all npm script values as a set for lookup
const scriptValues = new Set(Object.values(npmScripts));

// List all executable scripts in scripts/ dir
const scriptFiles = readdirSync(SCRIPTS_DIR)
  .filter(f => f.endsWith(".mjs") || f.endsWith(".js"))
  // skip lib.mjs — utility module, not a standalone script
  .filter(f => f !== "lib.mjs")
  .sort();

const errors = [];

for (const file of scriptFiles) {
  const nodeCall = `node scripts/${file}`;
  const hasNpmScript = [...scriptValues].some(v => v.includes(file) || v === nodeCall);

  if (!hasNpmScript) {
    errors.push(file);
  }
}

if (errors.length > 0) {
  for (const f of errors) {
    warn(`Script sem npm atalho: scripts/${f} — adicione em package.json`);
  }
  err(`${errors.length} script(s) sem atalho npm (regra #16)`);
  process.exit(1);
}

ok("todos os scripts têm atalho npm (regra #16)");
