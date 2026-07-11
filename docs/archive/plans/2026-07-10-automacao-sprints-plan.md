# Plano: Automação & Organização em 3 Sprints

**Baseado no spec:** docs/superpowers/specs/2026-07-10-automacao-sprints-design.md
**Council Veredito:** docs/council/2026-07-10-plano-automacao-sprints-veredito.md

---

## Sprint A — Fundação de Automação ⏫ Prioridade Máxima

**Branch:** `sprint/automacao-fundacao`
**Objetivo:** CI/CD rodando, deploy automático, scripts básicos.
**Duração estimada:** 1-2 horas

### Tarefas

#### A1. CI Workflow (.github/workflows/ci.yml) — 30min
- [ ] Criar `.github/workflows/ci.yml` com:
  - Trigger: `pull_request` + `push` (qualquer branch)
  - Setup: `actions/checkout@v4`, `setup-node@v4`, `npm ci`
  - Build: `npm run build`
  - Unit tests: `npm test`
  - E2E tests: `npx playwright install --with-deps && npx playwright test`
  - Upload report: `actions/upload-artifact` com `playwright-report/`
- [ ] Configurar cache npm e playwright

#### A2. Deploy Workflow (.github/workflows/deploy.yml) — 15min
- [ ] Criar `.github/workflows/deploy.yml` com:
  - Trigger: `push` em `main`
  - Setup: `actions/checkout@v4`, `setup-node@v4`, `npm ci`
  - Build: `npm run build`
  - Deploy: `vercel-deploy` action
- [ ] Usar `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` como secrets

#### A3. Script test:e2e no package.json — 30s
- [ ] Adicionar `"test:e2e": "playwright test"` nos scripts
- [ ] Adicionar `"test:e2e:ui": "playwright test --ui"`

#### A4. Matar develop + Atualizar Git Workflow — 5min
- [ ] `git branch -D develop` (local)
- [ ] `git push origin --delete develop` (remoto)
- [ ] Atualizar `docs/GIT-WORKFLOW.md`:
  - Remover referências a develop
  - Fluxo: branch → PR → main
  - Deploy: automático via CI (não manual)
- [ ] Atualizar `docs/WORKFLOW.md` — checklists mencionando CI

#### A5. Verificação
- [ ] Commit + push da branch
- [ ] Criar PR (draft primeiro)
- [ ] Verificar CI roda automaticamente no PR
- [ ] Verificar build + 107 testes passam no CI
- [ ] Merge para main
- [ ] Verificar deploy automático na Vercel

---

## Sprint B — Limpeza & Confiabilidade 🔶 Alta Prioridade

**Branch:** `sprint/automacao-limpeza`
**Objetivo:** Arquivar ruído, configurar cross-harness, verificação automatizada.
**Duração estimada:** 2 horas

### Tarefas

#### B1. Arquivar specs antigas — 10min
- [ ] `git mv docs/superpowers/specs/* docs/archive/`
  - Exceto: `2026-07-10-automacao-sprints-design.md` (atual)
- [ ] Atualizar `docs/MAP.md` — mover referência de specs para "Arquivados"
- [ ] Remover referências órfãs em AGENTS.md se houver

#### B2. Arquivar plans antigos — 5min
- [ ] `git mv docs/superpowers/plans/* docs/archive/`
  - Exceto: `2026-07-10-automacao-sprints-plan.md` (atual)

#### B3. Arquivar council verdicts antigos — 5min
- [200 ] Mover 5 council verdicts sem link para `docs/archive/`:
  - `2026-07-09-busca-global-veredito.md`
  - `2026-07-09-notificacoes-push-veredito.md`
  - `2026-07-09-pdf-export-relatorios-veredito.md`
  - `2026-07-09-priorizacao-backlog-veredito.md`
  - `2026-07-10-novas-convencoes-code-review-veredito.md`
- Manter no lugar: `2026-07-10-plano-automacao-sprints-veredito.md` + o que tiver link ativo

#### B4. Limpar artifacts obsoletos — 5min
- [ ] `git mv docs/SPRINT5-QUICKSTART.md docs/archive/`
- [ ] `git mv docs/mobile-ios-notes.md docs/archive/`
- [ ] `git mv docs/progress.md docs/archive/` (planning-with-files)
- [ ] `git mv docs/task_plan.md docs/archive/` (planning-with-files)
- [ ] `git mv tests/fluxo-relatorio.md docs/archive/`

#### B5. Cross-harness config — 10min
- [ ] Criar `.opencode/settings.json`:
  ```json
  {
    "skills": ["../.pi/skills/handoff"],
    "customInstructions": "Veja AGENTS.md para convenções do projeto"
  }
  ```
- [ ] Criar `.claude/settings.local.json`:
  ```json
  {
    "skills": ["../.pi/skills/handoff"]
  }
  ```
- [ ] Adicionar ambos ao `.gitignore`? (settings.local.json sim, settings.json não)

