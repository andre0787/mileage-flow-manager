# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-28 02:29 BRT
> Sessão: PR #213 + #214 — Metodologia de Testes Contra Produção

## 🏗️ Projeto

> ⏰ Snapshot de 2026-07-28
> **Stack:** React + Vite + Supabase + Tailwind | pt-BR
> **Branch:** feat/ci-preview-smoke
> **PRs abertos:** nenhum

## 🎯 Sessão 3 — Metodologia de Testes Contra Produção

**Objetivo:** Criar metodologia de testes E2E contra produção (Regra #25) com:
- docs/TESTING-PRODUCTION.md — documentação completa
- playwright.config.ts com BASE_URL dinâmico
- Scripts npm: test:e2e:prod, test:e2e:prod:smoke, etc.
- Regra #25 em CONVENTIONS.md + validação automática
- CI e2e-smoke-preview em todo PR (preview Vercel)
- CI e2e-smoke-prod pós-deploy (produção real)
- Tags @smoke-prod nos testes críticos
**Sessão 1 (PR #211)**: Adicionar `setQueryData` em todas mutations de owners, programs, accounts.

**Sessão 2 (PR #212)**: Corrigir bug de dono não carregar automaticamente — **causa raiz**: SW cacheava respostas Supabase REST com `StaleWhileRevalidate` (5 min), e o `invalidateQueries` recebia dado obsoleto que sobrescrevia o `setQueryData`.

## ✅ Done
- [x] **PR #213** merged ✅ — infraestrutura base (docs, config, scripts, CI)
- [x] **PR #214** merged ✅ — CI automático contra preview Vercel em todo PR
- [x] **Produção**: https://mileage-flow-manager.vercel.app/ ✅ (200)

## 📋 Próxima Sessão

1. **Monitorar e2e-smoke-preview** no CI — verificar se Vercel preview URL é encontrada (pode precisar de ajuste no polling)
2. **Usar nova metodologia** nas próximas features/bugs — smoke tests contra preview/produção são automáticos
3. **Deletar branches**: fix/optimistic-cache-all-mutations, fix/sw-cache-supabase-api, feat/testing-production-methodology, feat/ci-preview-smoke
4. **Explorar idea pendente** em IDEIAS.md: "permitir criar dono e programa juntos"

## 🔑 Key Decisions
- **`setQueryData` no `onSuccess` sobre `mutateAsync`**: Mesmo padrão do PR #209 — atualizar cache síncronamente antes do refetch assíncrono do `invalidateQueries`, evitando race condition com Radix UI Select
- **Extrair `userId` no escopo do hook**: `const userId = user?.id ?? null` no corpo do hook, não no `onSuccess`, para evitar closure stale e manter consistência com `useAddOwnerMutation` e `useAddProgramMutation`
- **Guard `if (userId)`**: Impede `setQueryData` com key undefined antes do usuário estar carregado
- **E2E com `page.locator('tr')` em vez de `getByRole('row')`**: O seletor `getByRole('row')` não encontrava as linhas da tabela no teste de deleção; `page.locator('tr')` resolveu
- **Prettier multi-line → single-line**: CI falhou por formatação ternários multi-line; Prettier colapsou para single-line, corrigido e CI passou

## 📋 Next Steps
1. ✅ Bug resolvido — usuário confirmou que funciona
2. **Deletar branches**: `git branch -d fix/optimistic-cache-all-mutations fix/sw-cache-supabase-api`
3. **Explorar nova metodologia de testes**: Criar skill/test-runner ou docs/TESTING-PRODUCTION.md documentando a abordagem de testes contra produção com Playwright (detalhes na seção abaixo)
4. **Aplicar metodologia em próximas features/bugs**: Testes E2E contra deploy real devem fazer parte do workflow standard, não apenas con1**: https://github.com/andre0787/mileage-flow-manager/pull/211 (merged)
- **PR #212**: https://github.com/andre0787/mileage-flow-manager/pull/212 (merged)
- **Arquivos alterados**: `src/hooks/useDatabase/accounts.ts` (+3 mutations com setQueryData), `owners.ts` (+2 mutations), `programs.ts` (+2 mutations), `tests/delete-owner-program.spec.ts` (novo), `vite.config.ts` (removeu runtimeCaching Supabase)
- **E2E tests**: 3/3 passam (create-owner-program-inline + delete-owner-program + create-owner-program-inline contra Vercel produção)
- **Token GH**: `GH_TOKEN` em `.env` para automação
- **Bug original**: Dono criado inline não carregava automaticamente — **causa raiz real**: SW cacheava Supabase REST com `StaleWhileRevalidate` (5 min). `setQueryData` adicionava o dono, mas o refetch do `invalidateQueries` recebia resposta cacheada SEM o dono, sobrescrevendo o cache do React Query
- **Complementa PR #209**: PR #209 adicionou `setQueryData` apenas em `useAddOwnerMutation`; PR #211 completou as mutations de update/delete; PR #212 removeu o SW cache que anulava o `setQueryData`

## 🧠 Critical Context
- **Branch atual**: `fix/optimistic-cache-all-mutations` (pode deletar após merge)
- **PR #211**: https://github.com/andre0787/mileage-flow-manager/pull/211 (merged)
- **Arquivos alterados**: `src/hooks/useDatabase/accounts.ts` (+3 mutations com setQueryData), `owners.ts` (+2 mutations), `programs.ts` (+2 mutations), `tests/delete-owner-program.spec.ts` (novo)
- **E2E tests**: 2/2 passam contra Supabase real
- **Token GH**: `GH_TOKEN` em `.env` para automação
- **Relatório**: `docs/reports/2026-07-27/PR211-2026-07-27-optimistic-cache-all-mutations.html`
- **Bug original**: Dono criado inline não carregava automaticamente no Account Drawer (PR #209 + PR #211 resolvem)
- **Complementa PR #209**: PR #209 adicionou `setQueryData` apenas em `useAddOwnerMutation`; PR #211 completa as mutations de update e delete em owners, programs e accounts

## Estado Atual

Em andamento: PR #213 — metodologia de testes contra produção.
Sessão anterior (PR #212) corrigiu bug do SW cache.

## Próxima Sessão

1. Mergear PR #213
2. Usar nova metodologia nas próximas features/bugs
3. Deletar branches: fix/optimistic-cache-all-mutations, fix/sw-cache-supabase-api


## 🎯 Sessão Atual
**Categoria:** docs
**Objetivo:** verifica output
**Status:** in_progress
**Branch:** `feat/testing-production-methodology`
**Último commit:** c632d4b — feat: implementa metodologia de testes contra produção (Regra #25)
**Docs carregados:** AGENTS.md


---
_Atualizado manualmente — Sessão encerrada_

## 🔬 Proposta: Nova Metodologia de Testes (para próxima sessão)

### Contexto
O bug do dono não carregar só foi descoberto porque o usuário testou em produção. E2E contra localhost passava porque:
- Playwright cria browser context fresco → SW não estava ativo no primeiro fetch
- Sem cache populado → `invalidateQueries` sempre recebia dados frescos
- Usuários reais com SW ativo sofriam o bug

### Lição Aprendida
**Testes contra localhost não substituem testes contra produção.** Infraestrutura (SW, CDN, caching headers, build optimizations) introduz comportamentos que não existem no dev server.

### Metodologia Proposta: "Testes em Duas Camadas"

#### Camada 1: Local (já existe)
- `npm run test` — unitários + integração
- `npx playwright test` — E2E contra localhost:5173 (rápido, 10-15s)
- **O que pega**: Lógica de componentes, validação de formulários, fluxo de dados
- **O que NÃO pega**: SW caching, CDN, build chunks, Service Worker lifecycle

#### Camada 2: Contra Produção (nova)
- `npx playwright test --url=https://meuapp.vercel.app` — E2E contra deploy real
- **O que pega**: SW caching race conditions, HTTP caching, build bundle differences, Vercel edge/function behavior
- **Quando usar**:
  - Toda feature que envolve criação/alteração de dados (caching race)
  - Todo bug reportado em produção (reprodução fiel)
  - Pré-merge opcional (mais lento ~20-30s, mas mais confiável)

### Padrão de Teste Contra Produção

```typescript
// 1. Usar BASE_URL do ambiente ou default para produção
const BASE_URL = process.env.BASE_URL || "https://mileage-flow-manager.vercel.app";

// 2. Navegar para produção
await page.goto(BASE_URL + "/login");

// 3. Criar usuário real via Supabase (ou usar credenciais fixas de teste)
// O teste interage com o app normalmente — sem mocks

// 4. Asserções ESPECÍFICAS
// Não só "elemento existe", mas "nome do dono aparece onde deve"
await expect(page.locator("table").getByText("Dono Criado")).toBeVisible();

// 5. Navegar para outras páginas para verificar persistência
await page.goto(BASE_URL + "/configuracoes");
await expect(page.getByText("Dono Criado")).toBeVisible();
```

### Armadilhas Conhecidas (documentar no futuro)
1. **SW caching**: `StaleWhileRevalidate` com `runtimeCaching` — cache de 5 min pode esconder dados novos
2. **Playwright não ativa SW**: Em alguns casos o SW não registra/ativa rápido o suficiente no teste
3. **Vercel cold start**: Primeiro request pode ser lento (até 5s)
4. **Rate limiting**: Muitos testes contra produção podem atingir limites do Supabase (anônimo: 100 req/min)

### Como Implementar
1. Criar `docs/TESTING-PRODUCTION.md` com a metodologia detalhada
2. Adicionar script npm: `npm run test:e2e:prod` que roda testes com `BASE_URL` setado
3. Adicionar flag no Playwright config para alternar entre localhost e produção
4. Adicionar convenção em `CONVENTIONS.md` — Regra #25: "Testes Contra Produção"
5. (Opcional) Adicionar stage no CI que roda smoke tests contra preview deployment do Vercel