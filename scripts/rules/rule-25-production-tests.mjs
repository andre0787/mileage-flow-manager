// Rule #25 — Testes Contra Produção
// Verifica se testes E2E que criam/alteram dados podem rodar contra produção
// (usam BASE_URL dinâmico e não dependem de servidor local)

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

let errors = 0;

// 1. Verificar se playwright.config.ts tem BASE_URL dinâmico
const configPath = join(ROOT, "playwright.config.ts");
if (!existsSync(configPath)) {
  console.log("❌ rule-25: playwright.config.ts não encontrado");
  errors++;
} else {
  const content = readFileSync(configPath, "utf-8");
  if (!content.includes("BASE_URL")) {
    console.log("❌ rule-25: playwright.config.ts não tem suporte a BASE_URL");
    errors++;
  } else if (!content.includes("process.env.BASE_URL")) {
    console.log("❌ rule-25: playwright.config.ts não lê process.env.BASE_URL");
    errors++;
  } else if (!content.includes("IS_PRODUCTION_TEST")) {
    console.log("❌ rule-25: playwright.config.ts não condiciona webServer a IS_PRODUCTION_TEST");
    errors++;
  } else {
    console.log("✅ rule-25: playwright.config.ts com BASE_URL dinâmico");
  }
}

// 2. Verificar se docs/TESTING-PRODUCTION.md existe
const docPath = join(ROOT, "docs", "TESTING-PRODUCTION.md");
if (!existsSync(docPath)) {
  console.log("❌ rule-25: docs/TESTING-PRODUCTION.md não encontrado");
  errors++;
} else {
  console.log("✅ rule-25: docs/TESTING-PRODUCTION.md presente");
}

// 3. Verificar scripts npm
const pkgPath = join(ROOT, "package.json");
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const scripts = pkg.scripts || {};
  const required = ["test:e2e:prod", "test:e2e:prod:smoke"];
  for (const script of required) {
    if (!scripts[script]) {
      console.log(`❌ rule-25: script npm "${script}" não encontrado`);
      errors++;
    } else {
      console.log(`✅ rule-25: script npm "${script}" presente`);
    }
  }
}

// 4. Verificar se CONVENTIONS.md tem Regra #25
const convPath = join(ROOT, "docs", "CONVENTIONS.md");
if (existsSync(convPath)) {
  const conv = readFileSync(convPath, "utf-8");
  if (!conv.includes("REGRA #25") && !conv.includes("Regra #25")) {
    console.log("❌ rule-25: CONVENTIONS.md não tem Regra #25");
    errors++;
  } else {
    console.log("✅ rule-25: Regra #25 documentada em CONVENTIONS.md");
  }
}

if (errors > 0) {
  console.log(`\n❌ rule-25: ${errors} erro(s) encontrado(s)`);
  process.exit(1);
} else {
  console.log(`\n✅ rule-25: todas as verificações passaram`);
}