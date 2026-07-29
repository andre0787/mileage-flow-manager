# AUTH Gate no CI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar gate de confirmação manual (`workflow_dispatch` com frase) no deploy.yml sem quebrar o fluxo automático de push.

**Architecture:** Híbrida — mantém `push: [main]` para deploys automáticos de PR mergeados + `workflow_dispatch` com validação de frase exata para deploys manuais. Step AUTH Gate condicional executa apenas em `workflow_dispatch`.

**Tech Stack:** GitHub Actions (YAML)

---

### Task 1: Modificar trigger e adicionar AUTH Gate no deploy.yml

**Files:**
- Modify: `.github/workflows/deploy.yml` (trigger section + início do job deploy)

**Interfaces:**
- Consumes: spec `docs/superpowers/specs/2026-07-29-auth-ci-design.md`
- Produces: deploy.yml com `workflow_dispatch` trigger e step AUTH Gate funcional

- [ ] **Step 1: Adicionar `workflow_dispatch` com input `auth_phrase` no trigger**

  Adicionar após a seção `on:` existente, mantendo `push: [main]`:

  ```yaml
  on:
    push:
      branches: [main]
    workflow_dispatch:
      inputs:
        auth_phrase:
          description: '🔐 Frase de autorização para deploy manual'
          required: true
          type: string
  ```

- [ ] **Step 2: Adicionar step AUTH Gate no início do job `deploy`**

  Inserir como primeiro step do job `deploy`, antes do `actions/checkout@v4`:

  ```yaml
        - name: 🔐 AUTH Gate
          if: github.event_name == 'workflow_dispatch'
          run: |
            if [ "${{ github.event.inputs.auth_phrase }}" != "Autorizo o deploy para produção" ]; then
              echo "❌ AUTH DENIED: frase incorreta"
              exit 1
            fi
            echo "✅ AUTH GRANTED — deploy autorizado"
  ```

- [ ] **Step 3: Verificar sintaxe do YAML**

  Opcional — rodar `yamllint` se disponível, ou validar visualmente que a indentação e estrutura estão corretas.

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "feat: AUTH Gate no CI — workflow_dispatch com validação de frase"
  ```

### Task 2: Adicionar script de validação rule-35

**Files:**
- Create: `scripts/rules/rule-35-auth-gate.mjs`
- Modify: `.prompts-manifest.json` (se necessário)

**Interfaces:**
- Consumes: deploy.yml com o step AUTH Gate
- Produces: script que valida a presença do step AUTH Gate no deploy.yml

- [ ] **Step 1: Criar script de validação**

  ```javascript
  #!/usr/bin/env node
  // rule-35-auth-gate.mjs — verifica que o deploy.yml tem AUTH Gate
  import { readFileSync } from 'fs';
  import { join } from 'path';

  const root = process.cwd();
  const deployYml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');

  const checks = [
    { name: 'workflow_dispatch trigger', pattern: /workflow_dispatch:/ },
    { name: 'auth_phrase input', pattern: /auth_phrase:/ },
    { name: 'AUTH Gate step name', pattern: /🔐 AUTH Gate/ },
    { name: 'frase exata de autorização', pattern: /Autorizo o deploy para produção/ },
    { name: 'condicional workflow_dispatch', pattern: /github\.event_name == 'workflow_dispatch'/ },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.pattern.test(deployYml)) {
      console.log(`  ✅ ${check.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name}`);
      failed++;
    }
  }

  console.log(`\n📊 rule-35: ${passed} pass, ${failed} fail`);
  process.exit(failed > 0 ? 1 : 0);
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add scripts/rules/rule-35-auth-gate.mjs
  git commit -m "feat: add rule-35 validation script for AUTH Gate"
  ```

### Task 3: Atualizar docs (AGENTS.md + pre-pr)

**Files:**
- Modify: `AGENTS.md` (adicionar referência ao script rule-35)
- Modify: `scripts/pre-pr-check.mjs` (adicionar chamada ao rule-35)

**Interfaces:**
- Consumes: rule-35 script da Task 2
- Produces: validação automática no pre-pr

- [ ] **Step 1: Verificar se AGENTS.md já referencia rule-35**

  `grep "rule-35" AGENTS.md` — se já tem a regra documentada, só verificar que está correta. Se não, adicionar.

- [ ] **Step 2: Adicionar rule-35 no pre-pr-check.mjs**

  Localizar a seção de regras e adicionar:

  ```javascript
  // rule-35: AUTH Gate no CI
  runRule('rule-35', 'node scripts/rules/rule-35-auth-gate.mjs');
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add AGENTS.md scripts/pre-pr-check.mjs
  git commit -m "docs: integrate rule-35 validation into pre-pr"
  ```