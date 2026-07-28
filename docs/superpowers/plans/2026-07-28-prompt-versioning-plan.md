# Prompt Versioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar sistema de hash automático + manifesto para versionamento de prompts e skills, com validação no pre-pr.

**Architecture:** Script `scripts/prompt-manifest.mjs` gera/atualiza `.prompts-manifest.json` com SHA256 de cada arquivo monitorado. Rule `scripts/rules/rule-29-prompt-version.mjs` valida no pre-pr que todo arquivo modificado tem hash atualizado no manifesto. Integração via npm scripts e workflow.

**Tech Stack:** Node.js 22+ (zero deps, fs nativo), SHA256 via `crypto` module

## Global Constraints

- Todos os scripts em `scripts/` com atalho npm correspondente em `package.json`
- Regras de validação localizadas em `scripts/rules/` com nomenclatura `rule-NN-nome.mjs`
- Manifesto salvo em `.prompts-manifest.json` na raiz do projeto
- Usar `crypto.createHash('sha256')` do Node.js nativo — sem dependências externas
- Nomes de npm script: `prompt:manifest` e `prompt:check`
- Caminhos relativos à raiz do projeto
- Scripts devem ser compatíveis com Node 22+

---
### Task 1: Script prompt-manifest.mjs

**Files:**
- Create: `scripts/prompt-manifest.mjs`

**Interfaces:**
- Consumes: lista de arquivos monitorados (hardcoded no script)
- Produces: `.prompts-manifest.json` na raiz (quando `--write`), ou stdout (modo `--check`)

- [ ] **Step 1: Criar estrutura base do script**

Script aceita flags:
- `--write`: gera/atualiza `.prompts-manifest.json`
- `--check`: modo validação (exit 1 se hashes divergirem)
- `--list`: lista arquivos monitorados

```mjs
#!/usr/bin/env node

/**
 * prompt-manifest.mjs — Gera/valida manifesto de hashes de prompts.
 *
 * Uso:
 *   node scripts/prompt-manifest.mjs --write    # atualiza .prompts-manifest.json
 *   node scripts/prompt-manifest.mjs --check    # valida (exit 1 se divergir)
 *   node scripts/prompt-manifest.mjs --list     # lista arquivos monitorados
 *
 * ponytail: fs + crypto nativos, zero deps
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, relative } from "path";
import { createHash } from "crypto";

const ROOT = resolve(import.meta.dirname, "..");
const MANIFEST_PATH = resolve(ROOT, ".prompts-manifest.json");
const MANIFEST_VERSION = 1;

// Arquivos monitorados — paths relativos à raiz do projeto
const PROMPT_FILES = [
  // Skills
  ".pi/skills/council-to-superpowers/SKILL.md",
  ".pi/skills/handoff/SKILL.md",
  ".pi/skills/llm-council/SKILL.md",
  ".pi/skills/small-model-execution/SKILL.md",
  // Docs de configuração do agente
  "AGENTS.md",
  "CLAUDE.md",
  // Docs de workflow
  "docs/CONTEXT-MANAGEMENT.md",
  "docs/WORKFLOW-MANIFEST.md",
  "docs/WORKFLOW.md",
];

function sha256(filePath) {
  const absPath = resolve(ROOT, filePath);
  if (!existsSync(absPath)) return null;
  const content = readFileSync(absPath);
  return createHash("sha256").update(content).digest("hex");
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }
}

function generateManifest() {
  const prompts = {};
  for (const file of PROMPT_FILES) {
    const hash = sha256(file);
    if (hash) prompts[file] = `sha256-${hash}`;
  }
  return {
    version: MANIFEST_VERSION,
    updatedAt: new Date().toISOString(),
    prompts,
  };
}

function writeManifest() {
  const manifest = generateManifest();
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✅ .prompts-manifest.json atualizado (${Object.keys(manifest.prompts).length} arquivos)`);
  return manifest;
}

