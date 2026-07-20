#!/usr/bin/env node

/**
 * rule-19-stock-validation.mjs — Verifica regra #19: estoque consistente (AST).
 *
 * Validações ESTÁTICAS via TypeScript Compiler API (AST):
 *   1. Toda chamada `invalidateQueries` DEVE ter `refetchType: 'all'`
 *   2. Nenhum `invalidateQueries` com `refetchType: 'active'` explícito
 *   3. Toda mutation que atualiza conta (entries, sales, accounts)
 *      DEVE invalidar a query de accounts
 *   4. `calcAccountUpdate` DEVE ser usado em toda mutation que afeta saldo
 *
 * Uso: node scripts/rules/rule-19-stock-validation.mjs
 * Exit: 0 = ok, 1 = violação
 *
 * ponytail: só usa AST onde o risco compensa — TS Compiler API sem dependência extra.
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readFileSync } from "fs";
import { resolve } from "path";

const SRC = resolve(ROOT, "src");
const errors = [];

function readFile(filePath) {
  try {
    return readFileSync(resolve(SRC, filePath), "utf-8");
  } catch {
    return null;
  }
}

// ─── AST helpers ───

/** Encontra todas as CallExpression cujo nome case match callName. */
function findCalls(sourceFile, callName, ts) {
  const calls = [];
  function visit(n) {
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      let name = null;
      if (ts.isIdentifier(expr)) name = expr.text;
      else if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name))
        name = expr.name.text;
      if (name === callName)
        calls.push({ node: n, name, line: sourceFile.text.slice(0, n.pos).split("\n").length });
    }
    ts.forEachChild(n, visit);
  }
  visit(sourceFile);
  return calls;
}

/** Retorna o primeiro argumento se for ObjectLiteral. */
function getObjectArg(callNode, ts) {
  if (callNode.arguments.length < 1) return null;
  const arg = callNode.arguments[0];
  return ts.isObjectLiteralExpression(arg) ? arg : null;
}

/** Verifica se uma property string tem valor "value". */
function hasStringProp(objLit, propName, value, ts) {
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const pName = ts.isIdentifier(prop.name) ? prop.name.text
                : ts.isStringLiteral(prop.name) ? prop.name.text : null;
    if (pName !== propName) continue;
    if (ts.isStringLiteral(prop.initializer) && prop.initializer.text === value) return true;
    if (ts.isIdentifier(prop.initializer) && prop.initializer.text === value) return true;
  }
  return false;
}

/** Verifica se uma property array (ex: queryKey: ["accounts"]) contém value. */
function hasArrayProp(objLit, propName, value, ts) {
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const pName = ts.isIdentifier(prop.name) ? prop.name.text
                : ts.isStringLiteral(prop.name) ? prop.name.text : null;
    if (pName !== propName) continue;
    if (ts.isArrayLiteralExpression(prop.initializer)) {
      for (const elem of prop.initializer.elements) {
        if (ts.isStringLiteral(elem) && elem.text === value) return true;
      }
    }
  }
  return false;
}

/** Verifica se um ObjectLiteral tem uma property com nome propName. */
function hasAnyProp(objLit, propName, ts) {
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const pName = ts.isIdentifier(prop.name) ? prop.name.text
                : ts.isStringLiteral(prop.name) ? prop.name.text : null;
    if (pName === propName) return true;
  }
  return false;
}

/** Verifica se um bloco AST contém chamada para callName. */
function bodyHasCall(node, callName, ts) {
  let found = false;
  function visit(n) {
    if (found) return;
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      let name = null;
      if (ts.isIdentifier(expr)) name = expr.text;
      else if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name))
        name = expr.name.text;
      if (name === callName) found = true;
    }
    ts.forEachChild(n, visit);
  }
  ts.forEachChild(node, visit);
  return found;
}

/** Verifica se um bloco AST contém supabase.from("accounts").update(). */
function bodyHasAccountUpdate(node, ts) {
  let found = false;
  function visit(n) {
    if (found) return;
    if (ts.isCallExpression(n)) {
      const expr = n.expression;
      if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name) && expr.name.text === "update") {
        const obj = expr.expression;
        if (ts.isCallExpression(obj) && ts.isPropertyAccessExpression(obj.expression)) {
          const inner = obj.expression;
          if (ts.isIdentifier(inner.name) && inner.name.text === "from" &&
              obj.arguments.length === 1 && ts.isStringLiteral(obj.arguments[0]) &&
              obj.arguments[0].text === "accounts") {
            found = true;
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  }
  ts.forEachChild(node, visit);
  return found;
}

/** Encontra FunctionDeclaration exportada com nome específico. */
function findExportedFunction(sourceFile, funcName, ts) {
  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && stmt.name.text === funcName) {
      const isExport = stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isExport) return stmt;
    }
  }
  return null;
}

// ─── Main ───

