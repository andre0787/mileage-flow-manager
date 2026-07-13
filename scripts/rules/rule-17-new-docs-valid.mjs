#!/usr/bin/env node

/**
 * rule-17-new-docs-valid.mjs — Valida novos arquivos .md contra orphan/devirando-issue.
 *
 * Para cada novo .md no diff (vs origin/main), verifica:
 *   1. Se em docs/ (fora archive/ e reports/): precisa estar no MAP.md
 *   2. Se em qualquer lugar: precisa ser referenciado por >=1 outro .md
 *   3. Links internos dentro do arquivo apontam pra arquivos que existem
 *
 * Ignora: node_modules/, docs/reports/, docs/archive/, .opencode/, .pi/
 *
 * Uso:
 *   node scripts/rules/rule-17-new-docs-valid.mjs
 *
 * ponytail: execSync puro, zero deps. Só checa novos arquivos.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
let errors = 0;
const BASE = "origin/main";

function linkRefs(filePath, allMds) {
  const name = filePath.split("/").pop();
  return allMds.filter(f => f !== filePath).filter(f => {
    try {
      const content = readFileSync(resolve(ROOT, f), "utf8");
      return content.includes(name);
    } catch { return false; }
  }).length;
}

function internalLinks(path) {
  const content = readFileSync(path, "utf8");
  const links = [...content.matchAll(/]\(([^)]+\.md)\)/g)].map(m => m[1]);
  return links.filter(l => !l.startsWith("http") && !l.startsWith("#"));
}

try {
  // ── Descobrir novos .md no diff ─────────────────────────────────
  const diffCmd = `git diff --name-only --diff-filter=A ${BASE}...HEAD 2>/dev/null || echo ""`;
  const changed = execSync(diffCmd, { cwd: ROOT, encoding: "utf8", timeout: 5000 })
    .trim().split("\n").filter(Boolean);

  const newMds = changed.filter(f =>
    f.endsWith(".md") &&
    !f.startsWith("node_modules/") &&
    !f.startsWith("docs/reports/") &&
    !f.startsWith("docs/archive/") &&
    !f.startsWith(".opencode/") &&
    !f.startsWith(".pi/")
  );

  if (newMds.length === 0) {
    console.log("  ✅ nenhum novo .md para validar");
    process.exit(0);
  }

  // ── Lista de todos os .md (pra checar referências) ─────────────
  const allMd = execSync(
    `find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./docs/reports/*"`,
    { cwd: ROOT, encoding: "utf8", timeout: 5000 }
  ).trim().split("\n").filter(Boolean).map(f => f.replace(/^\.\//, ""));

  console.log(`  📄 ${newMds.length} novo(s) .md detectado(s):`);

  // ── Validar cada novo .md ──────────────────────────────────────
  for (const file of newMds) {
    const absPath = resolve(ROOT, file);
    let fileOk = true;
    console.log(`    ${file}`);

    // Check 1: está no MAP.md? (se for doc ativo em docs/)
    if (file.startsWith("docs/") && !file.startsWith("docs/thoughts/") && !file.startsWith("docs/council/")) {
      const mapContent = readFileSync(resolve(ROOT, "docs/MAP.md"), "utf8");
      const fileName = file.split("/").pop();
      if (!mapContent.includes(fileName)) {
        console.log(`      ⚠️  não encontrado em docs/MAP.md`);
        errors++;
      }
    }

    // Check 2: é referenciado por >=1 outro .md?
    const refCount = linkRefs(file, allMd);
    if (refCount === 0) {
      console.log(`      ⚠️  órfão — nenhum outro .md o referencia`);
      errors++;
    }

    // Check 3: links internos existem?
    const links = internalLinks(absPath);
    for (const link of links) {
      const target = link.startsWith("/") ? link.slice(1) : resolve(ROOT, file, "..", link);
      if (!existsSync(resolve(ROOT, target)) && !existsSync(resolve(ROOT, target.replace(/^\.\//, "")))) {
        console.log(`      ⚠️  link quebrado: "${link}" → arquivo não existe`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.log(`\n  ❌ ${errors} issue(s) em novos .md`);
    process.exit(1);
  } else {
    console.log(`  ✅ todos os novos .md válidos`);
  }

} catch (e) {
  // Se não tem base pra comparar (ex: primeira branch), skip
  if (e.message?.includes("bad revision")) {
    console.log("  ⏭️  sem base pra comparar (primeira branch?), pulando");
    process.exit(0);
  }
  console.error(`  ❌ erro: ${e.message.slice(0, 200)}`);
  process.exit(1);
}
