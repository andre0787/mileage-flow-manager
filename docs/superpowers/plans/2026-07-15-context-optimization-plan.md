# Otimização de Contexto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir a leitura inicial de ~79KB / ~2.000 linhas para ~12KB / ~200 linhas via lazy loading por categoria, mantendo todas as validações automáticas.

**Architecture:** AGENTS.md vira hub compacto com 7 regras essenciais + tabela de categorias. handoff.md ganha snapshot do projeto no topo. session-start.mjs pergunta categoria e carrega só docs relevantes. Três novos scripts de validação garantem que o lazy loading é respeitado.

**Tech Stack:** Node 22+ (scripts), Vitest (testes), GitHub CLI (issues), shell (hooks)

## Global Constraints

- Todos os scripts em `.mjs` (padrão já estabelecido no projeto)
- Testes em `tests/**/*.test.ts` (config Vitest já existente)
- Toda regra imutável TEM script de validação em `scripts/rules/`
- `pre-pr-check.mjs` orquestra todas as regras — qualquer nova regra DEVE ser adicionada lá
- `pre-commit` hook bloqueia commit na main + roda pre-pr
- `session-start.mjs` é o ponto de entrada de toda sessão
- handoff.md é atualizado via `update-handoff.mjs --write`
- PT-BR para texto de interface/docs do projeto
- Zero dependências novas — stdlib (fs, child_process) + scripts já existentes
- `import.meta.dirname` disponível (Node 22+)

---

## File Structure

### Created
| File | Responsibility |
|------|---------------|
| `scripts/rules/rule-02-category-loading.mjs` | Valida que docs carregados correspondem à categoria |
| `scripts/rules/rule-03-handoff-completeness.mjs` | Valida handoff.md com todos os campos obrigatórios |
| `scripts/rules/rule-20-no-agenda-load.mjs` | Valida que AGENDA.md NÃO é lido em sessões normais |
| `scripts/handoff-snapshot.mjs` | Gera snapshot do projeto (stack, estrutura, regras, workflow) |
| `scripts/migrate-bugs.mjs` | Migra bugs da AGENDA.md para GitHub Issues |
| `docs/archive/AGENDA-2026.md` | Histórico de sprints arquivado |
| `docs/CONTEXT-MANAGEMENT.md` | Documenta a estratégia de lazy loading |
| `tests/unit/scripts-rules.test.ts` | Testes para os novos scripts de regra |
| `tests/unit/scripts-handoff.test.ts` | Testes para handoff-snapshot e migrate-bugs |

### Modified
| File | What changes |
|------|-------------|
| `AGENTS.md` | Reescrita completa: ~8.9KB → ~3-4KB |
| `docs/handoff.md` | Novo template com snapshot no topo |
| `docs/CONVENTIONS.md` | Adicionar regras #02, #03, #20 |
| `docs/WORKFLOW.md` | Novo fluxo com lazy loading por categoria |
| `scripts/session-start.mjs` | Remove leitura de AGENDA.md, extrai snapshot do handoff |
| `scripts/session-end.mjs` | Adiciona `node scripts/handoff-snapshot.mjs --write` |
| `scripts/update-handoff.mjs` | Adiciona seção de snapshot no template |
| `scripts/pre-pr-check.mjs` | Adiciona as 3 novas regras ao loop (automático — pasta scripts/rules/) |
| `.githooks/pre-commit` | Adiciona as 3 novas regras |
| `package.json` | Adiciona scripts `handoff:snapshot` e `migrate:bugs` |

---

## Tasks

### Task 1: rule-02-category-loading.mjs + test

**Files:**
- Create: `scripts/rules/rule-02-category-loading.mjs`
- Create: `tests/unit/scripts-rules.test.ts`

**Interfaces:**
- Consumes: handoff.md (lê "Categoria" e "Docs carregados")
- Produces: exit 0 se docs correspondem, exit 1 se não

- [ ] **Step 1: Criar scripts/rules/rule-02-category-loading.mjs**

