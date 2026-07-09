# HANDOFF — Sprint #4 Em Andamento

## Status: Sprint #4 🔄 PR #55 aberta

### Último trabalho: CSV export + fixes

PR #55 (`develop` → `main`) aberta.

### Branch atual

`develop` — PR #55 pendente

### Entregues nesta sprint

| Tarefa | Status |
|--------|--------|
| CSV export em Vendas.tsx | ✅ Feito |
| Playwright retries | ✅ Feito |
| Bug sync origem-tipo | ✅ Identificado |

### Status dos testes

- ✅ 33/33 testes unitários (vitest)
- ✅ 4/4 E2E tests (carrinho, clube, debug, relatorio)
- ⚠️ 2 tests com issues pré-existentes:
  - `fluxo-completo`: Supabase API 409 (dados duplicados)
  - `origem-tipo`: bug de sincronização (recorrência não ativava ao criar tipo)

### Pendências

- [ ] Merge PR #55
- [ ] Corrigir teste origem-tipo (bug real: `isClube` não setado ao criar tipo)
- [ ] Investigar fluxo-completo 409

### Configurações importantes

- `playwright.config.ts`: `retries: 1`, `testMatch: "*.spec.ts"`
- `tsconfig.app.json`: `strictNullChecks: true`
- `.prettierrc`: semi, singleQuote: false, trailingComma: all, printWidth: 100
