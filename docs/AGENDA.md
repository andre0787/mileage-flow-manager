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

## ✅ Code Review — PR #65

- [x] Audit geral: 15 issues encontrados (6 bugs, 5 gaps, 4 cleanup)
- [x] Bugs de integridade: transfer reversal, sort mutável, clearAccountData
- [x] Bugs de UX: navigate, as any, pontosSales placeholder
- [x] Cleanup: downloadCSV duplicado, staleTime redundante, SkeletonHero morto
- [x] Novas convenções: Invariantes Financeiras, Imutabilidade, Promessas de UI, Config Global
- [x] Checklist pré-PR adicionado ao WORKFLOW.md

---

## 🎯 Sprint #5 — Notificações + UX ✅

**Objetivo:** Melhorar engajamento com notificações e UX básica

---

### Item 1: Badge de Entradas Pendentes ✅

- [x] Badge amber no sidebar e bottom tab bar
- [x] Contagem de entradas pendentes
- [x] Visível em todas as páginas

### Item 2: Empty States com CTAs ✅

- [x] Empty states em todas as páginas com botão de ação

### Item 3: Paginação em Listas ✅

- [x] Componente Pagination reutilizável
- [x] Paginação em Entradas, Vendas, Clientes, Contas

---

## 🎯 Sprint #6 — Confirmações + Error Handling ✅

**Objetivo:** Tornar o app mais seguro e resiliente
**Council:** `docs/council/2026-07-10-tratamento-erro-confirmacoes-debug-log-veredito.md`
**PR:** #66

---

### Item 1: AlertDialog em Exclusões de Config ✅

- [x] Componente reutilizável `DeleteConfirmDialog`
- [x] OwnerSection: AlertDialog antes de excluir
- [x] ProgramSection: AlertDialog antes de excluir
- [x] OrigemTypeSection: AlertDialog antes de excluir

### Item 2: Toast Feedback em Mutations ✅

- [x] Toast.error em todas as mutations
- [x] Mensagens amigáveis em pt-BR

### Item 3: Debug Log Estruturado ✅

- [x] `src/lib/logger.ts` com `logError()` e `logDestructiveOp()`
- [x] Storage: localStorage (dev)
- [x] Flag: `VITE_ENABLE_DEBUG_LOG=true`

### Item 4: Mensagens de Erro Amigáveis no Login ✅

- [x] Mapeamento de erros Supabase para pt-BR
- [x] Log da mensagem técnica original

---

## 🎯 Sprint #7 — Atalhos de Teclado ✅

**Objetivo:** Navegação rápida para usuários avançados
**PR:** #67

---

### Item 1: Atalhos de Navegação ✅

- [x] Hook `useKeyboardShortcuts` com 7 atalhos
- [x] g, e, v, c, p, s, r para navegação
- [x] Ignora inputs e combinações de teclas

### Item 2: Dark Mode Toggle ✅

- [x] Já implementado (ThemeToggle no sidebar)

---

## 🎯 Sprint #8 — Proteção contra Exclusão em Cascata ✅

**Objetivo:** Alinhar frontend com restrições do database
**PR:** #68

---

### Item 1: Verificação de Relacionamentos ✅

- [x] OwnerSection: aviso sobre cascade delete
- [x] ProgramSection: bloqueio se houver contas
- [x] OrigemTypeSection: bloqueio se houver entradas

---

## 🎯 Sprint #9 — UX Improvements ✅

**Objetivo:** Melhorar experiência do usuário
**PR:** #69

---

### Item 1: Modal de Ajuda para Atalhos ✅

- [x] Componente `KeyboardShortcutsHelp`
- [x] Atalho '?' abre o modal

### Item 2: Toast de Sucesso em Operações ✅

- [x] Toast.success em operações destrutivas

---

## 🎯 Sprint #10 — i18n ✅

**Objetivo:** Suporte a múltiplos idiomas
**PR:** #70

---

### Item 1: Sistema de Internacionalização ✅

- [x] `src/lib/i18n.ts` com 100+ chaves de tradução
- [x] `src/contexts/I18nContext.tsx` com React context
- [x] `src/components/LanguageSelector.tsx` com toggle
- [x] Suporte a pt-BR (padrão) e en-US
- [x] Persistência no localStorage

### Item 2: Aplicar Traduções no Login ✅

- [x] Mensagens de erro mapeadas para chaves
- [x] Labels e textos traduzidos

---

## ✅ Bugfix — Limpar Cache ErrorBoundary (2026-07-10)

- [x] `DataContext.tsx`: remove `queryClient.clear()` antes de `window.location.reload()`
- [x] `Configuracoes.tsx`: adiciona `entries` na desestruturação de `useData()`
- [x] **Dois bugs encadeados:** queryClient.clear() causava re-render, mas o verdadeiro erro era `entries` undefined → TypeError

## ✅ Bugfix — Overflow Mobile + Selectors (2026-07-10)

- [x] **Overflow Dashboard (433px em 393px):** header `px-6` → `px-4 md:px-6`; GlobalSearch `w-48` → `w-32` em mobile
  - Root cause: header right section (LanguageSelector + KeyboardShortcutsHelp + GlobalSearch) somava 280px, espaço disponível ~211px
- [x] **Nova Entrada selector:** `.first()` em 5 selectores (3 arquivos: clube, fluxo-completo, origem-tipo)
- [x] **Nova Venda selector:** `.first()` no fluxo-completo
- [x] Tests: 4 pre-existing failures corrigidos (responsivo, clube, fluxo-completo, origem-tipo)
- [x] Deploy: https://mileage-flow-manager.vercel.app

---

## 📌 Backlog Futuro

### Sprint #11 (Futura)
- [ ] Traduções no Dashboard
- [ ] Traduções na Configurações
- [ ] Analytics de uso
- [ ] Melhorias de performance
- [ ] PWA offline avançado
- [ ] Adicionar TEST_EMAIL/TEST_PASSWORD no CI (env vars no GitHub Actions)
- [ ] Corrigir strict mode seletor "Nova Entrada" (3 botões) ✅
- [ ] Corrigir overflow mobile (< 640px) ✅

### Referência
- [x] Mapa de Experiências do Usuário — `docs/MAPA-EXPERIENCIAS-USUARIO.md`
- [x] Plano de Testes — `docs/TEST-PLAN.md`
- [x] 5 novos specs E2E — auth, configuracoes, vendas, clientes, transversal

---

## 📊 Status da Produção

| Métrica | Valor |
|---------|-------|
| Bundle size | 664kB |
| Testes unitários | 40/40 ✅ |
| Testes E2E | 63 testes (14 specs) ✅ |
| **Total** | **103 testes** |
| Deploy | Automático (Vercel) |
| Último PR | #70 (i18n) |
| Último bugfix | Limpar Cache — ErrorBoundary falso |

---

**Última atualização:** 2026-07-10
**Próxima revisão:** Sprint #11