```javascript
#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

const CATEGORY_MAP = {
  feature: ["WORKFLOW.md", "CONVENTIONS.md"],
  bugfix: ["DEBUG.md", "CONVENTIONS.md"],
  docs: [],
  refactor: ["CONVENTIONS.md", "ARCHITECTURE.md"],
};

function main() {
  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-02: handoff.md não encontrado, pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");

  const catMatch = content.match(/-\s*\*\*Categoria:\*\*\s*(\w+)/);
  if (!catMatch) {
    console.log("  ⏭️  rule-02: categoria não definida no handoff, pulando");
    return;
  }
  const category = catMatch[1];

  const docsMatch = content.match(/-\s*\*\*Docs carregados:\*\*\s*(.*)/);
  if (!docsMatch) {
    console.error("❌ rule-02: seção 'Docs carregados' não encontrada no handoff.md");
    process.exit(1);
    return;
  }
  const docsLoaded = docsMatch[1].split(",").map(d => d.trim()).filter(Boolean);

  if (!CATEGORY_MAP[category]) {
    console.log(`  ⚠️  rule-02: categoria '${category}' não mapeada, pulando`);
    return;
  }

  const allowedDocs = CATEGORY_MAP[category];
  const violations = docsLoaded.filter(d => !allowedDocs.includes(d));
  if (violations.length > 0) {
    console.error(`❌ rule-02: docs fora da categoria '${category}': ${violations.join(", ")}. Permitidos: ${allowedDocs.join(", ") || "nenhum"}`);
    process.exit(1);
  }

  console.log(`  ✅ rule-02: docs carregados compatíveis com categoria '${category}'`);
}

main();
```

- [ ] **Step 2: Criar tests/unit/scripts-rules.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const RULE_02 = resolve(__dirname, "../../scripts/rules/rule-02-category-loading.mjs");

