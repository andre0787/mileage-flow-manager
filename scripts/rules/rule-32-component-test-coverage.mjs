#!/usr/bin/env node
/**
 * rule-32 — Cobertura de testes de componente
 *
 * Verifica que componentes CUSTOM em src/components/ui/ e hooks em src/hooks/
 * tem arquivo de teste correspondente.
 *
 * Regra imutável #32: "Componente customizado tem teste"
 *
 * Ignora:
 *   - Re-exports puros do shadcn/ui (ex: card.tsx, button.tsx)
 *   - Componentes marcados com comentário "ponytail: no-test"
 *   - Componentes legados (src/components/) que não são novos
 *
 * Uso: node scripts/rules/rule-32-component-test-coverage.mjs
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { join, parse } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const ROOT = join(__dirname, "..", "..");
const UI_DIR = join(ROOT, "src", "components", "ui");
const HOOKS_DIR = join(ROOT, "src", "hooks");
const TEST_DIR = join(ROOT, "tests", "components");
const HOOKS_TEST_DIR = join(ROOT, "tests", "unit");

// Componentes shadcn/ui puros — sem teste próprio
const SHADCN_EXEMPTIONS = [
  "alert-dialog.tsx",
  "badge.tsx",
  "button.tsx",
  "card.tsx",
  "dialog.tsx",
  "drawer.tsx",
  "input.tsx",
  "label.tsx",
  "progress.tsx",
  "select.tsx",
  "separator.tsx",
  "sheet.tsx",
  "sidebar.tsx",
  "skeleton.tsx",
  "sonner.tsx",
  "switch.tsx",
  "table.tsx",
  "tabs.tsx",
  "tooltip.tsx",
];

// Componentes customizados conhecidos
// Expanda esta lista conforme novos componentes são criados
const CUSTOM_UI_COMPONENTS = [
  "StatusBadge.tsx",
  "SearchInput.tsx",
  "DataTable.tsx",
];

// Hooks customizados que devem ter teste
const CUSTOM_HOOKS = [
  "useSmartQuery.ts",
];

function checkComponentCoverage() {
  const results = { pass: true, errors: [] };

  // --- Verifica componentes customizados em ui/ ---
  let allUiFiles;
  try {
    allUiFiles = readdirSync(UI_DIR);
  } catch {
    allUiFiles = [];
  }

  const customToCheck = allUiFiles.filter(
    (f) =>
      f.endsWith(".tsx") &&
      CUSTOM_UI_COMPONENTS.includes(f) &&
      !SHADCN_EXEMPTIONS.includes(f)
  );

  let testFiles;
  try {
    testFiles = readdirSync(TEST_DIR).filter(
      (f) => f.endsWith(".test.tsx") || f.endsWith(".test.ts")
    );
  } catch {
    testFiles = [];
  }

  for (const compFile of customToCheck) {
    const parsed = parse(compFile);
    const expectedTest = `${parsed.name}.test.tsx`;

    if (!testFiles.includes(expectedTest)) {
      const compPath = join(UI_DIR, compFile);
      if (existsSync(compPath)) {
        const content = readFileSync(compPath, "utf-8");
        if (content.includes("ponytail: no-test")) continue;
      }
      results.pass = false;
      results.errors.push(`ui/${compFile} → falta tests/components/${expectedTest}`);
    }
  }

  // --- Verifica hooks customizados ---
  let hookFiles;
  try {
    hookFiles = readdirSync(HOOKS_DIR).filter((f) => CUSTOM_HOOKS.includes(f));
  } catch {
    hookFiles = [];
  }

  let hookTestFiles;
  try {
    hookTestFiles = readdirSync(HOOKS_TEST_DIR).filter(
      (f) => f.endsWith(".test.ts") || f.endsWith(".test.tsx")
    );
  } catch {
    hookTestFiles = [];
  }

  for (const hookFile of hookFiles) {
    const parsed = parse(hookFile);
    const expectedTest = `${parsed.name}.test.ts`;

    if (!hookTestFiles.includes(expectedTest)) {
      const hookPath = join(HOOKS_DIR, hookFile);
      if (existsSync(hookPath)) {
        const content = readFileSync(hookPath, "utf-8");
        if (content.includes("ponytail: no-test")) continue;
      }
      results.pass = false;
      results.errors.push(`hooks/${hookFile} → falta tests/unit/${expectedTest}`);
    }
  }

  // Relatório
  const total = customToCheck.length + hookFiles.length;
  const covered = total - results.errors.length;

  console.log(
    `\n📊 Cobertura de testes (componentes+hooks): ${covered}/${total} (${total > 0 ? Math.round((covered / total) * 100) : 0}%)`
  );

  // Registrar métrica estruturada (fonte dos KPIs de qualidade)
  if (total > 0) {
    try {
      execSync(
        `node scripts/quality-log.mjs rule-32 '{"covered":${covered},"total":${total},"pct":${Math.round((covered / total) * 100)}}'`,
        { cwd: ROOT, encoding: "utf8", timeout: 3000 },
      );
    } catch { /* não bloqueante */ }
  }

  if (total === 0) {
    console.log("ℹ️ Nenhum componente/hook customizado para verificar.");
    return { pass: true, errors: [] };
  }

  if (results.pass) {
    console.log("✅ Todo componente/hook customizado tem teste.");
  } else {
    console.log(`❌ ${results.errors.length} arquivo(s) sem teste:`);
    for (const err of results.errors) {
      console.log(`   • ${err}`);
    }
  }

  return results;
}

// CLI
const results = checkComponentCoverage();
process.exit(results.pass ? 0 : 1);
