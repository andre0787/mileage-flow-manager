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
- [ ] #57 — fluxo-completo: safePost() com timeout, ignora 409

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

## ✅ Code Review — PR #65

- [x] Audit geral: 15 issues encontrados (6 bugs, 5 gaps, 4 cleanup)
- [x] Bugs de integridade: transfer reversal, sort mutável, clearAccountData
- [x] Bugs de UX: navigate, as any, pontosSales placeholder
- [x] Cleanup: downloadCSV duplicado, staleTime redundante, SkeletonHero morto
- [x] Novas convenções: Invariantes Financeiras, Imutabilidade, Promessas de UI, Config Global
- [x] Checklist pré-PR adicionado ao WORKFLOW.md

## 🎯 Sprint #5 — Notificações + UX ✅

**Objetivo:** Melhorar engajamento com notificações e UX básica

### Item 1: Badge de Entradas Pendentes ✅

- [x] Badge amber no sidebar e bottom tab bar
- [x] Contagem de entradas pendentes
- [x] Visível em todas as páginas

### Item 2: Empty States com CTAs ✅

- [x] Empty states em todas as páginas com botão de ação

### Item 3: Paginação em Listas ✅

- [x] Componente Pagination reutilizável
- [x] Paginação em Entradas, Vendas, Clientes, Contas

## 🎯 Sprint #6 — Confirmações + Error Handling ✅

**Objetivo:** Tornar o app mais seguro e resiliente

**Council:** `docs/council/2026-07-10-tratamento-erro-confirmacoes-debug-log-veredito.md`

**PR:** #66

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

## 🎯 Sprint #7 — Atalhos de Teclado ✅

**Objetivo:** Navegação rápida para usuários avançados

**PR:** #67

### Item 1: Atalhos de Navegação ✅

- [x] Hook `useKeyboardShortcuts` com 7 atalhos
- [x] g, e, v, c, p, s, r para navegação
- [x] Ignora inputs e combinações de teclas

### Item 2: Dark Mode Toggle ✅

- [x] Já implementado (ThemeToggle no sidebar)

## 🎯 Sprint #8 — Proteção contra Exclusão em Cascata ✅

**Objetivo:** Alinhar frontend com restrições do database

**PR:** #68

### Item 1: Verificação de Relacionamentos ✅

- [x] OwnerSection: aviso sobre cascade delete
- [x] ProgramSection: bloqueio se houver contas
- [x] OrigemTypeSection: bloqueio se houver entradas

## 🎯 Sprint #9 — UX Improvements ✅

**Objetivo:** Melhorar experiência do usuário

**PR:** #69

### Item 1: Modal de Ajuda para Atalhos ✅

- [x] Componente `KeyboardShortcutsHelp`
- [x] Atalho '?' abre o modal

### Item 2: Toast de Sucesso em Operações ✅

- [x] Toast.success em operações destrutivas

## 🎯 Sprint #10 — i18n ✅

**Objetivo:** Suporte a múltiplos idiomas

**PR:** #70

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
  - Root cause: header right side (LanguageSelector + KeyboardShortcutsHelp + GlobalSearch) somava 280px, espaço disponível ~211px
- [x] **Nova Entrada selector:** `.first()` em 5 selectores (3 arquivos: clube, fluxo-completo, origem-tipo)
- [x] **Nova Venda selector:** `.first()` no fluxo-completo
- [x] Tests: 4 pre-existing failures corrigidos (responsivo, clube, fluxo-completo, origem-tipo)
- [x] Deploy: https://mileage-flow-manager.vercel.app

## ✅ Bugfix — registerUser Helper (PR #71, 2026-07-10)

- [x] Cria `registerUser(page)` em `tests/helpers.ts` — registro inline via Cadastre-se
- [x] 6 arquivos refatorados: auth, clientes, configuracoes, vendas, transversal, smoke
- [x] **47 testes que pulavam sem TEST_EMAIL agora rodam sempre**
- [x] **-101 linhas** (DRY)
- [x] **Zero dependência externa** — CI roda sem secrets

---

## ✅ Sprint A — Fundação de Automação (completa)

**Objetivo:** CI/CD rodando, deploy automático, scripts básicos.

### Item 1: CI Workflow ✅

- [x] `.github/workflows/ci.yml` — build + unit + E2E em todo PR
- [x] Cache npm + playwright
- [x] Upload de relatório como artifact

### Item 2: Deploy Workflow ✅

- [x] `.github/workflows/deploy.yml` — auto-deploy no merge para main
- [x] Secrets VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID configurados

