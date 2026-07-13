#!/usr/bin/env node

/**
 * rule-05-ci-workflows.mjs — Verifica regra #5: CI/CD workflows existem.
 *
 * Valida que .github/workflows/ci.yml e .github/workflows/deploy.yml
 * existem e têm conteúdo mínimo (jobs, steps).
 *
 * Uso: node scripts/rules/rule-05-ci-workflows.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, ROOT } from "../lib.mjs";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const WORKFLOWS = [
  { path: ".github/workflows/ci.yml", label: "CI (build + testes)" },
  { path: ".github/workflows/deploy.yml", label: "Deploy (Vercel)" },
];

let allOk = true;

for (const { path: relPath, label } of WORKFLOWS) {
  const full = resolve(ROOT, relPath);
  if (!existsSync(full)) {
    err(`Workflow faltando: ${relPath} (regra #5 — ${label})`);
    allOk = false;
    continue;
  }
  const content = readFileSync(full, "utf8");
  if (!content.includes("jobs:")) {
    err(`Workflow sem jobs: ${relPath} (regra #5 — ${label})`);
    allOk = false;
  }
}

if (allOk) ok("CI/CD workflows presentes (regra #5)");
else process.exit(1);
