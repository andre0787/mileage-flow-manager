# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-17
> Anterior: 2026-07-16
---

## 🏗️ Projeto

> ⏰ Snapshot atualizado em: 2026-07-17

### 🏗️ Projeto

**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria
**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR

### 🐞 Bugs Abertos

- nenhum | [ver todos → Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)

### 📋 Commits Recentes

```
61f1a99 chore: normalize report prefix to PR150
75e94cd docs: referencia veredito de atualização do cache
ce0971b fix: aguarda atualização do cache após mutations
```
## 🧭 Estado Atual
- **Branch:** `fix/auto-refresh-after-mutations`
- **Último commit:** `61f1a99` — chore: normalize report prefix to PR150
- **Remote:** origin/fix/auto-refresh-after-mutations
### 📋 PRs Abertos
- #150 — fix cache — aguarda atualização após mutations
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 113 |
| Docs issues | 1 |
| Branch | fix/auto-refresh-after-mutations |

## 🎯 Sessão Atual
**Categoria:** bugfix
**Docs carregados:** `docs/DEBUG.md`, `docs/CONVENTIONS.md`

## ✅ Última Sessão
**Data:** 2026-07-17
**Tarefa:** corrigir atualização automática do cache após mutations
**Resultado:** PR #150 criado; CI pendente.

## 📌 Próxima Sessão
1. Verificar CI/PR #150 e fazer merge quando aprovado.
2. Investigar separadamente a falha E2E de recorrência, se necessário.

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🧠 Notas da Sessão Atual
- Correção: callbacks `onSuccess` das mutations aguardam `invalidateQueries` com `refetchType: 'all'`.
- Validações: 50 unit tests, build, lint sem erros, pre-pr com 0 erros.
- E2E: 51 passaram, 3 flaky e 1 falhou em cenário de recorrência não relacionado ao diff.
- PR: https://github.com/andre0787/mileage-flow-manager/pull/150