function checkManifest() {
  const manifest = readManifest();
  if (!manifest) {
    console.error("❌ .prompts-manifest.json não encontrado. Execute: npm run prompt:manifest");
    process.exit(1);
  }

  if (manifest.version !== MANIFEST_VERSION) {
    console.error(`❌ Versão do manifesto desatualizada (${manifest.version}). Execute: npm run prompt:manifest`);
    process.exit(1);
  }

  let errors = 0;
  const current = generateManifest();

  for (const file of PROMPT_FILES) {
    const expected = manifest.prompts[file];
    const actual = current.prompts[file];

    if (!expected && actual) {
      console.warn(`  ⚠️  Arquivo monitorado não está no manifesto: ${file}`);
      continue;
    }

    if (expected && !actual) {
      console.error(`  ❌ Arquivo não encontrado (foi removido?): ${file}`);
      errors++;
      continue;
    }

    if (expected !== actual) {
      console.error(`  ❌ Hash diverge: ${file}`);
      console.error(`     esperado: ${expected}`);
      console.error(`     atual:    ${actual}`);
      console.error(`     Execute: npm run prompt:manifest`);
      errors++;
    }
  }

  // Verifica se tem entradas obsoletas no manifesto (arquivos que não existem mais)
  for (const file of Object.keys(manifest.prompts)) {
    if (!PROMPT_FILES.includes(file)) {
      const absPath = resolve(ROOT, file);
      if (!existsSync(absPath)) {
        console.warn(`  ⚠️  Entrada obsoleta no manifesto (arquivo removido): ${file}`);
      }
    }
  }

  if (errors > 0) {
    console.error(`\n❌ ${errors} erro(s) de hash. Execute: npm run prompt:manifest`);
    process.exit(1);
  }

  console.log(`  ✅ prompt:manifest — ${Object.keys(manifest.prompts).length} arquivos, todos íntegros`);
}

function listFiles() {
  console.log("Arquivos monitorados pelo prompt-manifest:");
  for (const file of PROMPT_FILES) {
    const absPath = resolve(ROOT, file);
    const exists = existsSync(absPath);
    console.log(`  ${exists ? "📄" : "❌"} ${file}`);
  }
}

// ── Main ──
const args = process.argv.slice(2);

if (args.includes("--write")) {
  writeManifest();
} else if (args.includes("--check")) {
  checkManifest();
} else if (args.includes("--list")) {
  listFiles();
} else {
  console.log("Uso: node scripts/prompt-manifest.mjs [--write | --check | --list]");
  process.exit(1);
}
```

- [ ] **Step 2: Testar o script**

```bash
node scripts/prompt-manifest.mjs --write
```

Verificar que `.prompts-manifest.json` foi criado na raiz com hashes SHA256.

```bash
node scripts/prompt-manifest.mjs --list
```

Verificar lista de arquivos monitorados.

```bash
node scripts/prompt-manifest.mjs --check
```

Verificar que passa com manifesto recem-criado.

- [ ] **Step 3: Testar modo --check com falha**

```bash
# Modificar levemente um arquivo monitorado (ex: adicionar comentário)
echo "# test" >> AGENTS.md
node scripts/prompt-manifest.mjs --check
# Deve falhar com "Hash diverge: AGENTS.md"

# Reverter
git checkout AGENTS.md
```

- [ ] **Step 4: Commit**

```bash
git add scripts/prompt-manifest.mjs .prompts-manifest.json
git commit -m "feat: prompt-manifest — geração e validação de hashes de prompts"
```

---
### Task 2: Rule rule-29-prompt-version.mjs

**Files:**
- Create: `scripts/rules/rule-29-prompt-version.mjs`

**Interfaces:**
- Consumes: `.prompts-manifest.json`, git diff
- Produces: exit 0/1 com mensagens de validação
- Depende de: Task 1 (prompt-manifest.mjs)

- [ ] **Step 1: Criar a rule**

```mjs
#!/usr/bin/env node