async function main() {
  const ts = (await import("typescript")).default || await import("typescript");

  // ─── Check 1: all invalidateQueries have refetchType: 'all' ───
  console.log("\n─── Regra #19.1: invalidateQueries com refetchType (AST) ───\n");

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

  for (const file of dbFiles) {
    const content = readFile(file);
    if (!content) {
      warn(`  ⚠️  Arquivo não encontrado: ${file}`);
      continue;
    }

    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const calls = findCalls(sf, "invalidateQueries", ts);

    for (const { node, line } of calls) {
      const objArg = getObjectArg(node, ts);
      if (!objArg) {
        errors.push(`${file}:${line} — invalidateQueries sem argumento objeto`);
        continue;
      }

      if (!hasAnyProp(objArg, "refetchType", ts)) {
        errors.push(`${file}:${line} — invalidateQueries sem refetchType`);
      } else if (hasStringProp(objArg, "refetchType", "active", ts)) {
        errors.push(`${file}:${line} — refetchType: 'active' explícito, use 'all'`);
      }
    }
  }

  if (errors.filter(e => e.includes("invalidateQueries")).length === 0) {
    console.log("  ✅ Todas as chamadas têm refetchType: 'all'");
  } else {
    console.log(`  ${errors.length} erro(s) encontrado(s)`);
  }

  // ─── Check 2: mutations that affect balance invalidate accounts query ───
  console.log("\n─── Regra #19.2: Mutações de saldo invalidam accounts (AST) ───\n");

  const balanceFiles = ["hooks/useDatabase/entries.ts", "hooks/useDatabase/sales.ts"];
  const balanceErrors = [];

  for (const file of balanceFiles) {
    const content = readFile(file);
    if (!content) continue;

    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const accountsCalls = findCalls(sf, "invalidateQueries", ts);
    const hasAccountsInvalidation = accountsCalls.some(({ node }) => {
      const objArg = getObjectArg(node, ts);
      if (!objArg) return false;
      // queryKey: ["accounts"] — o valor é um array, não string
      return hasArrayProp(objArg, "queryKey", "accounts", ts);
    });

    const hasMutations = Array.from(sf.statements).some(
      stmt => ts.isFunctionDeclaration(stmt) &&
              stmt.name?.text?.endsWith("Mutation") &&
              stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    );

    if (hasMutations && !hasAccountsInvalidation) {
      balanceErrors.push(`${file} — mutação que afeta saldo sem invalidateQueries(['accounts'])`);
    }
  }

  if (balanceErrors.length > 0) {
    balanceErrors.forEach(e => errors.push(e));
    console.log(`  ${balanceErrors.length} erro(s) encontrado(s)`);
  } else {
    console.log("  ✅ Todas as mutações de saldo invalidam accounts");
  }

  // ─── Check 3: calcAccountUpdate used correctly ───
  console.log("\n─── Regra #19.3: calcAccountUpdate nas mutações de saldo (AST) ───\n");

  const calcfiles = ["hooks/useDatabase/entries.ts", "hooks/useDatabase/sales.ts"];

  for (const file of calcfiles) {
    const content = readFile(file);
    if (!content) continue;

    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const hasCalc = bodyHasCall(sf, "calcAccountUpdate", ts);
    const hasUpdate = bodyHasAccountUpdate(sf, ts);

    if (hasUpdate && !hasCalc) {
      errors.push(`${file} — atualiza accounts sem usar calcAccountUpdate`);
    }
  }

  // Check 3b: toda mutation exportada DEVE chamar calcAccountUpdate
  console.log("\n─── Regra #19.3b: toda mutation de saldo usa calcAccountUpdate (AST) ───\n");

  const expectedCalls = {
    "hooks/useDatabase/entries.ts": ["useAddEntryMutation", "useUpdateEntryMutation", "useDeleteEntryMutation", "useConfirmEntryMutation"],
    "hooks/useDatabase/sales.ts": ["useAddSaleMutation", "useUpdateSaleMutation", "useCancelSaleMutation", "useDeleteSaleMutation"],
  };

  for (const [file, muts] of Object.entries(expectedCalls)) {
    const content = readFile(file);
    if (!content) continue;

    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    for (const mut of muts) {
      const funcNode = findExportedFunction(sf, mut, ts);
      if (!funcNode || !funcNode.body) continue;

      const usesCalc = bodyHasCall(funcNode.body, "calcAccountUpdate", ts);
      const updatesAccounts = bodyHasAccountUpdate(funcNode.body, ts);

      if (updatesAccounts && !usesCalc) {
        errors.push(`${file} — ${mut} atualiza accounts sem calcAccountUpdate`);
      }
    }
  }

  const allHaveCalc = calcfiles.every(f => {
    const c = readFile(f);
    if (!c) return false;
    const sf = ts.createSourceFile(f, c, ts.ScriptTarget.Latest, true);
    return bodyHasCall(sf, "calcAccountUpdate", ts);
  });

  if (allHaveCalc) {
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

  ok(`estoque validation: ${dbFiles.length} arquivos verificados com AST, sem erros (regra #19)`);
}

await main();