#### B6. Script de verificação de docs — 1h
- [ ] Criar `scripts/verify-docs.mjs`:
  - Lê todos os arquivos .md do repo
  - Extrai referências internas (links para outros .md)
  - Identifica órfãos (0 referências de outros .md)
  - Identifica promessas quebradas (menciona hooks/CI que não existem)
  - Gera relatório legível (markdown ou JSON)
- [ ] Testar localmente: `node scripts/verify-docs.mjs`

#### B7. Atualizar docs núcleo — 30min
- [ ] `AGENTS.md`:
  - Regra #7: trocar "manual" por "CI verifica automaticamente" (ou manter manual + CI?)
  - Regra #4: "Bateria pré-deploy" → "CI/CD roda em todo PR"
  - Adicionar seção de CI/CD
- [ ] `docs/WORKFLOW.md`:
  - Checklist: adicionar "CI verde?" 
  - Remover referências a subagent/git-worktrees se não aplicam
- [ ] `docs/CONVENTIONS.md`:
  - Adicionar convenção de CI/CD: workflow YAML, scripts de verificação
- [ ] `docs/MAP.md`:
  - Refletir arquivamento de docs antigos
  - Adicionar `docs/archive/` como categoria "Histórico"

#### B8. Verificação
- [ ] Commit + push
- [ ] CI verde no PR
- [ ] Verificar `git status` — zero arquivos não commitados
- [ ] Rodar `node scripts/verify-docs.mjs` — confirmar redução de órfãos
- [ ] Merge para main
- [ ] Deploy automático na Vercel

---

## Sprint C — Polimento & Prevenção 🟢 Média Prioridade

**Branch:** `sprint/automacao-prevencao`
**Objetivo:** Prevenção ativa, dashboard de qualidade, docs vivos.
**Duração estimada:** 2 horas

### Tarefas

#### C1. Script de varredura no CI — 30min
- [ ] Criar `.github/workflows/scan.yml`:
  - Trigger: schedule (semanal) + manual dispatch
  - Roda `node scripts/verify-docs.mjs`
  - Se encontrar órfãos ou promessas quebradas → cria issue automática
  - Se tudo ok → badge de saúde
- [ ] Adicionar `scripts/verify-docs.mjs` refinado com:
  - Lista de promessas conhecidas (hook, CI, deploy auto)
  - Verifica se cada promessa tem implementação correspondente

#### C2. Dashboard de qualidade — 1h
- [ ] Script `scripts/quality-report.mjs` que gera `QUALITY.md`:
  - Status dos workflows CI/CD (última run)
  - Número de testes (unit + E2E)
  - Número de arquivos .md (total, linkados, órfãos)
  - Número de gaps de automação abertos
  - Tendências (comparação com scan anterior)
- [ ] Roda no CI pós-merge, atualiza `QUALITY.md` automaticamente

#### C3. Relatório HTML automático no workflow — 30min
- [ ] Workflow `report.yml`:
  - Trigger: workflow_dispatch + manual (/report no pi)
  - Roda `node scripts/generate-report.mjs`
  - Gera relatório HTML em `docs/reports/`
  - Cria PR automático com o relatório

#### C4. HANDOFF.md automatizado — 30min
- [ ] Template de HANDOFF.md em `scripts/templates/HANDOFF.md`
- [ ] Script `scripts/update-handoff.mjs`:
  - Lê último commit, PRs abertos, CI status
  - Preenche template com dados atuais
  - Avisa se algo está desatualizado (ex: AGENDA.md mudou desde último handoff)

#### C5. Verificação
- [ ] Testar trigger manual de todos os workflows
- [ ] Verificar QUALITY.md gerado corretamente
- [ ] Verificar scan semanal detecta novos órfãos
- [ ] Verificar HANDOFF.md template funcional
- [ ] Merge para main

---

## Execução

| Sprint | Branch | PR | Depende de |
|--------|--------|----|------------|
| A | `sprint/automacao-fundacao` | PR #72 | Nenhuma |
| B | `sprint/automacao-limpeza` | PR #73 | Sprint A (CI precisa existir) |
| C | `sprint/automacao-prevencao` | PR #74 | Sprint B (scripts precisam existir) |

## Métricas Pós-Implementação

| Métrica | Antes | Depois (Sprint A) | Depois (Sprint B) | Depois (Sprint C) |
|---------|-------|-------------------|-------------------|-------------------|
| CI/CD | ❌ | ✅ | ✅ | ✅ |
| Deploy automático | ❌ | ✅ | ✅ | ✅ |
| test:e2e script | ❌ | ✅ | ✅ | ✅ |
| develop branch | ❌ (89 behind) | ✅ (removida) | ✅ | ✅ |
| Cross-harness config | ❌ | ❌ | ✅ | ✅ |
| Arquivos órfãos | 29 | 29 (ainda) | ≈1-3 | ≈0 (monitorado) |
| Promessas quebradas | 5 | 3 (CI+deploy resolvidos) | 0 | 0 |
| Verificação automática | ❌ | ❌ | ✅ scan script | ✅ CI + QUALITY.md |
| Relatório automático | ❌ | ❌ | ❌ | ✅ |
