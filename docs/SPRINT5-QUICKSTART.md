# 🚀 Sprint #5 — Quick Start Guide

> Guia rápido para iniciar a Sprint #5 em nova sessão.

---

## Checklist Inicial (5 minutos)

- [ ] Ler `HANDOFF.md` — restaura contexto completo
- [ ] Ler `docs/AGENDA.md` — vê sprint board detalhado
- [ ] Ler `docs/WORKFLOW.md` — processo obrigatório
- [ ] Ler `docs/MAPA-EXPERIENCIAS-USUARIO.md` — contexto do usuário
- [ ] Executar `npm test` — verifica testes
- [ ] Executar `npx playwright test` — verifica E2E

---

## Ordem de Execução

### Fase 1: Council (Decisão)

Para cada item da Sprint #5, rodar council-to-superpowers:

1. **Notificações Push** → Council decide abordagem técnica
2. **Empty States** → Council valida prioridade
3. **Paginação** → Council valida complexidade

### Fase 2: Superpowers (Execução)

Para cada item aprovado no council:

1. **Brainstorming** → Criar spec em `docs/superpowers/specs/`
2. **Planning** → Criar plano em `docs/superpowers/plans/`
3. **Git Worktree** → Branch `feat/sprint5-[item]`
4. **TDD** → RED → GREEN → REFACTOR
5. **Code Review** → Entre tarefas
6. **Merge** → PR para develop → merge para main
7. **Relatório** → HTML em `docs/reports/`
8. **Handoff** → Atualizar `HANDOFF.md`

---

## Itens da Sprint #5

### 1. Notificações Push (3-5 dias)

**Branch:** `feat/sprint5-notificacoes-push`

**Tarefas:**
1. [ ] Criar `public/sw.js` (service worker)
2. [ ] Criar `src/hooks/useNotifications.ts`
3. [ ] Adicionar toggle em Configurações
4. [ ] Implementar lógica de verificação (24h)
5. [ ] Testar em Chrome, Firefox, Safari
6. [ ] Testes unitários
7. [ ] Teste E2E
8. [ ] Relatório HTML
9. [ ] PR e merge

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Fluxo 34

---

### 2. Empty States com CTAs (1-2 dias)

**Branch:** `feat/sprint5-empty-states`

**Tarefas:**
1. [ ] Criar componente `EmptyState.tsx` (se não existe)
2. [ ] Adicionar em Entradas.tsx
3. [ ] Adicionar em Vendas.tsx
4. [ [ ] Adicionar em Clientes.tsx
5. [ ] Adicionar em Contas.tsx
6. [ ] Testes E2E
7. [ ] Relatório HTML
8. [ ] PR e merge

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Gaps #11-20

---

### 3. Paginação (2-3 dias)

**Branch:** `feat/sprint5-paginacao`

**Tarefas:**
1. [ ] Criar componente `Pagination.tsx`
2. [ ] Adicionar em Entradas.tsx
3. [ ] Adicionar em Vendas.tsx
4. [ ] Adicionar em Clientes.tsx
5. [ ] Adicionar em Contas.tsx
6. [ ] Testar com filtros
7. [ ] Testes E2E
8. [ ] Relatório HTML
9. [ ] PR e merge

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Gaps #18-19

---

## Comandos Úteis

```bash
# Iniciar nova branch
git checkout -b feat/sprint5-notificacoes-push

# Testes
npm test
npx playwright test --reporter=list

# Build
npm run build

# Dev
npm run dev

# Criar PR
git push origin feat/sprint5-notificacoes-push
#然后 no GitHub: New Pull Request

# Merge (após review)
git checkout develop
git merge feat/sprint5-notificacoes-push
git checkout main
git merge develop
git push origin main
```

---

## Referências Rápidas

| O que | Onde |
|-------|------|
| Contexto de sessão | `HANDOFF.md` |
| Sprint board | `docs/AGENDA.md` |
| Workflow | `docs/WORKFLOW.md` |
| Experiências do usuário | `docs/MAPA-EXPERIENCIAS-USUARIO.md` |
| Arquitetura | `docs/ARCHITECTURE.md` |
| Convenções | `docs/CONVENTIONS.md` |
| Testes | `docs/TESTING.md` |
| Councils anteriores | `docs/council/2026-07-09-*.md` |

---

## Dicas

1. **Sempre rodar council** antes de implementar (obrigatório)
2. **Um PR por item** — não acumular múltiplos itens
3. **Relatório HTML obrigatório** antes do PR
4. **Atualizar HANDOFF.md** antes de finalizar sessão
5. **Testes devem passar** antes de merge

---

**Última atualização:** 2026-07-09
**Sprint:** #5
**Duração estimada:** 1-2 semanas
