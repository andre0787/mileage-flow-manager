#!/usr/bin/env node

/**
 * rule-19-stock-validation.mjs — Verifica regra #19: estoque consistente.
 *
 * Validações ESTÁTICAS (sem DB):
 *   1. Toda chamada `invalidateQueries` DEVE ter `refetchType: 'all'`
 *   2. Nenhum `invalidateQueries` com `refetchType: 'active'` explícito
 *   3. Toda mutation que atualiza conta (entries, sales, accounts)
 *      DEVE invalidar a query de accounts
 *   4. `calcAccountUpdate` DEVE ser usado em toda mutation que afeta saldo
 *
 * Uso: node scripts/rules/rule-19-stock-validation.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const SRC = resolve(ROOT, "src");
const errors = [];
const warnings = [];

// Helper to read a file
function readFile(filePath) {
  try {
    return readFileSync(resolve(SRC, filePath), "utf-8");
  } catch {
    return null;
  }
}

// ─── Check 1: all invalidateQueries have refetchType: 'all' ───
const dbFiles = [
  "hooks/useDatabase/entries.ts",
  "hooks/useDatabase/accounts.ts",
  "hooks/useDatabase/sales.ts",
  "hooks/useDatabase/programs.ts",
  "hooks/useDatabase/origemTypes.ts",
  "hooks/useDatabase/owners.ts",
  "hooks/useDatabase/clients.ts",
  "hooks/useDatabase/shared.ts",
  "contexts/DataContext.tsx",
];

console.log("\n─── Regra #19.1: invalidateQueries com refetchType ───\n");

for (const file of dbFiles) {
  const content = readFile(file);
  if (!content) {
    warn(`  ⚠️  Arquivo não encontrado: ${file}`);
    continue;
  }

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match invalidateQueries(...) calls
    if (line.includes("invalidateQueries(")) {
      // Check if this line has refetchType
      if (!line.includes("refetchType:")) {
        // Check multi-line - look ahead for refetchType in next lines
        let multiLine = line;
        let j = i + 1;
        while (j < lines.length && !multiLine.includes(")") && j < i + 5) {
          multiLine += lines[j];
          j++;
        }
        if (!multiLine.includes("refetchType:")) {
          errors.push(`${file}:${i + 1} — invalidateQueries sem refetchType`);
        }
      } else if (line.includes("refetchType: 'active'")) {
        errors.push(`${file}:${i + 1} — refetchType: 'active' explícito, use 'all'`);
      }
    }
  }
}

if (errors.length > 0) {
  console.log(`  ${errors.length} erro(s) encontrado(s)`);
} else {
  console.log("  ✅ Todas as chamadas têm refetchType: 'all'");
}

// ─── Check 2: mutations that affect balance invalidate accounts query ───
console.log("\n─── Regra #19.2: Mutações de saldo invalidam accounts ───\n");

const balanceFiles = [
  "hooks/useDatabase/entries.ts",
  "hooks/useDatabase/sales.ts",
];

const balanceErrors = [];
for (const file of balanceFiles) {
  const content = readFile(file);
  if (!content) continue;

  // Find all onSuccess handlers
  const onSuccessMatches = content.matchAll(/onSuccess:\s*\([^)]*\)\s*=>\s*\{([^}]*)\}/g);
  let foundMutation = false;
  for (const match of content.matchAll(/(?:export function use\w+Mutation)/g)) {
    foundMutation = true;
  }

  if (!foundMutation) continue;

  // Check that at least one invalidateQueries targets accounts
  if (!content.includes('invalidateQueries({ queryKey: ["accounts"]')) {
    balanceErrors.push(`${file} — mutação que afeta saldo sem invalidateQueries(['accounts'])`);
  }
}

if (balanceErrors.length > 0) {
  balanceErrors.forEach((e) => errors.push(e));
  console.log(`  ${balanceErrors.length} erro(s) encontrado(s)`);
} else {
  console.log("  ✅ Todas as mutações de saldo invalidam accounts");
}

// ─── Check 3: calcAccountUpdate used correctly ───
console.log("\n─── Regra #19.3: calcAccountUpdate nas mutações de saldo ───\n");

const calcfiles = [
  "hooks/useDatabase/entries.ts",
  "hooks/useDatabase/sales.ts",
];

for (const file of calcfiles) {
  const content = readFile(file);
  if (!content) continue;

  const hasCalcAccountUpdate = content.includes("calcAccountUpdate(");
  const hasAccountUpdate = content.includes("supabase.from(\"accounts\").update(");

  if (hasAccountUpdate && !hasCalcAccountUpdate) {
    errors.push(`${file} — atualiza accounts sem usar calcAccountUpdate`);
  }
}

// Check 3b: toda mutation exportada (que afeta saldo) DEVE chamar calcAccountUpdate
console.log("\n─── Regra #19.3b: toda mutation de saldo usa calcAccountUpdate ───\n");

const expectedCalls = {
  "hooks/useDatabase/entries.ts": ["useAddEntryMutation", "useUpdateEntryMutation", "useDeleteEntryMutation", "useConfirmEntryMutation"],
  "hooks/useDatabase/sales.ts": ["useAddSaleMutation", "useUpdateSaleMutation", "useCancelSaleMutation", "useDeleteSaleMutation"],
};

for (const [file, muts] of Object.entries(expectedCalls)) {
  const content = readFile(file);
  if (!content) continue;

  // Split by "\nexport function " to get each mutation block
  const blocks = content.split(/\nexport function /);

  for (const mut of muts) {
    const block = blocks.find(b => b.startsWith(mut + "("));
    if (!block) continue; // mutation not found, skip

    const usesCalc = block.includes("calcAccountUpdate(");
    const updatesAccounts = block.includes('supabase.from("accounts").update(');

    if (updatesAccounts && !usesCalc) {
      errors.push(`${file} — ${mut} atualiza accounts sem calcAccountUpdate`);
    }
  }
}

if (calcfiles.every((f) => {
  const c = readFile(f);
  return c && c.includes("calcAccountUpdate(");
})) {
  console.log("  ✅ calcAccountUpdate usado em todas as mutações de saldo");
} else {
  console.log(`  ${errors.filter(e => e.includes("calcAccountUpdate")).length} erro(s)`);
}

// ─── Summary ───
console.log("\n─── Resumo ───\n");

if (errors.length > 0) {
  for (const e of errors) {
    err(`  ❌ ${e}`);
  }
  console.log(`\n  ${errors.length} erro(s) (regra #19)`);
  process.exit(1);
}

ok(`estoque validation: ${dbFiles.length} arquivos verificados, sem erros (regra #19)`);
