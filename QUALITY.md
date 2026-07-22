# 📊 QUALITY — MilesControl

> Gerado em: 2026-07-22
> Último commit: 43124a7-Merge pull request #190 from andre0787/docs/roadmap-p2-update

## Pipeline

| Etapa | Status | Detalhes |
|-------|--------|----------|
| CI (PR) | ✅ | `.github/workflows/ci.yml` |
| Deploy (main) | ✅ | `.github/workflows/deploy.yml` → Vercel |
| Docs Health | ✅ | `.github/workflows/docs-health.yml` (semanal) |

## Testes

| Tipo | Casos |
|------|-------|
| Unit | 124 |
| E2E  | 63 |
| **Total** | **187** |

## Bundle

| Métrica | Valor |
|---------|-------|
| Tamanho (dist) | 1392kB |

## Documentação

| Métrica | Valor |
|---------|-------|
| Arquivos .md | 123 |
| Arquivados | 44 |
| Issues (verify-docs) | 0 |

### ✅ Documentação limpa — zero issues

## Histórico

| Data | CI Status | Testes | Bundle | Docs |
|------|-----------|--------|--------|------|
| 2026-07-22 | ✅ | 187 | 1392kB | 0 issues |

---

_Atualizado por `node scripts/quality-report.mjs`_

<!-- CI-RUNS-START -->
# Qualidade do Projeto

Esta seção reflete o estado atual dos checks de CI (autenticado via GitHub CLI).

## Últimas Execuções de CI
| Workflow | Status | URL |
|----------|--------|-----|
| Deploy | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29911886318) |
| Normalize PR Report | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29911759210) |
| CI — PR Check | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29911758964) |
| Auto Merge | failure | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29911754549) |
| Deploy | success | [Link](https://github.com/andre0787/mileage-flow-manager/actions/runs/29911746800) |

## Required Checks (proteção de main)
> Status baseado no HEAD da main. Checks que só rodam em PR (ex: check-pr) aparecem como pendente.

| Check | Status |
|-------|--------|
| check-pr | ⏳ pending |

<!-- CI-RUNS-END -->