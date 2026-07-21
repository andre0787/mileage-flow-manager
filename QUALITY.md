# 📊 QUALITY — MilesControl

> Gerado em: 2026-07-11
> Último commit: c614263-Sprint B — Limpeza & Confiabilidade 🧹

## Pipeline

| Etapa | Status | Detalhes |
|-------|--------|----------|
| CI (PR) | ✅ | `.github/workflows/ci.yml` |
| Deploy (main) | ✅ | `.github/workflows/deploy.yml` → Vercel |
| Docs Health | ✅ | `.github/workflows/docs-health.yml` (semanal) |

## Testes

| Tipo | Casos |
|------|-------|
| Unit | 45 |
| E2E  | 63 |
| **Total** | **108** |

## Bundle

| Métrica | Valor |
|---------|-------|
| Tamanho (dist) | 1369kB |

## Documentação

| Métrica | Valor |
|---------|-------|
| Arquivos .md | 62 |
| Arquivados | 43 |
| Issues (verify-docs) | 1 |

### 🔴 Issues de Documentação

```

🔗 Verificando links internos...

═══════════════════════════════════════════
  verify-docs.mjs — Relatório
═══════════════════════════════════════════

Total arquivos .md: 62
Total issues:       9

Por tipo:
   broken-link: 9

❌ Problemas encontrados:

  🔗 docs/archive/plans/2026-07-09-modo-offline-plan.md:4 → link quebrado: "docs/superpowers/specs/2026-07-09-modo-offline-design.md" (texto: "docs/superpowers/specs/2026-07-09-modo-offline-design.md")
  🔗 docs/archive/plans/2026-07-10-automacao-sprints-plan.md:3 → link quebrado: "docs/superpowers/specs/2026-07-10-automacao-sprints-design.md" (texto: "docs/superpowers/specs/2026-07-10-automacao-sprints-design.md")
  🔗 docs/archive/plans/2026-07-10-automacao-sprints-plan.md:85 → link quebrado: "docs/SPRINT5-QUICKSTART.md" (texto: "docs/SPRINT5-QUICKSTART.md")
  🔗 docs/archive/plans/2026-07-10-automacao-sprints-plan.md:86 → link quebrado: "docs/mobile-ios-notes.md" (texto: "docs/mobile-ios-notes.md")
  🔗 docs/archive/plans/2026-07-10-automacao-sprints-plan.md:87 → link quebrado: "docs/progress.md" (texto: "docs/progress.md")
  🔗 docs/archive/plans/2026-07-10-automacao-sprints-plan.md:88 → link quebrado: "docs/task_plan.md" (texto: "docs/task_plan.md")
  🔗 docs/archive/plans/code-splitting-recharts.md:4 → link quebrado: "docs/superpowers/specs/code-splitting-recharts.md" (texto: "docs/superpowers/specs/code-splitting-recharts.md")
  🔗 docs/archive/specs/2026-07-08-vendas-extract-components-design.md:165 → link quebrado: "docs/superpowers/specs/2026-07-08-entradas-refactor-design.md" (texto: "docs/superpowers/specs/2026-07-08-entradas-refactor-design.md")
  🔗 docs/archive/specs/2026-07-09-modo-offline-design.md:81 → link quebrado: "docs/council/2026-07-09-modo-offline-veredito.md" (texto: "docs/council/2026-07-09-modo-offline-veredito.md")


```

## Histórico

| Data | CI Status | Testes | Bundle | Docs |
|------|-----------|--------|--------|------|
| 2026-07-11 | ✅ | 108 | 1369kB | 1 issues |

---

_Atualizado por `node scripts/quality-report.mjs`_

<!-- CI-RUNS-START -->
# Qualidade do Projeto

Esta seção reflete o estado atual dos checks de CI (autenticado via GitHub CLI).

## Últimas Execuções de CI
| Workflow | Status | URL |
|----------|--------|-----|
| Nightly — Full Check | failure | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29813522956) |
| Auto Merge | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29791858851) |
| Deploy | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29791848053) |
| Normalize Reports | failure | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29791848043) |
| Auto Merge | failure | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29791646212) |

## Required Checks (proteção de main)
| Check | Status |
|-------|--------|
| check-pr | ⏳ pending |

<!-- CI-RUNS-END -->