#!/usr/bin/env node

/**
 * rule-43-migration-gate.mjs — Regra #43 (Migration Gate / Schema Drift)
 *
 * Previne schema drift em migrations Supabase:
 * - Migrations EXISTENTES não podem ser modificadas na branch (imutáveis —
 *   diff-scoped contra main). Correção de schema = migration nova.
 * - Migration NOVA com `CREATE TABLE` DEVE ter política RLS com `auth.uid()`
 *   (mesma exigência da rule-40, aqui focada em migrations).
 * - Nome de migration nova DEVE ser timestamp `YYYYMMDDHHMMSS_descricao.sql`.
 *
 * Regra #43: "Migrations Supabase são imutáveis e toda CREATE TABLE exige RLS."
 *
 * Uso: node scripts/rules/rule-43-migration-gate.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");
const TIMESTAMP_RE = /^\d{14}_/;
const RLS_RE = /CREATE\s+POLICY[\s\S]*?auth\.uid\(\)/i;

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 15000 }).trim();
  } catch {
    return "";
  }
}

function main() {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("  ⏭️  rule-43: supabase/migrations/ não existe — regra não se aplica");
    return;
  }

  const branch = git("git rev-parse --abbrev-ref HEAD") || "?";
  if (branch === "main" || branch === "master") {
    console.log("  ⏭️  rule-43: main — diff-scoped não se aplica");
    return;
  }

  const mergeBase = git("git merge-base main HEAD");
  const changed = mergeBase
    ? git(`git diff --name-only ${mergeBase} HEAD`)
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.startsWith("supabase/migrations/") && f.endsWith(".sql"))
    : [];

  if (changed.length === 0) {
    console.log("  ✅ rule-43: nenhuma migration alterada na branch (diff-scoped)");
    return;
  }

  let hasError = false;
  for (const file of changed.sort()) {
    // Migration EXISTENTE modificada → schema drift → fail
    const existsInMain = git(`git cat-file -e ${mergeBase}:${file} && echo exists`) === "exists";
    if (existsInMain) {
      console.error(
        `❌ rule-43: migration EXISTENTE modificada na branch: ${file} — migrations são imutáveis; crie uma migration nova (schema drift)`,
      );
      hasError = true;
      continue;
    }

    const name = file.split("/").pop() ?? "";
    if (!TIMESTAMP_RE.test(name)) {
      console.error(
        `❌ rule-43: migration nova sem nome timestamp (YYYYMMDDHHMMSS_descricao.sql): ${name}`,
      );
      hasError = true;
    }

    const content = readFileSync(join(ROOT, file), "utf8");
    if (/CREATE\s+TABLE/i.test(content) && !RLS_RE.test(content)) {
      console.error(
        `❌ rule-43: ${name} cria tabela sem política RLS com auth.uid() — toda CREATE TABLE exige CREATE POLICY (USING (auth.uid()))`,
      );
      hasError = true;
    }
    console.log(`  ✅ rule-43: migration nova ${name} (RLS ok ou sem CREATE TABLE)`);
  }

  if (hasError) process.exit(1);
  console.log("  ✅ rule-43: migration ok");
}

main();
