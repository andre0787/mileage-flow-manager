#!/usr/bin/env node

/**
 * rule-13-validations.mjs — Verifica regra #13: scripts de validação existem.
 *
 * Uso: node scripts/rules/rule-13-validations.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, ROOT } from "../lib.mjs";
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";

const checks = {
  ".githooks/pre-commit": existsSync(resolve(ROOT, ".githooks/pre-commit")),
  "scripts/pre-pr-check.mjs": existsSync(resolve(ROOT, "scripts/pre-pr-check.mjs")),
  "scripts/verify-docs.mjs": existsSync(resolve(ROOT, "scripts/verify-docs.mjs")),
  "scripts/rules/*.mjs": readdirSync(resolve(ROOT, "scripts/rules")).filter(f => f.endsWith(".mjs")).length > 0,
};

const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

if (missing.length > 0) {
  err(`Scripts de validação faltando (regra #13): ${missing.join(", ")}`);
  process.exit(1);
}
ok("scripts de validação presentes (regra #13)");
