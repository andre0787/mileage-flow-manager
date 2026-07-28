# Design: Metodologia de Testes Contra Produção

## Contexto

O bug do dono não carregar no dropdown (PR #212) foi descoberto apenas em produção.
E2E contra localhost passava porque o Service Worker não estava ativo no browser context
fresco do Playwright. Usuários reais com SW ativo sofriam o bug.

**Lição:** Testes contra localhost não substituem testes contra produção. Infraestrutura
(SW, CDN, caching headers, build optimizations) introduz comportamentos que o dev server
não reproduz.

## Abordagem: Duas Camadas

### Camada 1 — Local (já existe)
- `npx playwright test` — E2E contra localhost:8080
- Rápido (10-15s), pega lógica de componentes e fluxos
- **Não pega**: SW caching, CDN, build chunks, Service Worker lifecycle

### Camada 2 — Produção (nova)
- `npx playwright test` com `BASE_URL` apontando para deploy real
- Pega race conditions de SW, HTTP caching, diferenças de build
- Mais lento (20-30s), usado seletivamente

## Artefatos

| Artefato | Localização | Finalidade |
|----------|-------------|------------|
| Metodologia | `docs/TESTING-PRODUCTION.md` | Documento completo com armadilhas, checklist, padrões |
| Config | `playwright.config.ts` (baseURL dinâmico) | Alterna entre localhost e produção via env var |
| Scripts | `package.json` → `test:e2e:prod`, `test:e2e:prod:smoke` | Atalhos npm |
| Convenção | `CONVENTIONS.md` → Regra #25 | Obrigatoriedade documentada |
| CI | `deploy.yml` → job `e2e-smoke-prod` | Smoke contra produção pós-deploy |

## CI — Smoke Contra Produção

Adicionar job `e2e-smoke-prod` em `.github/workflows/deploy.yml`:
- Roda APÓS o deploy ser concluído
- Usa `BASE_URL` fixo da produção
- Roda apenas testes marcados com `@smoke-prod`
- Falha → notifica (não bloqueia deploy)
- Resultado visível no PR

## Armadilhas Conhecidas

1. **SW `StaleWhileRevalidate`** — cache de 5 min esconde dados novos
2. **Playwright + SW** — SW pode não ativar rápido o suficiente no teste
3. **Vercel cold start** — primeiro request até 5s
4. **Rate limiting Supabase** — 100 req/min para anônimo

## Checklist Pré-Implementação

- [ ] docs/TESTING-PRODUCTION.md criado
- [ ] playwright.config.ts com BASE_URL dinâmico
- [ ] package.json com scripts prod
- [ ] CONVENTIONS.md — Regra #25
- [ ] deploy.yml — job e2e-smoke-prod
- [ ] Testes E2E existentes adaptados (se necessário)