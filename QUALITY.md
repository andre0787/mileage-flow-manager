# 📊 QUALITY — MilesControl

> Gerado em: 2026-08-18
> Último commit: 74d83d0-Merge pull request #458 from andre0787/chore/quality-nightly-update

## Pipeline

| Etapa | Status | Detalhes |
|-------|--------|----------|
| CI (PR) | ✅ | `.github/workflows/ci.yml` |
| Deploy (main) | ✅ | `.github/workflows/deploy.yml` → Vercel |
| Docs Health | ✅ | `.github/workflows/docs-health.yml` (semanal) |

## Testes

| Tipo | Casos |
|------|-------|
| Unit | 1039 |
| E2E  | 86 |
| **Total** | **1125** |

## Bundle

| Métrica | Valor |
|---------|-------|
| Tamanho (dist) | 1805kB |

## Documentação

| Métrica | Valor |
|---------|-------|
| Arquivos .md | 211 |
| Arquivados | 46 |
| Issues (verify-docs) | 0 |

### ✅ Documentação limpa — zero issues

## Histórico

| Data | CI Status | Testes | Bundle | Docs |
|------|-----------|--------|--------|------|
| 2026-08-18 | ✅ | 1125 | 1805kB | 0 issues |

---

_Atualizado por `node scripts/quality-report.mjs`_