describe("rule-02-category-loading", () => {
  it("deve passar ou pular quando handoff não tem categoria", () => {
    const out = execSync(`node "${RULE_02}" 2>&1`, {
      cwd: resolve(RULE_02, "../.."),
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toMatch(/✅|⏭️/);
  });
});
```

- [ ] **Step 3: Verificar que pre-pr-check.mjs já inclui a regra**

```bash
node scripts/pre-pr-check.mjs --list | grep rule-02
# Expected: rule-02-category-loading.mjs
```

- [ ] **Step 4: Rodar teste e commit**

```bash
npx vitest run tests/unit/scripts-rules.test.ts -t "rule-02"
git add scripts/rules/rule-02-category-loading.mjs tests/unit/scripts-rules.test.ts
git commit -m "feat: rule-02 valida lazy loading por categoria"
```

---

### Task 2: rule-03-handoff-completeness.mjs

**Files:**
- Create: `scripts/rules/rule-03-handoff-completeness.mjs`

- [ ] **Step 1: Criar scripts/rules/rule-03-handoff-completeness.mjs**

```javascript
#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

const REQUIRED_SECTIONS = [
  { field: "Projeto", pattern: /## 🏗️ Projeto/ },
  { field: "Estado Atual", pattern: /## 🧭 Estado Atual/ },
  { field: "Branch", pattern: /\*\*Branch:\*\*/ },
  { field: "Bugs Abertos", pattern: /### 🐞 Bugs/ },
  { field: "Sessão Atual", pattern: /## 🎯 Sessão Atual/ },
  { field: "Categoria", pattern: /\*\*Categoria:\*\*/ },
  { field: "Docs carregados", pattern: /\*\*Docs carregados:\*\*/ },
  { field: "Última Sessão", pattern: /## ✅ Última Sessão/ },
];

function main() {
  if (!existsSync(HANDOFF_PATH)) {
    console.log("  ⏭️  rule-03: handoff.md não encontrado, pulando");
    return;
  }

  const content = readFileSync(HANDOFF_PATH, "utf8");
  const missing = REQUIRED_SECTIONS.filter(({ field, pattern }) => !pattern.test(content));

  if (missing.length > 0) {
    console.error(`❌ rule-03: seções ausentes no handoff.md: ${missing.map(m => m.field).join(", ")}`);
    process.exit(1);
  }

  console.log(`  ✅ rule-03: handoff.md completo (${REQUIRED_SECTIONS.length}/${REQUIRED_SECTIONS.length} campos)`);
}

main();
```

- [ ] **Step 2: Verificar que falha (handoff atual não tem os campos novos)**

```bash
node scripts/rules/rule-03-handoff-completeness.mjs
# Expected: exit code 1
```

- [ ] **Step 3: Commit**

```bash
git add scripts/rules/rule-03-handoff-completeness.mjs
git commit -m "feat: rule-03 valida campos obrigatórios do handoff"
```

---

### Task 3: rule-20-no-agenda-load.mjs

**Files:**
- Create: `scripts/rules/rule-20-no-agenda-load.mjs`

- [ ] **Step 1: Criar scripts/rules/rule-20-no-agenda-load.mjs**

```javascript
#!/usr/bin/env node

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");

const FILES_TO_CHECK = [
  "scripts/session-start.mjs",
  "scripts/update-handoff.mjs",
];

function main() {
  let violations = 0;

  for (const file of FILES_TO_CHECK) {
    const path = resolve(ROOT, file);
    try {
      const content = readFileSync(path, "utf8");
      if (content.includes("AGENDA.md") || content.includes("AGENDA-2026")) {
        console.error(`❌ rule-20: ${file} referencia AGENDA.md — remova a referência`);
        violations++;
      }
    } catch {
      console.log(`  ⏭️  rule-20: ${file} não encontrado, pulando`);
    }
  }

  if (violations > 0) process.exit(1);
  console.log(`  ✅ rule-20: nenhum script referencia AGENDA.md`);
}

main();
```

- [ ] **Step 2: Verificar que falha (session-start.mjs ainda referencia)**

```bash
node scripts/rules/rule-20-no-agenda-load.mjs
# Expected: exit code 1 (session-start.mjs ainda lê AGENDA.md)
```

- [ ] **Step 3: Commit**

```bash
git add scripts/rules/rule-20-no-agenda-load.mjs
git commit -m "feat: rule-20 valida que AGENDA.md não é carregado"
```

---

### Task 4: handoff-snapshot.mjs + test

**Files:**
- Create: `scripts/handoff-snapshot.mjs`
- Create: `tests/unit/scripts-handoff.test.ts`

- [ ] **Step 1: Criar scripts/handoff-snapshot.mjs**

```javascript
#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const HANDOFF_PATH = resolve(ROOT, "docs/handoff.md");

function buildSnapshot() {
  const date = new Date().toISOString().slice(0, 10);

  let bugsSection = "- nenhum | [ver todos → Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)";
  try {
    const ghOut = execSync(
      `gh issue list --label bug --state open --json number,title --limit 10 2>/dev/null || true`,
      { cwd: ROOT, encoding: "utf8", timeout: 5000 }
    ).trim();
    if (ghOut && ghOut !== "[]") {
      const issues = JSON.parse(ghOut);
      if (issues.length > 0) {
        const origin = execSync("git remote get-url origin", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim().replace(/\.git$/, "");
        bugsSection = issues.map(i => `- [#${i.number}](${origin}/issues/${i.number}) — ${i.title}`).join("\n");
      }
    }
  } catch {}

  let commits = "n/a";
  try {
    commits = execSync("git log --oneline -3", { cwd: ROOT, encoding: "utf8", timeout: 3000 }).trim();
  } catch {}

  return [
    `> ⏰ Snapshot atualizado em: ${date}`,
    "",
    "### 🏗️ Projeto",
    "",
    "**Stack:** React + Vite + Supabase + Tailwind | pt-BR",
    "**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests",
    "**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria",
    "**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR",
    "",
    "### 🐞 Bugs Abertos",
    "",
    bugsSection,
    "",
    "### 📋 Commits Recentes",
    "",
    "```",
    commits,
    "```",
  ].join("\n");
}

function main() {
  const snapshot = buildSnapshot();

  if (process.argv.includes("--write") && existsSync(HANDOFF_PATH)) {
    const current = readFileSync(HANDOFF_PATH, "utf8");

    if (current.includes("## 🏗️ Projeto")) {
      const before = current.split("## 🏗️ Projeto")[0];
      const after = current.includes("## 🧭 Estado Atual")
        ? "## 🧭 Estado Atual" + current.split("## 🧭 Estado Atual").slice(1).join("## 🧭 Estado Atual")
        : "";
      writeFileSync(HANDOFF_PATH, before + "## 🏗️ Projeto\n\n" + snapshot + "\n\n" + after);
    } else {
      const lines = current.split("\n");
      const headerEnd = lines.findIndex(l => l.startsWith("---")) + 1;
      lines.splice(headerEnd, 0, "", "## 🏗️ Projeto", "", snapshot);
      writeFileSync(HANDOFF_PATH, lines.join("\n"));
    }
    console.log("✅ handoff.md snapshot atualizado");
  } else {
    console.log(snapshot);
  }
}

main();
```

- [ ] **Step 2: Criar tests/unit/scripts-handoff.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const SNAPSHOT_SCRIPT = resolve(__dirname, "../../scripts/handoff-snapshot.mjs");

describe("handoff-snapshot", () => {
  it("deve gerar snapshot com stack e estrutura", () => {
    const out = execSync(`node "${SNAPSHOT_SCRIPT}"`, {
      cwd: resolve(SNAPSHOT_SCRIPT, "../.."),
      encoding: "utf8",
      timeout: 5000,
    });
    expect(out).toContain("Stack:");
    expect(out).toContain("Estrutura:");
    expect(out).toContain("Regras críticas:");
    expect(out).toContain("Workflow:");
  });
});
```

- [ ] **Step 3: Rodar teste e commit**

```bash
npx vitest run tests/unit/scripts-handoff.test.ts -t "handoff-snapshot"
git add scripts/handoff-snapshot.mjs tests/unit/scripts-handoff.test.ts
git commit -m "feat: handoff-snapshot gera resumo do projeto"
```

---

### Task 5: migrate-bugs.mjs

**Files:**
- Create: `scripts/migrate-bugs.mjs`

- [ ] **Step 1: Criar scripts/migrate-bugs.mjs**

```javascript
#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const AGENDA_PATH = resolve(ROOT, "docs/AGENDA.md");
const DRY_RUN = !process.argv.includes("--apply");

function parseBugs(content) {
  const bugs = [];
  const abertosMatch = content.match(/### Abertos\n([\s\S]*?)(?=\n### |\n##|$)/);
  if (!abertosMatch) return bugs;

  const section = abertosMatch[1];
  let currentBug = null;

  for (const line of section.split("\n")) {
    const bugMatch = line.match(/^- \[ \]\s*(.+)/);
    if (bugMatch) {
      if (currentBug) bugs.push(currentBug);
      currentBug = { title: bugMatch[1].trim(), desc: "" };
    } else if (currentBug && line.trim()) {
      currentBug.desc += line.trim() + " ";
    }
  }
  if (currentBug) bugs.push(currentBug);
  return bugs;
}

function main() {
  if (!existsSync(AGENDA_PATH)) {
    console.log("AGENDA.md não encontrado — nada a migrar.");
    return;
  }

  const content = readFileSync(AGENDA_PATH, "utf8");
  const bugs = parseBugs(content);

  if (bugs.length === 0) {
    console.log("✅ Nenhum bug aberto encontrado.");
    return;
  }

  console.log(`📋 ${bugs.length} bug(s) encontrado(s):\n`);

  for (const bug of bugs) {
    const desc = `> Bug migrado de docs/AGENDA.md\n\n**Descrição:** ${bug.desc || "Sem detalhes."}`;
    console.log(`  ${DRY_RUN ? "🔍" : "🚀"} ${bug.title}`);

    if (!DRY_RUN) {
      try {
        const result = execSync(
          `gh issue create --title "${bug.title}" --body '${desc}' --label bug`,
          { cwd: ROOT, encoding: "utf8", timeout: 10000 }
        ).trim();
        console.log(`     ✅ ${result}`);
      } catch (e) {
        console.error(`     ❌ ${e.message}`);
      }
    }
  }

  if (DRY_RUN) {
    console.log("\nModo dry-run. Para criar: node scripts/migrate-bugs.mjs --apply");
  }
}

main();
```

- [ ] **Step 2: Rodar dry-run**

```bash
node scripts/migrate-bugs.mjs
# Expected: lista bugs sem criar issues
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-bugs.mjs
git commit -m "feat: migrate-bugs migra bugs da AGENDA para GitHub Issues"
```

---

### Task 6: Atualizar package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Adicionar scripts ao package.json**

Adicionar após `"validate-stock"`:

```
"handoff:snapshot": "node scripts/handoff-snapshot.mjs --write",
"migrate:bugs": "node scripts/migrate-bugs.mjs",
"migrate:bugs:apply": "node scripts/migrate-bugs.mjs --apply",
```

- [ ] **Step 2: Verificar**

```bash
npm run handoff:snapshot
# Expected: ✅ handoff.md snapshot atualizado
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: scripts handoff:snapshot e migrate:bugs"
```

---

### Task 7: AGENTS.md hub compacto

**Files:**
- Modify: `AGENTS.md` (reescrita completa)

- [ ] **Step 1: Escrever novo AGENTS.md**

Nova estrutura:
- **Cabeçalho** — 1 parágrafo
- **Mapa de Conhecimento** — tabela doc → conteúdo → tamanho
- **Regras Essenciais (7)** — bullet points, os imortais
- **Categorias de Tarefa** — tabela feature|bugfix|docs|refactor|chore
- **REGRA DOURADA** — NÃO pré-carregue docs
- **Workflow Mínimo** — 6 passos
- **Registro de Bugs** — GitHub Issues
- **Auto-inicialização** — 4 passos

O conteúdo exato está no design doc (seção 2). Consultar `docs/superpowers/specs/context-optimization-design.md`.

- [ ] **Step 2: Validar** — confirmar que as 20 regras originais são referenciadas, mesmo que só no mapa

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md reescrito como hub compacto (~3-4KB)"
```

---

### Task 8: handoff.md novo template

**Files:**
- Modify: `docs/handoff.md`

- [ ] **Step 1: Escrever novo handoff.md**

Template com seções:
- `## 🏗️ Projeto (Snapshot Automático)` — gerado pelo handoff-snapshot.mjs
- `---`
- `## 🧭 Estado Atual` — branch, commit, remote, PRs
- `---`
- `## 🎯 Sessão Atual` — categoria, docs carregados, objetivo
- `---`
- `## ✅ Última Sessão` — data, o que foi feito, pendências
- `---`
- `## 📋 Notas`

- [ ] **Step 2: Rodar handoff:snapshot para popular**

```bash
npm run handoff:snapshot
```

- [ ] **Step 3: Commit**

```bash
git add docs/handoff.md
git commit -m "docs: handoff.md novo template com snapshot do projeto"
```

---

### Task 9: Arquivar AGENDA.md + migrar bugs

**Files:**
- Create: `docs/archive/AGENDA-2026.md`
- Modify: `docs/AGENDA.md`

- [ ] **Step 1: Arquivar AGENDA.md**

```bash
mkdir -p docs/archive
cp docs/AGENDA.md docs/archive/AGENDA-2026.md
```

- [ ] **Step 2: Migrar bugs (dry-run)**

```bash
node scripts/migrate-bugs.mjs
```

- [ ] **Step 3: Aplicar migração**

```bash
node scripts/migrate-bugs.mjs --apply
```

- [ ] **Step 4: Substituir AGENDA.md por redirect**

```markdown
# AGENDA — MilesControl

> Este arquivo foi arquivado em `docs/archive/AGENDA-2026.md`.
> O projeto não possui roadmap ativo no momento.
>
> Para bugs, consulte: [GitHub Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)
```

- [ ] **Step 5: Commit**

```bash
git add docs/archive/AGENDA-2026.md docs/AGENDA.md
git commit -m "docs: AGENDA.md arquivado, bugs migrados para GitHub Issues"
```

---

### Task 10: Atualizar session-start.mjs

**Files:**
- Modify: `scripts/session-start.mjs`

- [ ] **Step 1: Remover toda referência a AGENDA.md**

O script atual (linhas ~7-90) faz:
1. Lê AGENDA.md — REMOVER
2. Extrai sprints, backlog, bugs da agenda — REMOVER e usar handoff.md
3. Mantém: handoff.md, IDEIAS.md, feedback, git state

A nova versão deve:
1. Ler `handoff.md` (agora tem snapshot + bugs)
2. Extrair dessas seções usando regex
3. Manter IDEIAS.md, feedback, git status
4. **Perguntar categoria** ao final do output

Editar o bloco que lê AGENDA.md e extrai seções (substituir pelo código da Task 10 no design doc, ou verificar o arquivo finalizado).

- [ ] **Step 2: Verificar que rule-20 agora passa**

```bash
node scripts/rules/rule-20-no-agenda-load.mjs
# Expected: ✅
```

- [ ] **Step 3: Commit**

```bash
git add scripts/session-start.mjs
git commit -m "feat: session-start.mjs não lê mais AGENDA.md, usa handoff.md"
```

---

### Task 11: Atualizar session-end.mjs

**Files:**
- Modify: `scripts/session-end.mjs`

- [ ] **Step 1: Adicionar snapshot antes do commit do handoff**

No `session-end.mjs`, após o `git add .` e antes do commit, adicionar:

```javascript
// Gera snapshot do projeto no handoff
execSync("node scripts/handoff-snapshot.mjs --write", { cwd: ROOT, encoding: "utf8", timeout: 10000 });
```

Melhor: colocar isso DENTRO da função de atualização do handoff, antes do `git add docs/handoff.md`.

- [ ] **Step 2: Commit**

```bash
git add scripts/session-end.mjs
git commit -m "feat: session-end gera snapshot do projeto via handoff:snapshot"
```

---

### Task 12: Atualizar CONVENTIONS.md

**Files:**
- Modify: `docs/CONVENTIONS.md`

- [ ] **Step 1: Adicionar regras #02, #03, #20**

Regra #02 — Lazy loading por categoria:
- AGENTS.md define categorias (feature, bugfix, docs, refactor, chore)
- Agente DEVE carregar APENAS docs da categoria escolhida
- Violação: carregar doc não permitido para a categoria
- Valida: `rule-02-category-loading.mjs`

Regra #03 — Handoff completeness:
- handoff.md DEVE ter: Projeto, Estado Atual, Branch, Bugs, Sessão Atual, Categoria, Docs carregados, Última Sessão
- Valida: `rule-03-handoff-completeness.mjs`

Regra #20 — AGENDA.md arquivado:
- AGENDA.md não deve ser carregado em sessões normais (está em docs/archive/)
- Nenhum script deve referenciar AGENDA.md
- Valida: `rule-20-no-agenda-load.mjs`

- [ ] **Step 2: Commit**

```bash
git add docs/CONVENTIONS.md
git commit -m "docs: CONVENTIONS.md adiciona regras #02, #03, #20"
```

---

### Task 13: Atualizar WORKFLOW.md

**Files:**
- Modify: `docs/WORKFLOW.md`

- [ ] **Step 1: Atualizar fluxo de início de sessão**

Adicionar seção sobre lazy loading:
1. `session:start` → pergunta categoria
2. Carrega docs da categoria (tabela em AGENTS.md)
3. Não pré-carregue docs preventivamente

Atualizar diagrama de workflow para incluir o passo de categoria.

- [ ] **Step 2: Commit**

```bash
git add docs/WORKFLOW.md
git commit -m "docs: WORKFLOW.md atualizado com lazy loading por categoria"
```

---

### Task 14: Criar CONTEXT-MANAGEMENT.md

**Files:**
- Create: `docs/CONTEXT-MANAGEMENT.md`

- [ ] **Step 1: Criar o doc**

```markdown
# Gerenciamento de Contexto

> Estratégia para maximizar a eficiência de agentes de IA no projeto,
> reduzindo ruído e melhorando a qualidade de raciocínio.

## O Problema

Agentes de IA iniciam sessões carregando ~79KB / ~2.000 linhas de documentação,
consumindo ~20K tokens antes de qualquer trabalho real. Isso causa:
- Lost in the middle: informações relevantes se perdem no ruído
- Erros de interpretação de regras
- Degradação de raciocínio em modelos menores

## A Solução

### Lazy Loading por Categoria

O projeto usa um sistema de categorias para carregar APENAS os docs relevantes:

| Categoria | Docs Carregados |
|-----------|-----------------|
| feature | WORKFLOW.md + CONVENTIONS.md |
| bugfix | DEBUG.md + CONVENTIONS.md |
| docs | (só AGENTS.md) |
| refactor | CONVENTIONS.md + ARCHITECTURE.md |
| chore | (só AGENTS.md) |

### Hub Compacto (AGENTS.md)

O AGENTS.md foi reduzido de ~9KB para ~3KB contendo apenas:
- Mapa de conhecimento (tabela de docs com tamanhos)
- 7 regras essenciais
- Tabela de categorias
- Workflow mínimo (6 passos)

### Snapshot Automático (handoff.md)

O handoff.md contém no topo um snapshot do projeto gerado automaticamente
pelo `npm run handoff:snapshot`, incluindo stack, estrutura, regras críticas,
bugs abertos e commits recentes.

## Scripts de Validação

| Regra | Script | O que valida |
|-------|--------|-------------|
| #02 | rule-02-category-loading.mjs | Docs carregados correspondem à categoria |
| #03 | rule-03-handoff-completeness.mjs | handoff.md tem todos os campos |
| #20 | rule-20-no-agenda-load.mjs | AGENDA.md não é referenciado |

## Para Modelos Menores

Este projeto foi projetado para funcionar com modelos de contexto limitado.
As validações automáticas (pre-pr, pre-commit hooks) garantem que mesmo
modelos com pouca capacidade de contexto sigam as regras corretamente.
```

- [ ] **Step 2: Verificar rule-16 (scripts têm atalho npm)**

`npm run pre-pr` já orquestra todas as validações.

- [ ] **Step 3: Commit**

```bash
git add docs/CONTEXT-MANAGEMENT.md
git commit -m "docs: CONTEXT-MANAGEMENT.md documenta estratégia de lazy loading"
```

---

### Task 15: Validação final e PR

- [ ] **Step 1: Verificar git status**

```bash
git status
# Expected: tudo stageado, zero arquivos não trackeados
```

- [ ] **Step 2: Rodar pre-pr completo**

```bash
npm run pre-pr
# Expected: ✅ 0 errors
```

- [ ] **Step 3: Criar branch e PR**

```bash
git checkout -b feat/context-optimization
git add .
git commit -m "feat: otimização de contexto com lazy loading e hub compacto"
git push origin feat/context-optimization
gh pr create --title "feat: otimização de contexto" --body "Reduz leitura inicial de ~79KB para ~12KB, adiciona lazy loading por categoria, arquiva AGENDA.md, adiciona 3 novos scripts de validação."
```

- [ ] **Step 4: Rodar post-pr**

```bash
npm run post-pr
```

---

## Ordem de Execução Recomendada

```
Task 1  → rule-02 + test
Task 2  → rule-03
Task 3  → rule-20
── Wait: pre-pr now has 3 new rules ──
Task 4  → handoff-snapshot + test
Task 5  → migrate-bugs
Task 6  → package.json scripts
── Wait: npm run handoff:snapshot works ──
Task 7  → AGENTS.md rewrite
Task 8  → handoff.md new template
Task 9  → archive AGENDA.md + migrate bugs
Task 10 → session-start.mjs update
Task 11 → session-end.mjs update
── Wait: rule-20 now passes ──
Task 12 → CONVENTIONS.md
Task 13 → WORKFLOW.md
Task 14 → CONTEXT-MANAGEMENT.md
Task 15 → final validation + PR
```
