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
7309bd3 test: ajusta fluxo de transferência E2E
70107da docs: atualiza handoff da correção de recorrência
d5afb51 fix: ativa recorrencia pelo tipo de origem
```

## 🧭 Estado Atual
- **Branch:** `fix/auto-refresh-after-mutations`
- **Último commit:** `7309bd3` — test: ajusta fluxo de transferência E2E
- **Remote:** origin/fix/auto-refresh-after-mutations
### 📋 PRs Abertos
- #150 — fix: aguarda atualização do cache após mutations
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
**Tarefa:** corrigir cache e ativar recorrência pelo tipo de origem
**Resultado:** PR #150 atualizado; recorrência automática validada no E2E.

## 📌 Próxima Sessão
1. Verificar CI/PR #150 e fazer merge quando aprovado.
2. Investigar separadamente o fechamento da página no fluxo E2E após criar cliente, se necessário.

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🧠 Notas da Sessão Atual
- Correção: callbacks `onSuccess` das mutations aguardam `invalidateQueries` com `refetchType: 'all'`.
- Validações: 50 unit tests, build, lint com 9 warnings preexistentes, pre-pr com 0 erros.
- E2E específico: recorrência automática e transferência passaram após atualizar o teste; o fluxo ainda fecha a página após criar cliente, sem relação com recorrência.
- PR: https://github.com/andre0787/mileage-flow-manager/pull/150