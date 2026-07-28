# Testes Contra Produção — Metodologia

> **Motivação:** O bug do dono não carregar no dropdown (PR #212) só foi descoberto em
> produção. E2E contra localhost passava porque o Service Worker não estava ativo no
> browser context fresco do Playwright. Usuários reais com SW ativo sofriam o bug.
>
> **Lição:** Testes contra localhost **não substituem** testes contra produção.

## Abordagem em Duas Camadas

| Camada | Comando | O que pega | Duração | Quando usar |
|--------|---------|------------|---------|-------------|
| **Local** | `npx playwright test` | Lógica de componentes, formulários, fluxo de dados, validação | 10-15s | Toda PR (já existe no CI) |
| **Produção** | `npm run test:e2e:prod` | SW caching, CDN, build chunks, Vercel edge/function, HTTP caching | 20-30s | Feature com criação/alteração de dados, bug reportado em produção, pré-merge opcional |

## Como Usar

```bash
# Local (rápido)
npx playwright test

# Contra produção
npm run test:e2e:prod

# Teste específico contra produção
npm run test:e2e:prod -- --grep "Criação inline"

# Smoke tests contra produção (mais rápido, cobre o essencial)
npm run test:e2e:prod -- --grep "Smoke"
```

## Quando Testar Contra Produção

### ⚠️ Obrigatório

1. **Feature que cria/altera dados** (criação inline de dono, programa, conta)
   - Risco: cache do SW pode esconder o novo registro do `invalidateQueries`
2. **Bug reportado em produção** — reprodução fiel
3. **Mudanças no PWA/SW config** (`vite.config.ts`, `workbox`, `runtimeCaching`)

### ✅ Recomendado

1. **Pré-merge opcional** — roda contra preview Vercel (mais confiável)
2. **Toda feature de UI com Select/Drawer** — Radix UI + portal pode ter comportamento diferente no deploy

### ❌ Não necessário

1. **Mudanças puramente visuais** (CSS, layout)
2. **Refatoração sem efeito colateral** (extrair função, renomear variável)
3. **Docs/markdown** — a menos que a feature seja testada via doc

## Padrão para Test Files

Todo teste E2E DEVE usar `BASE_URL` do ambiente. O `playwright.config.ts` já lê
`process.env.BASE_URL` com fallback para `http://localhost:8080`.

```typescript
// ✅ Correto — usa BASE_URL da config
await page.goto("/login");  // resolve para BASE_URL/login

// ✅ Correto — navegação explícita para outras páginas
await page.goto("/configuracoes");
```

### Smoke Prod Tag

Testes que devem rodar no CI contra produção DEVEM ter a tag `@smoke-prod`:

```typescript
test("Smoke Tests — Tela Preta @smoke-prod", ...)
```

## CI — Smoke Contra Produção

### Pipeline de PR (`.github/workflows/ci.yml`)

O job `e2e-smoke-preview` roda automaticamente após `check-pr`:
1. Aguarda deploy preview do Vercel (até 6 min)
2. Obtém a URL do preview via Vercel API
3. Roda `npx playwright test --grep '@smoke-prod'` contra o preview
4. `continue-on-error: true` — não bloqueia o merge, apenas informa
5. Upload do report como artifact

### Pipeline de Deploy (`.github/workflows/deploy.yml`)

O job `e2e-smoke-prod` roda após deploy na Vercel:

1. Deploy na Vercel → success
2. Job `e2e-smoke-prod` inicia
3. Roda `npm run test:e2e:prod:smoke` (apenas testes `@smoke-prod`)
4. Resultado visível no GitHub — falha NÃO bloqueia o deploy (não rola back), mas notifica

## Armadilhas Conhecidas

### 1. SW `StaleWhileRevalidate` (cache de 5 min)

O `runtimeCaching` no `vite-plugin-pwa` cacheia respostas Supabase REST por 5 minutos.
Se o teste criar um registro e imediatamente buscar a lista, o SW pode servir a resposta
cacheada SEM o novo registro.

**Solução:** Se o bug for exatamente esse (já corrigido no PR #212), garantir que o cache
está removido. Caso contrário, esperar a expiração ou usar `--disable-service-worker`.

### 2. Playwright não ativa SW

Em browser context fresco, o SW pode não registrar/ativar rápido o suficiente. Isso
significa que o primeiro fetch não passa pelo SW, e o cache do SW fica vazio.

**Consequência:** Testes contra produção podem NÃO reproduzir o bug de cache se o SW não
estiver ativo. Isso é uma limitação conhecida.

**Mitigação:** Navegar para uma página, esperar o SW ativar, depois começar o teste:

```typescript
await page.goto("/");
await page.waitForTimeout(2000);  // aguarda SW registrar e ativar
// Agora o SW está ativo e cacheando
```

### 3. Vercel cold start

O primeiro request após um período de inatividade pode levar até 5s (cold start das
Serverless Functions).

**Mitigação:** Aumentar `timeout` para navegação (já configurado em `playwright.config.ts`
com `timeout: 15000`).

### 4. Rate limiting do Supabase

Supabase anônimo tem limite de 100 req/min. Muitos testes rodando em paralelo podem
atingir esse limite.

**Mitigação:** Rodar `e2e-smoke-prod` com 1 worker (`--workers=1`) e apenas os testes
essenciais (tag `@smoke-prod`).

### 5. Dados de teste acumulados

Usuários criados nos testes acumulam dados no Supabase.

**Mitigação:** Usar emails com timestamp (`test_${Date.now()}@teste.com`) e limpeza
periódica dos dados de teste.

## Checklist para Nova Feature

- [ ] Teste E2E local passa (`npx playwright test`)
- [ ] Teste E2E contra produção passa (`npm run test:e2e:prod -- --grep "nome-da-feature"`)
- [ ] Se aplicável: teste marcado com `@smoke-prod` para rodar no CI pós-deploy