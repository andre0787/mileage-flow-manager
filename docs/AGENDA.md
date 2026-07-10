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

### Item 1: Badge de Entradas Pendentes + Notificações Push

**Prioridade:** 🔴 Alta
**Estimativa:** 1-2 dias (badge) + 3-5 dias (push, futuro)
**Arquivos impactados:** `src/components/AppSidebar.tsx`, `src/components/BottomTabBar.tsx`

**Descrição:**
Exibir badge de contagem de entradas pendentes de confirmação no sidebar e bottom tab bar, visível em todas as páginas.

**Critérios de Aceite:**
- [x] Badge amber no sidebar ao lado de "Entradas" (desktop)
- [x] Badge amber sobre ícone no bottom tab bar (mobile)
- [x] Contagem de entradas com `entryStatus === 'aguardando'`
- [x] Badge só aparece quando há pendências > 0
- [x] Visível em todas as páginas (não só Dashboard)
- [ ] Push notifications (decidido adiar — badge resolve 90% do caso)

**Notas:**
- Alerta no Dashboard já existia (amber banner)
- Council decidiu: badge visual primeiro, push notification apenas se necessário após dados reais
- Push notifications ficam no backlog para Sprint #6 se necessário

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Fluxo 34 (Notificações)
**Council:** `docs/council/2026-07-09-notificacoes-push-veredito.md`

---

### Item 2: Melhorar Empty States com CTAs

**Prioridade:** 🟡 Média
**Estimativa:** 1-2 dias
**Arquivos impactados:** `src/components/EntryTable.tsx`, `src/components/SaleTable.tsx`, `src/pages/Entradas.tsx`, `src/pages/Vendas.tsx`

**Descrição:**
Quando não há dados para exibir, mostrar estado vazio com Call-to-Action (CTA) para criar o primeiro item.

**Critérios de Aceite:**
- [x] Empty state em Entradas: botão "Nova Entrada" (desktop + mobile)
- [x] Empty state em Vendas: botão "Nova Venda"
- [x] Empty state em Clientes: já existia com CTA
- [x] Empty state em Contas: já existia com CTA
- [x] Empty states seguem design system (ícone + título + descrição + botão)
- [x] Botão funciona e abre modal/drawer correto
- [ ] Testes E2E para cada empty state (adiado — fluxo manual verificado)

**Abordagem Técnica:**
1. Criar componente `EmptyState.tsx` reutilizável
2. Adicionar em cada página quando `data.length === 0`
3. Props: `icon`, `title`, `description`, `actionLabel`, `onAction`
4. Seguir padrão do `src/components/EmptyState.tsx` (já existe)

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Gaps #11-20

---

### Item 3: Adicionar Paginação em Listas Longas

**Prioridade:** 🟡 Média
**Estimativa:** 2-3 dias
**Arquivos impactados:** `src/components/Pagination.tsx`, `src/components/EntryTable.tsx`, `src/components/SaleTable.tsx`, `src/pages/Clientes.tsx`, `src/pages/Contas.tsx`

**Descrição:**
Listas com muitos itens devem ter paginação para melhorar performance e UX.

**Critérios de Aceite:**
- [x] Componente Pagination reutilizável
- [x] Paginação em Entradas (20 itens/página, desktop + mobile)
- [x] Paginação em Vendas (20 itens/página, desktop + mobile)
- [x] Paginação em Clientes (20 itens/página)
- [x] Paginação em Contas (20 itens/página)
- [x] Indicador: "Mostrando 1-20 de X"
- [x] Paginação no lado do cliente (slice de dados já carregados)
- [x] Só aparece quando há > 20 itens
- [ ] Testes E2E para navegação entre páginas (adiado)

**Abordagem Técnica:**
1. Criar componente `Pagination.tsx` reutilizável
2. Usar shadcn/ui se disponível, senão criar simples
3. Estado local: `currentPage`, `itemsPerPage`
4. Lógica: `slice((page-1) * perPage, page * perPage)`

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Gaps #18-19

---

## 📌 Backlog Futuro

### Sprint #6 (Completa)
- [x] Busca global — PR #63
- [x] Modo offline minimal — PR #64
- [x] ~~Exportação PDF dos relatórios~~ (descartado pelo council)

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
| Bundle size | 645kB |
| Testes unitários | 33/33 ✅ |
| Testes E2E | 8/8 ✅ |
| Deploy | Automático (Vercel) |
| Último PR | #64 (modo offline) |

---

**Última atualização:** 2026-07-09
**Próxima revisão:** Sprint #6
