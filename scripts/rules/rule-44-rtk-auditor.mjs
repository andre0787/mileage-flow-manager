#!/usr/bin/env node

/**
 * rule-44-rtk-auditor.mjs — Regra #44 (RTK Auditor)
 *
 * Valida a saúde dos slices RTK (Blueprint v9.0 — Fase B):
 * - HARD FAIL: `any` em src/features/ (slices/adapters) — falha crítica de tipagem.
 * - HARD FAIL: coleção (pasta em src/features/, exceto auth/api) SEM adapter
 *   createEntityAdapter (via createCollectionAdapter) — normalização obrigatória.
 * - AVISO (não bloqueia): createSlice em coleção sem adapter (ex: auth é slice
 *   de sessão, não coleção — isento).
 *
 * Regra #44: "Coleções usam createEntityAdapter (normalização de cache) com
 * seletores memoizados; sem any em slices."
 *
 * Uso: node scripts/rules/rule-44-rtk-auditor.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const FEATURES_DIR = resolve(ROOT, "src/features");
const ANY_RE = /\b(?:as\s+any|:\s*any|<any>)\b/;
const ADAPTER_RE = /createEntityAdapter|createCollectionAdapter/;
// Coleções = pastas de dados; auth (slice de sessão) e api (infra baseApi) são isentas.
const NON_COLLECTIONS = new Set(["auth", "api"]);

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  if (!existsSync(FEATURES_DIR)) {
    console.log("  ⏭️  rule-44: src/features/ não existe — regra não se aplica");
    return;
  }

  const collectionDirs = readdirSync(FEATURES_DIR)
    .filter((d) => statSync(join(FEATURES_DIR, d)).isDirectory())
    .filter((d) => !NON_COLLECTIONS.has(d));

  let hasError = false;
  let slicesSemAdapter = 0;

  for (const dir of collectionDirs) {
    const files = walk(join(FEATURES_DIR, dir));
    const hasAdapter = files.some(
      (f) => f.endsWith("/adapter.ts") && ADAPTER_RE.test(readFileSync(f, "utf8")),
    );
    if (!hasAdapter) {
      console.error(
        `❌ rule-44: ${dir} sem adapter createEntityAdapter (src/features/${dir}/adapter.ts via createCollectionAdapter)`,
      );
      hasError = true;
    } else {
      console.log(`  ✅ rule-44: ${dir} com adapter (createEntityAdapter)`);
    }

    for (const file of files) {
      const rel = file.replace(ROOT + "/", "");
      const content = readFileSync(file, "utf8");
      if (ANY_RE.test(content)) {
        console.error(`❌ rule-44: 'any' encontrado em ${rel} — tipagem estrita obrigatória`);
        hasError = true;
      }
      if (/createSlice/.test(content) && !ADAPTER_RE.test(content)) {
        slicesSemAdapter++;
        console.log(
          `  ⚠️  rule-44: ${rel} usa createSlice sem createEntityAdapter (sessão, não coleção?)`,
        );
      }
    }
  }

  if (hasError) process.exit(1);
  if (slicesSemAdapter > 0) {
    console.log(
      `  ⚠️  rule-44: ${slicesSemAdapter} slice(s) sem createEntityAdapter (aviso — não bloqueia)`,
    );
  } else {
    console.log("  ✅ rule-44: slices com createEntityAdapter (ou sessão/auth isento)");
  }
  console.log("  ✅ rule-44: rtk auditor ok");
}

main();
