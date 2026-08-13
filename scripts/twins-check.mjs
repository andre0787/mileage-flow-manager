#!/usr/bin/env node

/**
 * twins-check.mjs — Busca automatizada de padrão para TWINS gate.
 *
 * Uso:
 *   node scripts/twins-check.mjs <padrão> [glob]
 *
 * Exemplo:
 *   node scripts/twins-check.mjs "from.*@/components/" "src/"
 *   → Busca o padrao em arquivos na pasta src/
 *
 * Saída formatada para uso no relatório AUTH/TWINS.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const pattern = process.argv[2];
const glob = process.argv[3] || "src/";

if (!pattern) {
  console.error("Uso: node scripts/twins-check.mjs <padrão> [glob]");
  console.error("  padrão: regex ou literal para buscar");
  console.error("  glob:   padrão de arquivos (default: src/)");
  process.exit(1);
}

try {
  const grepCmd = `grep -rn "${pattern}" ${glob} --include="*.ts" --include="*.tsx" 2>/dev/null | head -50`;
  const output = execSync(grepCmd, { encoding: "utf8", maxBuffer: 1024 * 1024 });

  const lines = output.trim().split("\n").filter(Boolean);

  if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
    console.log(`TWINS: searched "${pattern}" in ${glob} — found 0 other locations.`);
    process.exit(0);
  }

  console.log(`TWINS: searched "${pattern}" in ${glob} — found ${lines.length} other locations:\n`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
} catch (e) {
  // grep exit code 1 = no matches
  if (
    e &&
    typeof e === "object" &&
    "status" in e &&
    /** @type {{status?:number}}*/ (e).status === 1
  ) {
    console.log(`TWINS: searched "${pattern}" in ${glob} — found 0 other locations.`);
    process.exit(0);
  }
  console.error(
    `TWINS: erro ao buscar — ${e && typeof e === "object" && "message" in e ? e.message : String(e)}`,
  );
  process.exit(1);
}