### Item 3: Scripts package.json ✅

- [x] `"test:e2e": "playwright test"`
- [x] `"test:e2e:ui": "playwright test --ui"`

### Item 4: Git Flow Simplificado ✅

- [x] `git branch -d develop` (local + remoto)
- [x] `docs/GIT-WORKFLOW.md` atualizado — fluxo: branch → PR → main
- [x] `docs/WORKFLOW.md` — checklists com CI

---

## 🎯 Sprint B — Limpeza & Confiabilidade ✅

**Objetivo:** Arquivar ruído, configurar cross-harness, verificação automatizada.

### Item 1: Arquivar 29 Órfãos ✅

- [x] Mover specs antigas → `docs/archive/` (exceto spec atual)
- [x] Mover plans antigos → `docs/archive/` (exceto plan atual)
- [x] Mover 5 council verdicts sem link → `docs/archive/`
- [x] Mover artifacts obsoletos (SPRINT5-QUICKSTART, mobile-ios-notes, progress.md, task_plan.md, fluxo-relatorio.md)
- [x] Atualizar `docs/MAP.md` — refletir arquivamento

### Item 2: Cross-Harness Config ✅

- [x] Criar `.opencode/settings.json` (referência ao handoff skill)
- [x] Criar `.claude/settings.local.json` (referência ao handoff skill)

### Item 3: Script de Verificação ✅

- [x] Criar `scripts/verify-docs.mjs` — varredura automatizada de .md
- [x] Identifica órfãos, promessas quebradas, gaps

### Item 4: Atualizar Docs Núcleo ✅

- [x] `AGENTS.md` — regras refletindo CI/CD real
- [x] `docs/CONVENTIONS.md` — convenção de CI/CD
- [x] `docs/WORKFLOW.md` — checklists com CI

---

## 🎯 Sprint C — Polimento & Prevenção 🟢 Média Prioridade

**Objetivo:** Prevenção ativa, dashboard de qualidade, docs vivos.

### Item 1: Varredura Automática no CI 🟢

- [x] Workflow semanal + manual dispatch (`.github/workflows/docs-health.yml`)
- [x] Cria issue automática se detectar novos órfãos

### Item 2: Dashboard de Qualidade 🟢

- [x] Script `scripts/quality-report.mjs` que gera `QUALITY.md`
- [x] Métricas: pipeline, testes, bundle, docs

### Item 3: Relatório HTML Automático 🟢

- [x] Workflow dispatch `.github/workflows/auto-report.yml`
- [x] Gera relatório em `docs/reports/` + cria PR automático

### Item 4: HANDOFF Automatizado 🟢

- [x] Script `scripts/update-handoff.mjs`
- [x] Preserva notas manuais, atualiza branch/commits/métricas

### Item 5: Paralelismo no E2E do CI 🟢

- [x] `workers: 2` configurado no `playwright.config.ts`
- [x] `docs/WORKFLOW.md` atualizado (2 workers no CI)
- [x] Medir tempo do job antes/depois — **37% mais rápido** (7.5 min → 4.8 min)

---

## 📬 Feedback de Usuários

> Feedbacks reportados via formulário no app. Revisar no início da sessão.
> Alimentam o backlog futuro e correções de bugs.

- [x] 🐛 `#0dd222ba` teste (falso, ignorar) — 2026-07-11
- [x] 🐛 `#c8060b81` teste2 (falso, ignorar) — 2026-07-11
- [x] 🐛 `#63e7372c` Reportar no rodapé → FeedbackDialog adicionado ao BottomTabBar — 2026-07-13
- [x] 🐛 `#5fb31e12` Cache invalidation — `refetchType: 'all'` em todos os hooks — 2026-07-14
- [x] 🐛 `#8eb6b7f2` Input fora de visibilidade — removido `max-h-[60vh]` do EntryForm/TransferForm/SaleForm — 2026-07-14
- [x] 🐛 `#988925d6` Cache invalidation — mesmo fix de `#5fb31e12` — 2026-07-14
- [x] 🐛 `#791fbc14` Saldo Dashboard — consequência do cache invalidation, corrigido junto — 2026-07-14
- [x] 🐛 `#58c7817d` Cache invalidation (programas/origem_types) — mesmo fix — 2026-07-14
- [x] 🐛 `#c62b77c6` Cache invalidation (edições) — mesmo fix — 2026-07-14


## ✅ Sessão 2026-07-12 — Relatório enriquecido + Evidências

