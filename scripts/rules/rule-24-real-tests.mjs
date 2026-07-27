#!/usr/bin/env node

/**
 * rule-24-real-tests.mjs — Verifica regra #24: testes E2E usam dados reais.
 *
 * Testes E2E DEVEM:
 *   1. Rodar contra Supabase real (produção/staging) — sem mocks de API
 *   2. Criar entidades reais (usuário, owner, etc.) via API ou formulário
 *   3. Verificar no DOM real — sem mockar componentes React Query/Radix
 *
 * Uso: node scripts/rules/rule-24-real-tests.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

const TESTS_DIR = resolve(ROOT, "tests");

// ── Helpers ───────────────────────────────────────────────────────────

function hasBadPattern(content) {
  const badPatterns = [
    // Mocks de Supabase
    /mock.*supabase/i,
    /jest\.mock.*supabase/i,
    /vi\.mock.*supabase/i,
    // Mock manual de queryClient (invalida o propósito do E2E real)
    /mock.*queryClient/i,
    /mock.*react-query/i,
    // Mock de Radix Select (testar comportamento real)
    /mock.*radix/i,
    /mock.*select/i,
    // Mock de mutation — mascararia race conditions reais
    /mock.*mutation/i,
    /mock.*onSuccess/i,
  ];

  return badPatterns.some((pattern) => pattern.test(content));
}

function hasRealPattern(content) {
  const realPatterns = [
    // Usa Supabase real via API direta
    /supabase\.co/,
    /supabase\.url/,
    /\.env/,
    // Faz chamadas reais de fetch/API
    /fetch\(.*supabase/,
    // Navega de verdade entre páginas
    /page\.goto\(/,
    // Espera dados reais aparecerem no DOM
    /toBeVisible/,
    /waitForSelector/,
    /waitForFunction/,
  ];

  return realPatterns.some((pattern) => pattern.test(content));
}

// ── Main ───────────────────────────────────────────────────────────────

const testFiles = readdirSync(TESTS_DIR)
  .filter((f) => f.endsWith(".spec.ts") || f.endsWith(".spec.js"))
  .sort();

if (testFiles.length === 0) {
  warn("Nenhum arquivo de teste E2E encontrado em tests/");
  process.exit(0);
}

const violations = [];
const warnings = [];

for (const file of testFiles) {
  const content = readFileSync(resolve(TESTS_DIR, file), "utf-8");

  // Pula testes que não são E2E (ex: unit tests com .spec.ts mas sem page/goto)
  const isE2E = content.includes("page.") || content.includes("Playwright") || content.includes("@playwright/test");

  if (!isE2E) continue;

  // Verifica se usa padrões reais
  const usesReal = hasRealPattern(content);
  const usesBadMock = hasBadPattern(content);

  if (!usesReal) {
    violations.push(
      `${file}: não usa dados reais (sem chamada a Supabase ou navegação real)`,
    );
  } else if (usesBadMock) {
    violations.push(
      `${file}: contém mock de Supabase/React Query/Radix — dados reais devem ser usados`,
    );
  }

  // Aviso: se tem skip/fdescribe mas não tem // intentional
  if (content.includes("test.skip") || content.includes("describe.skip")) {
    warnings.push(
      `${file}: contém test.skip/describe.skip (intencional?)`,
    );
  }
}

if (violations.length > 0) {
  for (const v of violations) {
    warn(v);
  }
  err(`${violations.length} violação(ões) na regra #24 (testes com uso real)`);
  process.exit(1);
}

if (warnings.length > 0) {
  for (const w of warnings) {
    warn(w);
  }
}

ok(`todos os ${testFiles.length} teste(s) E2E usam dados reais (regra #24)`);