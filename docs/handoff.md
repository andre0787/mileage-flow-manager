# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-20
> Anterior: 2026-07-20
---
## 🏗️ Projeto

> ⏰ Snapshot atualizado em: 2026-07-20

### 🏗️ Projeto

**Stack:** React + Vite + Supabase + Tailwind | pt-BR
**Estrutura:** /src (components/, lib/, pages/) | /docs | /scripts | /tests
**Regras críticas:** branch obrigatória, pre-pr c/ relatório, git status ZERO, lazy loading por categoria
**Workflow:** session:start → categoria → carregar docs → council (se feature) → build → pre-pr → PR

### 🐞 Bugs Abertos

- nenhum | [ver todos → Issues](https://github.com/andreluiz0787/mileage-flow-manager/issues)

### 📋 Commits Recentes

```
a84dfe1 docs: update handoff
16b6635 P1-14: Separar check:fast / check:pr / check:nightly (#172)
1402a45 chore: update task cards to done
```

## 🧭 Estado Atual
- **Branch:** `fix/mobile-form-stability-v2`
- **Último commit:** `70ddbd0 — chore: normalize report prefix to PR173`
- **Remote:** origin/fix/mobile-form-stability-v2
### 📋 PRs Abertos
Nenhum
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 132 |
| Docs issues | 0 |
| Branch | fix/mobile-form-stability-v2 |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🎯 Sessão Atual
**Categoria:** bugfix
**Objetivo:** fix mobile form instability - drawer + virtual keyboard
**Status:** in_progress
**Branch:** `fix/mobile-form-stability-v2`
**Último commit:** 70ddbd0 — chore: normalize report prefix to PR173
**Docs carregados:** DEBUG.md, CONVENTIONS.md
## ✅ Última Sessão
PR #172 merged — P1-14: Separar check:fast / check:pr / check:nightly
## 📌 Próxima Sessão
Abrir PR do fix mobile form stability
## 🧠 Notas da Sessão Atual
- Bug #b9437399: formulário de entrada "sai do controle" no mobile ao preencher valor pago
- Causa raiz: scroll-margin-bottom:6rem nos inputs + falta de snapPoints/fixed no Drawer
- Fix: removido scroll-margin-bottom + adicionado snapPoints=["100%"] e fixed no Drawer mobile
