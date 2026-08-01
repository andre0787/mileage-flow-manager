#!/usr/bin/env node
/**
 * rule-31 — Cobertura de testes para libs
 *
 * Verifica que toda biblioteca em src/lib/ tem um arquivo de teste
 * correspondente em tests/unit/.
 *
 * Regra imutável #31: "Toda lib em src/lib/ tem test unitário"
 *
 * Uso: node scripts/rules/rule-31-lib-test-coverage.mjs [--fix]
 */

import { readdirSync, existsSync } from "fs";
import { join, parse } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const ROOT = join(__dirname, "..", "..");
const LIB_DIR = join(ROOT, "src", "lib");
const TEST_DIR = join(ROOT, "tests", "unit");

const EXEMPTIONS = [
  "db.ts",                // DB connection setup — integration test
  "supabase.ts",          // Client singleton — integration test
];

export function checkLibCoverage({ fix = false } = {}) {
  const results = { pass: true, errors: [] };

  let libFiles;
  try {
    libFiles = readdirSync(LIB_DIR).filter((f) => f.endsWith(".ts") && !EXEMPTIONS.includes(f));
  } catch {
    results.pass = false;
    results.errors.push("src/lib/ não encontrado");
    return results;
  }

  let testFiles;
  try {
    testFiles = readdirSync(TEST_DIR).filter((f) => f.endsWith(".test.ts"));
  } catch {
    testFiles = [];
  }

  for (const libFile of libFiles) {
    const parsed = parse(libFile);
    const expectedTest = `${parsed.name}.test.ts`;

    if (!testFiles.includes(expectedTest)) {
      results.pass = false;
      results.errors.push(
        `${libFile} → falta tests/unit/${expectedTest}`
      );
    }
  }

  // Report
  const totalLibs = libFiles.length;
  const covered = totalLibs - results.errors.length;
  console.log(
    `\n📊 Cobertura de testes libs: ${covered}/${totalLibs} (${Math.round((covered / totalLibs) * 100)}%)`
  );

  // Registrar métrica estruturada (fonte dos KPIs de qualidade)
  if (totalLibs > 0) {
    try {
      execSync(
        `node scripts/quality-log.mjs rule-31 '{"covered":${covered},"total":${totalLibs},"pct":${Math.round((covered / totalLibs) * 100)}}'`,
        { cwd: ROOT, encoding: "utf8", timeout: 3000 },
      );
    } catch { /* não bloqueante */ }
  }

  if (results.pass) {
    console.log("✅ Toda lib tem teste correspondente.");
  } else {
    console.log(`❌ ${results.errors.length} lib(s) sem teste:`);
    for (const err of results.errors) {
      console.log(`   • ${err}`);
    }
  }

  return results;
}

// CLI
const args = process.argv.slice(2);
const fix = args.includes("--fix");
const results = checkLibCoverage({ fix });

if (!results.pass) {
  process.exit(1);
}
