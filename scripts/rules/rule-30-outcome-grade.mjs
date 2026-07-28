#!/usr/bin/env node

/**
 * rule-30-outcome-grade.mjs — Valida qualidade do diff via outcome grader.
 *
 * Regra #30: "Outcome grade mínimo de 80% para aprovação"
 *
 * Uso:
 *   node scripts/rules/rule-30-outcome-grade.mjs
 *
 * Depende de: scripts/outcome-grader.mjs
 * Integração: auto-descoberta pelo pre-pr-check.mjs via scripts/rules/
 *
 * ponytail: child_process + stdout parse, zero deps
 */

import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");

function main() {
  try {
    const out = execSync("node scripts/outcome-grader.mjs", {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 15000,
    });

    // Extrair score da saída
    const scoreMatch = out.match(/Score:\s*(\d+)%/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 100;

    // Contar resultados
    const passCount = (out.match(/✅/g) || []).length;
    const warnCount = (out.match(/⚠️/g) || []).length;
    const failCount = (out.match(/❌/g) || []).length;

    console.log(`  ✅ rule-30: outcome grade ${score}% (${passCount} pass, ${warnCount} warn, ${failCount} fail)`);

    if (score < 80) {
      console.error(`  ❌ rule-30: outcome grade ${score}% abaixo do mínimo 80%`);
      console.error(`     Execute: npm run outcome:grader para detalhes`);
      process.exit(1);
    }
  } catch (e) {
    // Se outcome-grader falhou, pegar a mensagem da exceção
    const stderr = e.stderr || e.message || "";
    const stdout = e.stdout || "";

    // Extrair falhas
    const fails = stdout.split("\n")
      .filter(l => l.includes("❌"))
      .join(", ");

    console.error(`❌ rule-30: outcome grader falhou — ${fails || stderr.slice(0, 200)}`);
    console.error(`   Execute: npm run outcome:grader para detalhes`);
    process.exit(1);
  }
}

main();
