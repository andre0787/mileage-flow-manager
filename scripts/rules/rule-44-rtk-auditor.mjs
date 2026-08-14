#!/usr/bin/env node

/**
 * rule-44-rtk-auditor.mjs — Regra #44 (RTK Auditor)
 *
 * Valida a saúde dos slices RTK:
 * - HARD FAIL: `any` em src/features/ (slices/adapters) — falha crítica de tipagem.
 * - AVISO (não bloqueia): coleções gerenciadas por createSlice sem
 *   createEntityAdapter — adoção progressiva (Fase B do Blueprint v9.0).
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
const ADAPTER_RE = /createEntityAdapter/;

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
  const files = walk(FEATURES_DIR);
  if (files.length === 0) {
    console.log("  ⏭️  rule-44: src/features/ não existe — regra não se aplica");
    return;
  }

  let hasError = false;
  let slicesSemAdapter = 0;
  for (const file of files) {
    const rel = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf8");

    if (ANY_RE.test(content)) {
      console.error(`❌ rule-44: 'any' encontrado em ${rel} — tipagem estrita obrigatória`);
      hasError = true;
    }

    // Aviso: createSlice gerenciando coleção sem createEntityAdapter
    if (/createSlice/.test(content) && !ADAPTER_RE.test(content)) {
      slicesSemAdapter++;
      console.log(
        `  ⚠️  rule-44: ${rel} usa createSlice sem createEntityAdapter (adoção progressiva — Fase B)`,
      );
    }
  }

  if (hasError) process.exit(1);
  if (slicesSemAdapter > 0) {
    console.log(
      `  ⚠️  rule-44: ${slicesSemAdapter} slice(s) sem createEntityAdapter (aviso — não bloqueia)`,
    );
  } else {
    console.log("  ✅ rule-44: slices com createEntityAdapter (ou sem slice de coleção)");
  }
  console.log("  ✅ rule-44: rtk auditor ok");
}

main();
