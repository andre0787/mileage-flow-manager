#!/usr/bin/env node

/**
 * rule-14-orphan-files.mjs — Verifica regra #14: sem arquivos órfãos em src/.
 *
 * Um arquivo é "órfão" se NENHUM outro arquivo o importa:
 *   - Não aparece em nenhum import com alias @/...
 *   - Não aparece em nenhum import relativo (./ ../)
 *   - Não é um entry point conhecido
 *
 * Uso: node scripts/rules/rule-14-orphan-files.mjs
 * Exit: 0 = ok, 1 = violação
 */

import { ok, err, warn, ROOT } from "../lib.mjs";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve, relative, extname } from "path";

const SRC = resolve(ROOT, "src");

/** Recursively list all .ts/.tsx files in src/ */
function listSourceFiles(dir, prefix = "") {
  const result = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...listSourceFiles(full, join(prefix, e.name)));
    } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
      result.push({ path: full, rel: join(prefix, e.name) });
    }
  }
  return result;
}

/** Collect all import/require paths from a file content */
function collectImports(content) {
  const imports = new Set();
  // import ... from "..." / export ... from "..."
  const fromRe = /(?:from|export\s+(?:\*\s+from|\{[^}]*\}\s+from|type\s+\{[^}]*\}\s+from))\s+["']([^"']+)["']/g;
  let m;
  while ((m = fromRe.exec(content)) !== null) imports.add(m[1]);
  // dynamic import("...")
  const dynRe = /import\(["']([^"']+)["']\)/g;
  while ((m = dynRe.exec(content)) !== null) imports.add(m[1]);
  // require("...")
  const reqRe = /require\(["']([^"']+)["']\)/g;
  while ((m = reqRe.exec(content)) !== null) imports.add(m[1]);
  return imports;
}

/**
 * Check whether a given file (by its rel path from src/) is referenced
 * by an import statement in another file.
 */
function isFileReferenced(rel, aliasPath, importIndex) {
  // Check every file that imports things
  for (const [importerRel, imports] of importIndex) {
    if (importerRel === rel) continue; // skip self

    for (const imp of imports) {
      // ── 1. Check @/ alias import ──
      if (imp === aliasPath) return true;
      // Check @/hooks/useDatabase/foo → references src/hooks/useDatabase/foo.ts
      if (imp.startsWith(aliasPath + "/") || imp.startsWith(aliasPath + "'") || imp.startsWith(aliasPath + '"')) return true;

      // ── 2. Check barrel alias (e.g. @/hooks/useDatabase → index.ts) ──
      if (rel.endsWith("/index.ts") || rel.endsWith("/index.tsx")) {
        const dirAlias = aliasPath.replace(/\/index$/, "");
        if (imp === dirAlias) return true;
      }

      // ── 3. Check relative import ──
      if (imp.startsWith("./") || imp.startsWith("../")) {
        const dir = importerRel.split("/").slice(0, -1).join("/");
        const resolved = join(ROOT, dir, imp);
        const resolvedBase = resolved.replace(/\.[^.]+$/, ""); // strip ext if present
        const fileBaseNoExt = join(ROOT, rel.replace(/\.[^.]+$/, ""));
        if (resolvedBase === fileBaseNoExt) return true;
        // Also check if it resolves to the barrel index
        if (resolvedBase === fileBaseNoExt.replace(/\/index$/, "")) return true;
      }

      // ── 4. Check direct src/ path reference (rare) ──
      if (imp === `src/${rel}` || imp === `src/${rel.replace(/\.[^.]+$/, "")}`) return true;
    }
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────

const allFiles = listSourceFiles(SRC);

// Build index: for every file, collect what it imports
const importIndex = new Map();
for (const { path, rel } of allFiles) {
  const content = readFileSync(path, "utf-8");
  importIndex.set(rel, collectImports(content));
}

const errors = [];

for (const { rel } of allFiles) {
  // Skip known entry points and type defs
  if (rel === "main.tsx" || rel === "vite-env.d.ts") continue;
  if (rel.endsWith(".d.ts")) continue;

  const aliasPath = "@/" + rel.replace(/\.[^.]+$/, "");
  const referenced = isFileReferenced(rel, aliasPath, importIndex);

  if (!referenced) {
    errors.push(rel);
  }
}

if (errors.length > 0) {
  for (const f of errors.sort()) {
    warn(`Arquivo órfão: src/${f} — ninguém importa`);
  }
  err(`${errors.length} arquivo(s) órfão(s) em src/ (regra #14)`);
  process.exit(1);
}

ok("nenhum arquivo órfão em src/ (regra #14)");
