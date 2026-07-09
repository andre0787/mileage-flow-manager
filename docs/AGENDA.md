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

### Item 1: Notificações Push para Confirmação de Entradas

**Prioridade:** 🔴 Alta
**Estimativa:** 3-5 dias
**Arquivos impactados:** `src/hooks/useDatabase.ts`, `src/pages/Entradas.tsx`, `src/components/`

**Descrição:**
Quando uma entrada é criada mas não confirmada, o usuário deve receber uma notificação push no navegador para lembrar de confirmar.

**Critérios de Aceite:**
- [ ] Service worker registrado para push notifications
- [ ] Usuário pode ativar/desativar notificações nas configurações
- [ ] Notificação enviada quando entrada fica pendente por > 24h
- [ ] Notificação aparece mesmo com app em background
- [ ] Click na notificação redireciona para página de entradas
- [ ] Tratamento de permissão negada (mostrar aviso)
- [ ] Funciona em Chrome, Firefox, Safari (desktop)
- [ ] Testes unitários para lógica de notificação
- [ ] Teste E2E para fluxo de ativação

**Abordagem Técnica:**
1. Registrar service worker em `public/sw.js`
2. Criar hook `useNotifications.ts` para gerenciar permissão
3. Adicionar toggle em Configurações
4. Criar lógica de verificação de entradas pendentes
5. Usar Push API + Notification API

**Riscos:**
- Usuários podem negar permissão (mitigação: explicar benefício)
- Safari tem limitações com push (mitigação: fallback para in-app)

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Fluxo 34 (Notificações)

---

### Item 2: Melhorar Empty States com CTAs

**Prioridade:** 🟡 Média
**Estimativa:** 1-2 dias
**Arquivos impactados:** `src/pages/Entradas.tsx`, `src/pages/Vendas.tsx`, `src/pages/Clientes.tsx`, `src/pages/Contas.tsx`

**Descrição:**
Quando não há dados para exibir, mostrar estado vazio com Call-to-Action (CTA) para criar o primeiro item.

**Critérios de Aceite:**
- [ ] Empty state em Entradas: "Nenhuma entrada encontrada" + botão "Criar primeira entrada"
- [ ] Empty state em Vendas: "Nenhuma venda encontrada" + botão "Registrar primeira venda"
- [ ] Empty state em Clientes: "Nenhum cliente cadastrado" + botão "Adicionar cliente"
- [ ] Empty state em Contas: "Nenhuma conta criada" + botão "Criar conta"
- [ ] Empty states seguem design system (ícone + título + descrição + botão)
- [ ] Botão funciona e abre modal/drawer correto
- [ ] Testes E2E para cada empty state

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
**Arquivos impactados:** `src/pages/Entradas.tsx`, `src/pages/Vendas.tsx`, `src/pages/Clientes.tsx`, `src/pages/Contas.tsx`

**Descrição:**
Listas com muitos itens devem ter paginação para melhorar performance e UX.

**Critérios de Aceite:**
- [ ] Paginação em Entradas (20 itens por página)
- [ ] Paginação em Vendas (20 itens por página)
- [ ] Paginação em Clientes (20 itens por página)
- [ ] Paginação em Contas (20 itens por página)
- [ ] Botões: Anterior, Próximo, números de página
- [ ] Indicador: "Mostrando 1-20 de 45 entradas"
- [ ] Paginação no lado do cliente (dados já carregados)
- [ ] Funciona com filtros aplicados
- [ ] Testes E2E para navegação entre páginas

**Abordagem Técnica:**
1. Criar componente `Pagination.tsx` reutilizável
2. Usar shadcn/ui se disponível, senão criar simples
3. Estado local: `currentPage`, `itemsPerPage`
4. Lógica: `slice((page-1) * perPage, page * perPage)`

**Referência:** `docs/MAPA-EXPERIENCIAS-USUARIO.md` → Gaps #18-19

---

## 📌 Backlog Futuro

### Sprint #6 (Futura)
- [ ] Modo offline com sincronização
- [ ] Exportação PDF dos relatórios
- [ ] Busca global

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
| Bundle size | 637kB (era 1MB) |
| Testes unitários | 33/33 ✅ |
| Testes E2E | 8/8 ✅ |
| Deploy | Automático (Vercel) |
| Último PR | #61 (code splitting) |

---

**Última atualização:** 2026-07-09
**Próxima revisão:** Início da Sprint #5
