#!/usr/bin/env node

/**
 * rule-48-telemetry-auditor.mjs — Regra #48 (Telemetry Auditor)
 *
 * Telemetria de eficiência da IA íntegra e rastreável:
 * - HARD FAIL: `src/lib/aiTelemetry.ts` ausente (lib de registro).
 * - HARD FAIL: `tests/unit/aiTelemetry.test.ts` ausente (regra #31 — toda lib
 *   em src/lib/ tem test unitário).
 * - HARD FAIL: migration de `ai_telemetry` ausente em supabase/migrations/.
 * - HARD FAIL: tabela `ai_telemetry` criada sem RLS `auth.uid()` (rule-40/43).
 *
 * Regra #48: "Eficiência da IA registrada ao finalizar task; lib
 * src/lib/aiTelemetry.ts e tabela ai_telemetry íntegras (RLS)."
 *
 * Uso: node scripts/rules/rule-48-telemetry-auditor.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const LIB_PATH = resolve(ROOT, "src/lib/aiTelemetry.ts");
const TEST_PATH = resolve(ROOT, "tests/unit/aiTelemetry.test.ts");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");

function main() {
  let hasError = false;

  if (!existsSync(LIB_PATH)) {
    console.error("❌ rule-48: src/lib/aiTelemetry.ts ausente — crie a lib de registro");
    hasError = true;
  } else {
    console.log("  ✅ rule-48: lib aiTelemetry.ts presente");
  }

  if (!existsSync(TEST_PATH)) {
    console.error("❌ rule-48: tests/unit/aiTelemetry.test.ts ausente — toda lib tem test (regra #31)");
    hasError = true;
  } else {
    console.log("  ✅ rule-48: test unitário da lib presente");
  }

  let migrationFile = null;
  if (existsSync(MIGRATIONS_DIR)) {
    migrationFile = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .find((f) => {
        const content = readFileSync(resolve(MIGRATIONS_DIR, f), "utf8");
        return /CREATE\s+TABLE[^;]*ai_telemetry/i.test(content);
      });
  }

  if (!migrationFile) {
    console.error(
      "❌ rule-48: migration de ai_telemetry ausente em supabase/migrations/ — crie a tabela com RLS",
    );
    hasError = true;
  } else {
    const content = readFileSync(resolve(MIGRATIONS_DIR, migrationFile), "utf8");
    if (/CREATE\s+POLICY[\s\S]*?ai_telemetry[\s\S]*?auth\.uid\(\)/i.test(content) || /CREATE\s+POLICY[\s\S]*?auth\.uid\(\)[\s\S]*?ai_telemetry/i.test(content)) {
      console.log(`  ✅ rule-48: migration ${migrationFile} com RLS auth.uid()`);
    } else {
      console.error(`❌ rule-48: migration ${migrationFile} sem política RLS auth.uid() para ai_telemetry`);
      hasError = true;
    }
  }

  if (hasError) process.exit(1);
  console.log("  ✅ rule-48: telemetry auditor ok");
}

main();
