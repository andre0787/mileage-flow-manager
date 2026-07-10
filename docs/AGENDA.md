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

## 🎯 Sprint #6 — Confirmações + Error Handling

**Objetivo:** Tornar o app mais seguro e resiliente com confirmações em operações destrutivas e tratamento de erro estruturado
**Estimativa:** 1 semana
**Dependências:** Sprint #5 completa
**Council:** `docs/council/2026-07-10-tratamento-erro-confirmacoes-debug-log-veredito.md`

---

### Item 1: AlertDialog em Exclusões de Config ✅

**Prioridade:** 🔴 Alta
**Estimativa:** 2-3h
**Arquivos impactados:** `src/components/OwnerSection.tsx`, `src/components/ProgramSection.tsx`, `src/components/OrigemTypeSection.tsx`, `src/components/DeleteConfirmDialog.tsx` (novo)

**Critérios de Aceite:**
- [x] Componente reutilizável `DeleteConfirmDialog` criado
- [x] OwnerSection: AlertDialog antes de excluir dono
- [x] ProgramSection: AlertDialog antes de excluir programa
- [x] OrigemTypeSection: AlertDialog antes de excluir tipo de operação
- [x] Mensagens claras com nome do item sendo excluído
- [x] Botão de confirmação em vermelho (destructive)
- [x] Build limpo sem erros TypeScript

**Notas:**
- Padrão copiado do DeleteEntryDialog existente
- Componente genérico para reuso futuro
- **Council:** prioridade #1 identificada por todos os 5 advisors

---

### Item 2: Toast Feedback em Mutations ✅

**Prioridade:** 🟡 Média
**Estimativa:** 1-2h
**Arquivos impactados:** `src/hooks/useDatabase/*.ts`

**Critérios de Aceite:**
- [x] onError com `toast.error()` em mutations que falham
- [x] Mensagens amigáveis (não técnicas do Supabase)
- [x] Usar Sonner (padrão do projeto)

**Notas:**
- TanStack Query já suporta onError/onSuccess
- Gap identificado: mutations falham silenciosamente

---

### Item 3: Debug Log Estruturado (Pendente)

**Prioridade:** 🟡 Média
**Estimativa:** 3-4h
**Arquivos impactados:** `src/lib/logger.ts` (novo), `src/hooks/useDatabase/*.ts`

**Critérios de Aceite:**
- [ ] `src/lib/logger.ts` com `logError()` e `logDestructiveOp()`
- [ ] Storage: localStorage (dev) / Supabase audit_logs (prod)
- [ ] Flag: `VITE_ENABLE_DEBUG_LOG=true` em .env
- [ ] Log de erros de mutation
- [ ] Log de operações destrutivas (delete, clear)
- [ ] Timestamp, user_id, contexto em cada log

**Notas:**
- Analytics é YAGNI — começar com logs básicos
- Toggle por variável de ambiente
- Sobrevive a refresh (localStorage)

---

### Item 4: Mensagens de Erro Amigáveis no Login (Pendente)

**Prioridade:** 🟢 Baixa
**Estimativa:** 30min
**Arquivos impactados:** `src/pages/Login.tsx`

**Critérios de Aceite:**
- [ ] Mapear erros Supabase para mensagens amigáveis
- [ ] "Credenciais inválidas" ao invés de mensagem técnica
- [ ] Log da mensagem técnica original para debug

**Notas:**
- Gap de UX identificado pelo Outsider no council
- Usuário final não deve ver erros técnicos

---

## 📌 Backlog Futuro

### Sprint #7 (Futura)
- [ ] Multi-idioma (i18n)
- [ ] Dark mode toggle
- [ ] Atalhos de teclado

### Sprint #8 (Futura)
- [ ] Verificar cascata de exclusão Owner → Contas
- [ ] Verificar cascata de exclusão Program → Entradas
- [ ] Analytics de uso (se volume justificar)

### Referência
- [x] Mapa de Experiências do Usuário — `docs/MAPA-EXPERIENCIAS-USUARIO.md`

---

## 📊 Status da Produção

| Métrica | Valor |
|---------|-------|
| Bundle size | 648kB |
| Testes unitários | 35/35 ✅ |
| Testes E2E | 8/8 ✅ |
| Deploy | Automático (Vercel) |
| Último PR | #65 (code review) + hotfix |

---

**Última atualização:** 2026-07-10
**Próxima revisão:** Sprint #7