- [x] **PR #103** — Relatório HTML enriquecido + auto-geração no pre-pr
- [x] **PR #104** — Evidências visuais + rename automático no relatório
- [x] **PR #105** — Seção antes/depois padrão no relatório

> **11 seções no relatório.** Renome automático `auto-*.html` → `PR<num>-*.html`.
> Evidências sempre presentes. Acentos tratados.
> Auto-geração condicional no `npm run pre-pr`.

---

## 📌 Backlog Futuro

### Sprint #11

- [ ] Traduções no Dashboard (`useI18n()`)
- [ ] Traduções na Configurações
- [ ] Analytics de uso
- [ ] Melhorias de performance
- [ ] PWA offline avançado

### Referência

- [x] Mapa de Experiências do Usuário — `docs/MAPA-EXPERIENCIAS-USUARIO.md`
- [x] Plano de Testes — `docs/TEST-PLAN.md`
- [x] 5 novos specs E2E — auth, configuracoes, vendas, clientes, transversal

---

## 🐞 Bugs Encontrados

> Bugs descobertos durante desenvolvimento. Serve como insumo para validação do backlog futuro.
> Todo bug encontrado é registrado aqui antes ou depois de corrigido.

### Abertos
_Nenhum bug aberto no momento._

### Corrigidos

| Data | # | Descrição | Severidade | PR |
|------|---|-----------|------------|----|
| 2026-07-11 | #80 | Recorrência, distribuição de valores e edição de data | feature | #85 |
| 2026-07-11 | #79 | Seleção de conta de pontos vazia na transferência | alta | #85 |
| 2026-07-11 | #78 | Tipos de origem não aparecem na edição/exclusão | alta | #85 |
| 2026-07-11 | #77 | Registro de entrada só salva após limpar cache | alta | #85 |
| 2026-07-10 | — | queryClient.clear() causa TypeError: entries undefined | média | avulso |
| 2026-07-10 | — | Overflow Dashboard em 393px (433px > 393px) | baixa | avulso |
| 2026-07-10 | — | Entrada selector sem .first() no fluxo-completo | média | avulso |
| 2026-07-10 | — | Venda selector sem .first() no fluxo-completo | média | avulso |
| 2026-07-09 | #57 | fluxo-completo: safePost() timeout, ignora 409 | baixa | #58 |
| 2026-07-09 | #56 | origem-tipo: isClube setado ao criar tipo com recorrência | média | #58 |

> **Severidade:** `alta` = impede uso · `média` = afeta funcionalidade · `baixa` = cosmético/edge case · `feature` = melhoria solicitada

---

## 📊 Status da Produção

| Métrica | Valor |
|---------|-------|
| Bundle size | 664kB |
| Testes unitários | 45/45 ✅ |
| Testes E2E | 54/54 ✅ |
| **Total** | **99 testes** |
| CI/CD | ✅ (build + unit + E2E em todo PR) |
| Deploy | ✅ Automático via Vercel no merge |
| Último PR | #87 (#86 — Editar Vendas) |

---

## ✅ Sprint #11 — Formulários Dedicados ✅ Completa

**Objetivo:** Separar o `EntryForm` monolítico em 3 formulários dedicados.

**PR:** #88 (pendente)

### Item 1: TransferForm ✅

- [x] Criar `src/components/TransferForm.tsx`
- [x] Conta origem (pontos) + conta destino (milhas) + data + pontos transferidos
- [x] Custo calculado automaticamente (exibido, não editável)
- [x] Bonificação (%)
- [x] Compra no carrinho (pontos extras + valor total)
- [x] **Sem** tipo de origem, **sem** recorrência, **sem** clube

### Item 2: EntryForm (unificado) ✅

- [x] Criar `src/components/EntryForm.tsx` (fundiu EntryFormPontos + EntryFormMilhas)
- [x] Tipo de origem, recorrência/clube
- [x] **Sem** campos de transferência (sourceAccountId, bonusPercent, cartAmount, cartCost)

### Item 4: Atualizar Entradas.tsx ✅

- [x] Botão "Transferir" → abre `TransferForm` diretamente (sem presets)
- [x] Aba Pontos → `EntryForm type="pontos"`
- [x] Aba Milhas → `EntryForm type="milhas"`
- [x] Remover `transferInitialData` e `handleOpenTransfer`
- [x] Edit usa form correto: TransferForm se transferência, senão `EntryForm` com type apropriado

### Extra ✅

- [x] EntryForm monolítico deletado (-621 linhas líquidas)
- [x] EntryFormData movido para `types/index.ts` (compartilhado)

---

**Última atualização:** 2026-07-11
**Próxima revisão:** Sprint #11
