#!/usr/bin/env node

/**
 * verify-docs.mjs — Varredura automatizada de documentação.
 *
 * Verifica:
 *   1. Links internos quebrados (arquivos .md referenciados que não existem)
 *   2. Órfãos (arquivos .md que ninguém referencia)
 *   3. Promessas quebradas (UI diz X, código pode não cumprir)
 *   4. Referências a arquivos de código que não existem (.ts/.tsx/.mjs)
 *
 * Uso:
 *   node scripts/verify-docs.mjs             # scan completo
 *   node scripts/verify-docs.mjs --strict    # exit 1 se achar algo
 *   node scripts/verify-docs.mjs --quick     # só links quebrados
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".opencode", ".pi", ".zcode", "test-results", "playwright-report", "dist", "tests"]);
const EXCLUDE_FILES = new Set(["package-lock.json", "package.json"]);
const ORPHAN_ALLOWED_PREFIXES = [
  ".github/ISSUE_TEMPLATE/",
  "docs/council/",
  "docs/superpowers/plans/",
  "docs/superpowers/specs/",
  "docs/thoughts/",
  "scripts/rules/__fixtures__/",
];

// ── Helpers ──────────────────────────────────────────────────────────

function isMd(file) {
  return file.endsWith(".md");
}

/** Recursively list all .md files under a directory, optionally excluding some paths */
function listMdFiles(dir, prefix = "") {
  const result = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) {
        result.push(...listMdFiles(full, join(prefix, e.name)));
      }
    } else if (isMd(e.name)) {
      result.push({ path: full, rel: join(prefix, e.name) });
    }
  }
  return result;
}

/** Extract all internal markdown links `[text](path)` from content */
function extractLinks(content, fileRel) {
  const links = [];
  // [...](path)
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(content)) !== null) {
    const target = m[2].trim();
    // Skip external URLs and anchors-only
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#") || target.startsWith("mailto:")) continue;
    links.push({ text: m[1], target, line: content.slice(0, m.index).split("\n").length });
  }
  // Also detect bare path references:
  //   - backtick-wrapped: `docs/FOO.md`
  //   - table-cell: | docs/FOO.md |
  //   - inline text: veja docs/FOO.md
  const bareRe = /[\s|`](docs\/[\w./-]+\.md)[\s|`]/gm;
  while ((m = bareRe.exec(content)) !== null) {
    links.push({ text: m[1], target: m[1], line: content.slice(0, m.index).split("\n").length });
  }
  return links;
}

// ── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const quick = args.includes("--quick");

const allFiles = listMdFiles(ROOT);
const fileMap = new Map(allFiles.map((f) => [f.rel, f.path]));
const filePaths = new Set(allFiles.map((f) => f.rel));

const issues = [];

// ── 1. Check broken links ──────────────────────────────────────────

console.log("\n🔗 Verificando links internos...\n");

for (const { path: filePath, rel: fileRel } of allFiles) {
  const content = readFileSync(filePath, "utf-8");
  const links = extractLinks(content, fileRel);

  for (const link of links) {
    let target = link.target;

    // Resolve relative links
    if (target.startsWith("./")) {
      const dir = fileRel.split("/").slice(0, -1).join("/");
      target = dir ? `${dir}/${target.slice(2)}` : target.slice(2);
    } else if (!target.startsWith("docs/") && !target.startsWith("/")) {
      // Relative without ./
      const dir = fileRel.split("/").slice(0, -1).join("/");
      target = dir ? `${dir}/${target}` : target;
    }

    // Remove trailing slash, fragment, query
    target = target.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/$/, "");

    // Support for directory-style links (docs/foo → docs/foo.md or docs/foo/README.md)
    if (!filePaths.has(target)) {
      const asMd = target.endsWith(".md") ? target : `${target}.md`;
      if (filePaths.has(asMd)) {
        target = asMd;
      } else if (filePaths.has(`${target}/README.md`)) {
        target = `${target}/README.md`;
      }
    }

    if (!filePaths.has(target)) {
      issues.push({
        type: "broken-link",
        file: fileRel,
        line: link.line,
        target: link.target,
        text: link.text,
      });
    }
  }
}

// ── 2. Find orphans (quick only if not --quick) ─────────────────────