/**
 * rule-29-prompt-version.mjs — Valida que todo prompt/skill modificado
 * teve seu hash atualizado no .prompts-manifest.json.
 *
 * Regra #29: "Todo prompt versionado no manifesto"
 *
 * Uso:
 *   node scripts/rules/rule-29-prompt-version.mjs
 *
 * ponytail: execSync + fs nativo, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = resolve(ROOT, ".prompts-manifest.json");

// Mesma lista do prompt-manifest.mjs
const PROMPT_FILES = [
  ".pi/skills/council-to-superpowers/SKILL.md",
  ".pi/skills/handoff/SKILL.md",
  ".pi/skills/llm-council/SKILL.md",
  ".pi/skills/small-model-execution/SKILL.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/CONTEXT-MANAGEMENT.md",
  "docs/WORKFLOW-MANIFEST.md",
  "docs/WORKFLOW.md",
];

function main() {
  // Em main/master, não há sessão ativa — regra não se aplica com rigor
  const branch = (() => {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    } catch {
      return "?";
    }
  })();

  if (!existsSync(MANIFEST_PATH)) {
    // Se não tem manifesto, apenas warning (pode ser clone fresco)
    if (branch === "main" || branch === "master") {
      console.log("  ⏭️  rule-29: main/master — manifesto não encontrado, pulando");
      return;
    }
    console.error("❌ rule-29: .prompts-manifest.json não encontrado. Execute: npm run prompt:manifest");
    process.exit(1);
  }

  let errors = 0;

  // Para cada arquivo monitorado, verificar se foi modificado (git diff contra HEAD)
  for (const file of PROMPT_FILES) {
    const absPath = resolve(ROOT, file);
    if (!existsSync(absPath)) continue;

    // Verifica se o arquivo está modified/unstaged na working tree
    let isModified = false;
    try {
      const diffStatus = execSync(
        `git diff --name-only HEAD -- "${file}" 2>/dev/null || true`,
        { cwd: ROOT, encoding: "utf8", timeout: 3000 }
      ).trim();
      isModified = diffStatus.length > 0;
    } catch {
      // Se git falhar, assume não modificado
    }

    if (!isModified) continue;

    // Arquivo modificado — verificar se hash no manifesto corresponde
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    const expectedHash = manifest.prompts?.[file];

    if (!expectedHash) {
      console.error(`❌ rule-29: "${file}" foi modificado mas não está no manifesto.`);
      console.error(`   Execute: npm run prompt:manifest`);
      errors++;
      continue;
    }

    // Calcular hash atual
    const { createHash } = await import("crypto");
    // Não podemos usar await no top-level? Vamos usar sincrono.
    // Na verdade, vamos usar require/createHash sincrono
  }

  // Reimplementar com abordagem síncrona para compatibilidade
  // A versão final usará crypto sincrono
}

main();
```

Ops — percebi que o uso de `await import` é desnecessário. Vou reescrever a rule de forma totalmente síncrona:

```mjs
#!/usr/bin/env node

/**
 * rule-29-prompt-version.mjs — Valida que todo prompt/skill modificado
 * teve seu hash atualizado no .prompts-manifest.json.
 *
 * Regra #29: "Todo prompt versionado no manifesto"
 *
 * Uso:
 *   node scripts/rules/rule-29-prompt-version.mjs
 *
 * ponytail: execSync + crypto, zero deps
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

const ROOT = resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = resolve(ROOT, ".prompts-manifest.json");

// Mesma lista do prompt-manifest.mjs
const PROMPT_FILES = [
  ".pi/skills/council-to-superpowers/SKILL.md",
  ".pi/skills/handoff/SKILL.md",
  ".pi/skills/llm-council/SKILL.md",
  ".pi/skills/small-model-execution/SKILL.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/CONTEXT-MANAGEMENT.md",
  "docs/WORKFLOW-MANIFEST.md",
  "docs/WORKFLOW.md",
];

function sha256(filePath) {
  const absPath = resolve(ROOT, filePath);
  if (!existsSync(absPath)) return null;
  const content = readFileSync(absPath);
  return createHash("sha256").update(content).digest("hex");
}

function main() {
  const branch = (() => {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
    } catch {
      return "?";
    }
  })();

  if (!existsSync(MANIFEST_PATH)) {
    if (branch === "main" || branch === "master") {
      console.log("  ⏭️  rule-29: main/master — manifesto não encontrado, pulando");
      return;
    }
    console.error("❌ rule-29: .prompts-manifest.json não encontrado. Execute: npm run prompt:manifest");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  let errors = 0;

  for (const file of PROMPT_FILES) {
    const absPath = resolve(ROOT, file);
    if (!existsSync(absPath)) continue;

    // Verifica se o arquivo está modificado (working tree ou staged vs HEAD)
    let isModified = false;
    try {
      const diffStatus = execSync(
        `git diff --name-only HEAD -- "${file}" 2>/dev/null || true`,
        { cwd: ROOT, encoding: "utf8", timeout: 3000 }
      ).trim();
      isModified = diffStatus.length > 0;
    } catch {
      // Se git falhar, assume não modificado
    }

    if (!isModified) continue;

    const expectedHash = manifest.prompts?.[file];
    if (!expectedHash) {
      console.error(`❌ rule-29: "${file}" foi modificado mas não está no manifesto.`);
      console.error(`   Execute: npm run prompt:manifest`);
      errors++;
      continue;
    }

    const actualHash = sha256(file);
    const fullHash = `sha256-${actualHash}`;

    if (fullHash !== expectedHash) {
      console.error(`❌ rule-29: "${file}" foi modificado mas manifesto não foi atualizado.`);
      console.error(`   esperado: ${expectedHash}`);
      console.error(`   atual:    ${fullHash}`);
      console.error(`   Execute: npm run prompt:manifest`);
      errors++;
    }
  }

  if (errors > 0) {
    process.exit(1);
  }

  console.log(`  ✅ rule-29: todos os arquivos monitorados com hashes consistentes`);
}

main();
```

- [ ] **Step 2: Testar a rule**

```bash
# Primeiro com manifesto atualizado
node scripts/prompt-manifest.mjs --write
node scripts/rules/rule-29-prompt-version.mjs
# Deve passar: "✅ rule-29: todos os arquivos monitorados com hashes consistentes"
```

- [ ] **Step 3: Testar falha da rule**

```bash
# Modificar um arquivo sem atualizar manifesto
echo " " >> AGENTS.md
node scripts/rules/rule-29-prompt-version.mjs
# Deve falhar com "❌ rule-29: AGENTS.md foi modificado mas manifesto não foi atualizado"

# Reverter
git checkout AGENTS.md
```

- [ ] **Step 4: Commit**

```bash
git add scripts/rules/rule-29-prompt-version.mjs
git commit -m "feat: rule-29 — valida prompt versioning no pre-pr"
```

---
### Task 3: npm scripts + workflow integration

**Files:**
- Modify: `package.json` (adicionar scripts)
- Modify: `scripts/pre-pr-check.mjs` (já inclui rules/ automaticamente)
- Read: `docs/WORKFLOW.md` (para documentar novos scripts)

**Interfaces:**
- Consumes: Tasks 1 e 2
- Produces: npm scripts `prompt:manifest`, `prompt:check` disponíveis

- [ ] **Step 1: Adicionar scripts ao package.json**

Encontrar a seção de scripts e adicionar após os scripts existentes de `prompt`:

```json
    "prompt:manifest": "node scripts/prompt-manifest.mjs --write",
    "prompt:check": "node scripts/prompt-manifest.mjs --check"
```

Adicionar em ordem alfabética (após `post-pr:nopush`).

- [ ] **Step 2: Verificar que pre-pr-check.mjs já executa rules/ automaticamente**

O pre-pr-check.mjs já tem:

```js
let ruleFiles = readdirSync(RULES_DIR).filter(f => f.endsWith(".mjs")).sort();
for (const file of ruleFiles) {
  const rulePath = resolve(RULES_DIR, file);
  try {
    const out = execSync(`node "${rulePath}"`, ...);
    if (out) process.stdout.write(out + "\n");
  } catch (e) { errors++; ... }
}
```

Como rule-29 está em `scripts/rules/` com `.mjs`, ela **já é incluída automaticamente** no pre-pr. Nenhuma modificação no pre-pr-check.mjs é necessária.

- [ ] **Step 3: Testar o fluxo completo**

```bash
# 1. Gerar manifesto
npm run prompt:manifest

# 2. Check
npm run prompt:check

# 3. Modificar skill e ver que pre-pr falha
echo "# test" >> AGENTS.md
npm run pre-pr 2>&1 | grep -E "rule-29|❌"
# Deve mostrar erro da rule-29

# Reverter
git checkout AGENTS.md
npm run prompt:manifest  # re-gerar manifesto pro estado limpo
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat: npm scripts prompt:manifest e prompt:check"
```

---
### Task 4: Documentation

**Files:**
- Modify: `docs/WORKFLOW.md` (adicionar seção de scripts)
- Modify: `docs/ARCHITECTURE.md` (adicionar referência ao manifesto)

- [ ] **Step 1: Adicionar no WORKFLOW.md — tabela de scripts**

Encontrar a seção "Scripts de Workflow" e adicionar após `post-pr:nopush`:

```markdown
| `npm run prompt:manifest` | Gera/atualiza `.prompts-manifest.json` com SHA256 dos prompts | Após modificar qualquer skill/doc de configuração |
| `npm run prompt:check` | Verifica se hashes do manifesto correspondem aos arquivos atuais | Validação manual antes de pre-pr |
```

- [ ] **Step 2: Adicionar no WORKFLOW.md — seção Prompt Versioning**

Adicionar ao final do documento (antes do histórico ou checklist):

```markdown
## Prompt Versioning

O projeto usa um sistema de versionamento de prompts via hashes SHA256:

1. `.prompts-manifest.json` na raiz contém hashes de todos os arquivos de prompt/skill monitorados
2. `npm run prompt:manifest` atualiza o manifesto
3. `rule-29` no pre-pr valida que toda modificação em prompt atualizou o manifesto

### Quando atualizar

Sempre que modificar um dos arquivos monitorados:
- `.pi/skills/*/SKILL.md` (qualquer skill)
- `AGENTS.md`, `CLAUDE.md`
- `docs/CONTEXT-MANAGEMENT.md`, `docs/WORKFLOW-MANIFEST.md`, `docs/WORKFLOW.md`

### Fluxo

```
1. Edita arquivo monitorado
2. npm run prompt:manifest   ← atualiza .prompts-manifest.json
3. npm run pre-pr            ← rule-29 valida consistência
4. Cria PR
```

Se esquecer de rodar `prompt:manifest`, o pre-pr falha com erro claro apontando qual arquivo precisa ser atualizado.

### Regras

- **Rule #29** (nova): "Todo prompt versionado no manifesto" — validada por `scripts/rules/rule-29-prompt-version.mjs`
```

- [ ] **Step 3: Commit**

```bash
git add docs/WORKFLOW.md
git commit -m "docs: documenta prompt versioning no workflow"
```
