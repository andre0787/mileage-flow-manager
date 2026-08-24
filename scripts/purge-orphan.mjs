#!/usr/bin/env node
/**
 * SDD-01 — verifica que o código removido não deixou referências órfãs.
 *
 * A análise de RLS reproduz a ordem das migrations: uma policy só é avaliada
 * depois que todos os DROP/CREATE posteriores foram aplicados.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { extname, join, relative, resolve } from "path";

const ROOT = resolve(process.env.MOCK_ROOT || join(resolve(import.meta.dirname), ".."));
const SEARCH_DIRS = [resolve(ROOT, "src"), resolve(ROOT, "scripts")];
const MIGRATIONS_DIR = resolve(ROOT, "supabase", "migrations");
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const CHECKER_RELATIVE_PATH = "scripts/purge-orphan.mjs";

const SEARCH_PATTERNS = [
  { pattern: /\bisAdmin\b/gi, label: "isAdmin" },
  { pattern: /\bselectIsAdmin\b/gi, label: "selectIsAdmin" },
  { pattern: /\badmin[- ]role\b/gi, label: "admin-role" },
  { pattern: /\b(?:LLM Router|SkeletonHero)\b/gi, label: "LLM Router/SkeletonHero" },
];

const findings = [];

function displayPath(filePath) {
  return relative(ROOT, filePath).split("\\").join("/");
}

function addFinding(filePath, reason) {
  findings.push({ file: displayPath(filePath), reason });
}

function sourceFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  const files = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(fullPath));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

function checkOrphanReferences() {
  for (const filePath of SEARCH_DIRS.flatMap(sourceFiles).sort()) {
    // Relative matching also excludes a fixture copy when MOCK_ROOT is used;
    // no other source file is exempted.
    if (displayPath(filePath) === CHECKER_RELATIVE_PATH) continue;
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    for (const { pattern, label } of SEARCH_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) addFinding(filePath, `referência a ${label}`);
    }
  }
}

function checkPackageDependencies() {
  const packagePath = resolve(ROOT, "package.json");
  if (!existsSync(packagePath)) return;
  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    addFinding(packagePath, "package.json inválido");
    return;
  }

  const dependencySections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const dependencies = dependencySections.reduce(
    (all, section) => ({ ...all, ...(packageJson[section] || {}) }),
    {},
  );
  const forbidden = Object.keys(dependencies)
    .filter(
      (name) =>
        /llm/i.test(name) ||
        (/router/i.test(name) && !/^(@types\/)?react-router(?:-dom)?$/i.test(name)),
    )
    .sort();

  for (const name of forbidden) addFinding(packagePath, `dependência LLM/router: ${name}`);
}

function withoutSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*--.*$/gm, "");
}

function userScopedTables(sql, filePath, tableFiles) {
  const tables = new Set();
  const tablePattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][\w]*)\s*\(([\s\S]*?)\)\s*;/gi;
  for (const match of sql.matchAll(tablePattern)) {
    // Nullable user_id rows can represent system records; only tables whose
    // ownership column is mandatory are checked by the owner-only contract.
    if (/\buser_id\b[^,\n]*\bnot\s+null\b/i.test(match[2])) {
      const table = match[1].toLowerCase();
      tables.add(table);
      tableFiles.set(table, filePath);
    }
  }
  return tables;
}

function policyStatements(sql) {
  const statementPattern = /\b(?:create|drop)\s+policy\b[\s\S]*?;/gi;
  return [...sql.matchAll(statementPattern)].map((match) => match[0]);
}

function policyIdentity(statement) {
  const match = statement.match(
    /^(?:create|drop)\s+policy\s+(?:if\s+exists\s+)?(?:"([^"]+)"|([a-z_][\w$]*))\s+on\s+(?:public\.)?([a-z_][\w$]*)/i,
  );
  if (!match) return null;
  return { name: (match[1] || match[2]).toLowerCase(), table: match[3].toLowerCase() };
}

function applyMigrationPolicies(migrations, scopedTables) {
  const policies = new Map();
  for (const [filePath, sql] of migrations) {
    for (const statement of policyStatements(sql)) {
      const identity = policyIdentity(statement);
      if (!identity || !scopedTables.has(identity.table)) continue;
      let tablePolicies = policies.get(identity.table);
      if (!tablePolicies) {
        tablePolicies = new Map();
        policies.set(identity.table, tablePolicies);
      }
      if (/^drop\s+policy\b/i.test(statement)) tablePolicies.delete(identity.name);
      else tablePolicies.set(identity.name, { filePath, statement });
    }
  }
  return policies;
}

function hasOwnerCheck(statement) {
  return /auth\s*\.\s*uid\s*\(\s*\)\s*=\s*user_id/i.test(statement) ||
    /user_id\s*=\s*auth\s*\.\s*uid\s*\(\s*\)/i.test(statement);
}

function checkEffectiveRls(migrations, scopedTables, tableFiles) {
  const policies = applyMigrationPolicies(migrations, scopedTables);
  for (const table of scopedTables) {
    const tablePolicies = policies.get(table);
    if (!tablePolicies || tablePolicies.size === 0) {
      addFinding(tableFiles.get(table), `RLS efetiva de ${table} sem policy`);
      continue;
    }
    for (const { filePath, statement } of tablePolicies.values()) {
      const hasAdminBypass = /\b(?:public\s*\.\s*)?is_admin\s*\(|\badmin\s+(?:role|access|bypass)\b/i.test(statement);
      const hasAlternative = /\bor\b/i.test(statement);
      if (!hasOwnerCheck(statement) || hasAdminBypass || hasAlternative) {
        const reasons = [];
        if (!hasOwnerCheck(statement)) reasons.push("ausência de auth.uid() = user_id");
        if (hasAdminBypass) reasons.push("bypass admin");
        if (hasAlternative) reasons.push("condição alternativa");
        addFinding(filePath, `RLS efetiva de ${table} não é estrita (${reasons.join(", ")})`);
      }
    }
  }
}

function checkMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return;
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => join(MIGRATIONS_DIR, name));
  const scopedTables = new Set();
  const tableFiles = new Map();
  const migrations = migrationFiles.map((filePath) => {
    const sql = withoutSqlComments(readFileSync(filePath, "utf8"));
    for (const table of userScopedTables(sql, filePath, tableFiles)) scopedTables.add(table);
    return [filePath, sql];
  });
  checkEffectiveRls(migrations, scopedTables, tableFiles);
}

function main() {
  checkOrphanReferences();
  checkPackageDependencies();
  checkMigrations();

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.reason.localeCompare(b.reason));
  console.log("🔍 SDD-01: buscando vestígios órfãos, dependências e RLS efetiva...\n");
  if (findings.length > 0) {
    for (const finding of findings) console.error(`❌ ${finding.file} — ${finding.reason}`);
    console.error(`\n❌ Falha: ${findings.length} problema(s) encontrado(s).`);
    process.exitCode = 1;
    return;
  }
  console.log("✅ SDD-01: nenhum vestígio órfão ou RLS insegura encontrado.");
}

main();
