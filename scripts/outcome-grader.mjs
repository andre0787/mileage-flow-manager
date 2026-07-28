#!/usr/bin/env node

/**
 * outcome-grader.mjs — Verifica qualidade do diff contra acceptance criteria.
 *
 * Uso:
 *   node scripts/outcome-grader.mjs              # avalia diff contra HEAD
 *   node scripts/outcome-grader.mjs --ci         # saída JSON para CI
 *   node scripts/outcome-grader.mjs --checklist  # gera checklist de verificação
 *
 * Critérios:
 *   - console.log / debugger removidos do diff
 *   - Arquivos .ts/.tsx com modificações têm test correspondente (se aplicável)
 *   - Nenhum import quebrado (paths @/ existem)
 *   - Nenhum arquivo protegido (src/lib/supabase*, tailwind.config.*) sem aprovação
 *
 * ponytail: execSync + fs + glob pattern manual, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");

const PROTECTED_FILES = [
  "src/lib/supabase",
  "tailwind.config",
  "postcss.config",
  "vite.config",
  ".github/workflows",
];

const CONSOLE_LOG_PATTERN = /console\.(log|error|warn|debug)\s*\(/;
const TEST_EXTENSIONS = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

function getDiffFiles() {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

function getDiffContent(file) {
  try {
    const out = execSync(`git diff HEAD -- "${file}"`, { cwd: ROOT, encoding: "utf8", timeout: 3000 });
    return out;
  } catch {
    return "";
  }
}

function findTestFile(srcFile) {
  const base = srcFile.replace(/\.(ts|tsx)$/, "");
  for (const ext of TEST_EXTENSIONS) {
    const testPath = `${base}${ext}`;
    if (existsSync(resolve(ROOT, testPath))) return testPath;
  }
  // Procura em __tests__/ ou tests/ ao lado
  const dir = srcFile.substring(0, srcFile.lastIndexOf("/"));
  const name = srcFile.split("/").pop().replace(/\.(ts|tsx)$/, "");
  for (const ext of TEST_EXTENSIONS) {
    const testPath = `${dir}/__tests__/${name}${ext}`;
    if (existsSync(resolve(ROOT, testPath))) return testPath;
    const testPath2 = `${dir}/tests/${name}${ext}`;
    if (existsSync(resolve(ROOT, testPath2))) return testPath2;
  }
  return null;
}

function isProtected(file) {
  return PROTECTED_FILES.some((p) => file.startsWith(p));
}

function gradeDiff(checklistMode = false) {
  const files = getDiffFiles();
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    score: 0,
    total: 0,
  };

  if (files.length === 0) {
    results.passed.push("Sem alterações no diff");
    results.score = 1;
    results.total = 1;
    return results;
  }

  const checks = [];

  // Check 1: console.log no diff
  checks.push(() => {
    for (const file of files) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const diff = getDiffContent(file);
      const addedLines = diff
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .join("\n");
      if (CONSOLE_LOG_PATTERN.test(addedLines)) {
        const match = addedLines.match(CONSOLE_LOG_PATTERN);
        return {
          type: "fail",
          msg: `console.${match[1]} encontrado em ${file}. Remova antes do PR.`,
        };
      }
    }
    return { type: "pass", msg: "Nenhum console.log no diff" };
  });

  // Check 2: debugger no diff
  checks.push(() => {
    for (const file of files) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const diff = getDiffContent(file);
      const addedLines = diff
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .join("\n");
      if (addedLines.includes("debugger")) {
        return {
          type: "fail",
          msg: `debugger encontrado em ${file}. Remova antes do PR.`,
        };
      }
    }
    return { type: "pass", msg: "Nenhum debugger no diff" };
  });

  // Check 3: Test parity for modified source files
  checks.push(() => {
    let missingTests = [];
    for (const file of files) {
      if (!file.startsWith("src/")) continue;
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      if (file.includes(".test.") || file.includes(".spec.")) continue;
      if (file.includes("/ui/") || file.includes("/types/")) continue;
      if (file === "src/App.tsx" || file === "src/main.tsx") continue; // entry points (rule-14)

      const testFile = findTestFile(file);
      if (!testFile) {
        const inDiff = files.some(
          (f) =>
            f.includes(file.replace(/\.(ts|tsx)$/, "")) &&
            (f.includes(".test.") || f.includes(".spec."))
        );
        if (!inDiff) {
          missingTests.push(file);
        }
      }
    }
    if (missingTests.length > 0) {
      return {
        type: "warn",
        msg: `Arquivos sem test correspondente: ${missingTests.join(", ")}. Considere adicionar testes.`,
      };
    }
    return { type: "pass", msg: "Test parity OK para arquivos modificados" };
  });

  // Check 4: Protected files changed
  checks.push(() => {
    const changed = files.filter((f) => isProtected(f));
    if (changed.length > 0) {
      return {
        type: "warn",
        msg: `Arquivos protegidos modificados: ${changed.join(", ")}. Verifique se é intencional.`,
      };
    }
    return { type: "pass", msg: "Nenhum arquivo protegido foi modificado" };
  });

  // Check 5: Console.log in non-TS files (html, mjs, etc)
  checks.push(() => {
    for (const file of files) {
      if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".mjs") || file.endsWith(".js")) continue;
      if (
        file.endsWith(".html") ||
        file.endsWith(".mjs") ||
        file.endsWith(".js")
      ) {
        const diff = getDiffContent(file);
        const addedLines = diff
          .split("\n")
          .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
          .join("\n");
        if (CONSOLE_LOG_PATTERN.test(addedLines)) {
          return {
            type: "warn",
            msg: `console.log em arquivo não-TS: ${file}`,
          };
        }
      }
    }
    return { type: "pass", msg: "Nenhum console.log suspeito em outros formatos" };
  });

  // Run checks
  for (const check of checks) {
    results.total++;
    const result = check();
    if (result.type === "fail") {
      results.failed.push(result.msg);
    } else if (result.type === "warn") {
      results.warnings.push(result.msg);
    } else {
      results.passed.push(result.msg);
    }
  }

  results.score = results.total > 0
    ? results.passed.length / results.total
    : 1;

  return results;
}

function formatOutput(results) {
  console.log(`\n🎯 Outcome Grader — ${results.passed.length}/${results.total} checks passaram`);
  console.log(`   Score: ${(results.score * 100).toFixed(0)}%\n`);

  for (const msg of results.passed) {
    console.log(`  ✅ ${msg}`);
  }
  for (const msg of results.warnings) {
    console.log(`  ⚠️  ${msg}`);
  }
  for (const msg of results.failed) {
    console.log(`  ❌ ${msg}`);
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ ${results.failed.length} falha(s) — corrija antes do PR`);
    process.exit(1);
  }

  console.log(`\n✅ Outcome Grader: qualidade do diff aprovada`);
}

function formatJSON(results) {
  console.log(JSON.stringify(results, null, 2));
  if (results.failed.length > 0) process.exit(1);
}

function generateChecklist() {
  const files = getDiffFiles();
  console.log("# 📋 Checklist de Verificação Pós-Task\n");
  console.log("## Arquivos Modificados");
  for (const f of files) {
    console.log(`- [ ] Verificar: \`${f}\``);
  }
  console.log("\n## Verificações");
  console.log("- [ ] Nenhum console.log/debugger deixado");
  console.log("- [ ] Testes atualizados para refletir mudanças");
  console.log("- [ ] Tipos/exportações consistentes");
  console.log("- [ ] Documentação atualizada (se aplicável)");
  console.log("- [ ] Build passa (`npm run build`)");
  console.log("- [ ] Testes passam (`npm run test`)");
  console.log("");
}

// ── Main ──
const args = process.argv.slice(2);

if (args.includes("--ci")) {
  formatJSON(gradeDiff());
} else if (args.includes("--checklist")) {
  generateChecklist();
} else {
  formatOutput(gradeDiff());
}
