# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## ✅ Sprint #3 — Completa (PR #54)

- [x] #6–#16 — Refatoração, testes, formatação, strictNullChecks

## ✅ Sprint #4 — Completa (PR #55)

- [x] CSV export em Vendas.tsx
- [x] Playwright retries

## ✅ Bugfix — PR #58

- [x] #56 — origem-tipo: isClube setado ao criar tipo com recorrência
- [x] #57 — fluxo-completo: safePost() com timeout, ignora 409

## ✅ Fix — PR #59

- [x] fluxo-completo: reload para React Query + selectors corrigidos

## ✅ Fix — PR #60

- [x] entradas.spec.ts: `#editAmount` → `#amount` (IDs são os mesmos create/edit)
- [x] docs/TESTING.md atualizado

## ✅ Feature — PR #61

- [x] Code splitting recharts via lazy loading
- [x] Bundle principal: 1MB → 637kB (-38.6%)
- [x] Chunk separado para recharts (~398kB)
- [x] Skeleton loader para UX

---

## 🎯 Sprint #5 — Notificações + UX

**Objetivo:** Melhorar engajamento com notificações e UX básica
**Estimativa:** 1-2 semanas
**Dependências:** Nenhuma

---

### Item 1: Badge de Entradas Pendentes ✅

**Prioridade:** 🔴 Alta
**Estimativa:** 1-2 dias
**Arquivos impactados:** `src/components/AppSidebar.tsx`, `src/components/BottomTabBar.tsx`

**Critérios de Aceite:**
- [x] Badge amber no sidebar ao lado de "Entradas" (desktop)
- [x] Badge amber sobre ícone no bottom tab bar (mobile)
- [x] Contagem de entradas com `entryStatus === 'aguardando'`
- [x] Badge só aparece quando há pendências > 0
- [x] Visível em todas as páginas (não só Dashboard)

**Notas:**
- Push notifications adiadas (badge resolve 90% do caso)
- **Council:** `docs/council/2026-07-09-notificacoes-push-veredito.md`

---

### Item 2: Empty States com CTAs ✅

**Prioridade:** 🟡 Média
**Estimativa:** 1-2 dias

**Critérios de Aceite:**
- [x] Empty state em Entradas: botão "Nova Entrada"
- [x] Empty state em Vendas: botão "Nova Venda"
- [x] Empty state em Clientes: já existia com CTA
- [x] Empty state em Contas: já existia com CTA
- [x] Empty states seguem design system

---

### Item 3: Paginação em Listas ✅

**Prioridade:** 🟡 Média
**Estimativa:** 2-3 dias

**Critérios de Aceite:**
- [x] Componente Pagination reutilizável
- [x] Paginação em Entradas, Vendas, Clientes, Contas (20 itens/página)
- [x] Indicador: "Mostrando 1-20 de X"
- [x] Só aparece quando há > 20 itens

---

## 📌 Backlog Futuro

### Sprint #7 (Futura)
- [ ] Multi-idioma (i18n)
- [ ] Dark mode toggle
- [ ] Atalhos de teclado

### Referência
- [x] Mapa de Experiências do Usuário — `docs/MAPA-EXPERIENCIAS-USUARIO.md`

---

## 📊 Status da Produção

| Métrica | Valor |
|---------|-------|
| Bundle size | 646kB |
| Testes unitários | 35/35 ✅ |
| Testes E2E | 8/8 ✅ |
| Deploy | Automático (Vercel) |
| Último PR | #64 (modo offline) |

---

**Última atualização:** 2026-07-09
**Próxima revisão:** Sprint #6