if (!quick) {
  console.log("👻 Verificando órfãos...\n");

  // Build a set of all referenced files
  const referenced = new Set();

  for (const { path: filePath, rel: fileRel } of allFiles) {
    const content = readFileSync(filePath, "utf-8");
    const links = extractLinks(content, fileRel);

    for (const link of links) {
      let target = link.target;
      if (target.startsWith("./")) {
        const dir = fileRel.split("/").slice(0, -1).join("/");
        target = dir ? `${dir}/${target.slice(2)}` : target.slice(2);
      } else if (!target.startsWith("docs/") && !target.startsWith("/")) {
        const dir = fileRel.split("/").slice(0, -1).join("/");
        target = dir ? `${dir}/${target}` : target;
      }
      target = target.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/$/, "");
      const asMd = target.endsWith(".md") ? target : `${target}.md`;
      if (filePaths.has(asMd)) referenced.add(asMd);
    }
  }

  // Also mark MAIN docs as referenced (they're entry points)
  const entryDocs = ["AGENTS.md", "CLAUDE.md", "QUALITY.md", "docs/handoff.md", "docs/memory.md", "README.md", "CHANGELOG.md", "docs/AGENDA.md", "docs/WORKFLOW.md", "docs/ARCHITECTURE.md", "docs/CONVENTIONS.md", "docs/MAP.md", "docs/STACK.md", "docs/GIT-WORKFLOW.md", "docs/UI-GUIDE.md", "docs/TESTING.md", "docs/TEST-PLAN.md", "docs/MAPA-EXPERIENCIAS-USUARIO.md"]; 
  for (const d of entryDocs) {
    if (filePaths.has(d)) referenced.add(d);
  }

  for (const { rel } of allFiles) {
    if (!referenced.has(rel) && !rel.startsWith("docs/archive/") && !ORPHAN_ALLOWED_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
      issues.push({
        type: "orphan",
        file: rel,
        line: 1,
        target: "",
        text: "",
      });
    }
  }
}

// ── 3. Check for broken UI promises (basic pattern) ────────────────

if (!quick) {
  console.log("🔍 Verificando promessas de UI...\n");

  for (const { path: filePath, rel: fileRel } of allFiles) {
    if (!fileRel.startsWith("docs/")) continue;
    const content = readFileSync(filePath, "utf-8");
    // Look for UI promises: phrases like "será preservado", "será exibido"
    const promiseRe = /("[^"]*"|'[^']*')\s*(será|serão|vai|vão)\s*(\w+)/gi;
    let m;
    while ((m = promiseRe.exec(content)) !== null) {
      const lineNum = content.slice(0, m.index).split("\n").length;
      issues.push({
        type: "ui-promise",
        file: fileRel,
        line: lineNum,
        target: "",
        text: m[0].trim().slice(0, 80),
      });
    }
  }
}

// ── 4. Check code file references ────────────────────────────────────

if (!quick) {
  console.log("📁 Verificando referências a arquivos de código...\n");

  /** Extract backtick-wrapped paths that look like source files */
  const codeFileRe = /`([^`]+(?:\.[jt]sx?|\.mjs))`/g;

  for (const { path: filePath, rel: fileRel } of allFiles) {
    const content = readFileSync(filePath, "utf-8");
    let m;
    while ((m = codeFileRe.exec(content)) !== null) {
      const ref = m[1];
      // Skip URLs, node_modules, glob patterns, archive/
      if (ref.startsWith("http") || ref.startsWith("node_modules/")) continue;
      if (ref.includes("*") || ref.includes("?")) continue; // glob pattern
      if (fileRel.startsWith("docs/archive/")) continue; // historical docs

      // Try to resolve the path
      let fullPath;
      if (ref.startsWith("/")) {
        // Absolute path from repo root
        fullPath = join(ROOT, ref);
      } else if (ref.startsWith("./")) {
        // Relative to the doc file
        const dir = fileRel.split("/").slice(0, -1).join("/");
        fullPath = resolve(ROOT, dir, ref);
      } else if (ref.startsWith("src/") || ref.startsWith("scripts/") || ref.startsWith("tests/") || ref.startsWith("docs/")) {
        // Path from repo root
        fullPath = join(ROOT, ref);
      } else {
        // Could be a bare filename or ambiguous — skip
        continue;
      }

      if (!existsSync(fullPath)) {
        const lineNum = content.slice(0, m.index).split("\n").length;
        issues.push({
          type: "broken-code-ref",
          file: fileRel,
          line: lineNum,
          target: ref,
          text: ref,
        });
      }
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════");
console.log("  verify-docs.mjs — Relatório");
console.log("═══════════════════════════════════════════\n");

const byType = {};
for (const iss of issues) {
  byType[iss.type] = (byType[iss.type] || 0) + 1;
}
console.log(`Total arquivos .md: ${allFiles.length}`);
console.log(`Total issues:       ${issues.length}\n`);
console.log("Por tipo:");
for (const [type, count] of Object.entries(byType)) {
  const pad = Math.max(2, 14 - type.length);
  console.log(`  ${" ".repeat(pad)}${type}: ${count}`);
}
console.log("");

if (issues.length === 0) {
  console.log("✅ Nenhum problema encontrado.\n");
} else {
  console.log("❌ Problemas encontrados:\n");
  for (const iss of issues) {
    const loc = `${iss.file}:${iss.line}`;
    switch (iss.type) {
      case "broken-link":
        console.log(`  🔗 ${loc} → link quebrado: "${iss.target}" (texto: "${iss.text}")`);
        break;
      case "orphan":
        console.log(`  👻 ${loc} → órfão (ninguém referencia)`);
        break;
      case "ui-promise":
        console.log(`  💬 ${loc} → possível promessa não verificada: "${iss.text}"`);
        break;
      case "broken-code-ref":
        console.log(`  📁 ${loc} → ref. arquivo inexistente: "${iss.target}"`);
        break;
    }
  }
}

console.log("");

if (strict && issues.length > 0) {
  process.exit(1);
}
