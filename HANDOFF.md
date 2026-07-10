# HANDOFF — Sprint #6 Completa + Code Review + Novas Convenções

## Status: ✅ Code Review + Council + Hotfix completo (tela preta resolvida)

### Último trabalho: 2026-07-10

- **Code Review geral** do projeto — 15 issues encontrados, 14 corrigidos
- **Council** rodado para definir novas convenções
- **Novas convenções** adicionadas ao CONVENTIONS.md
- **Checklist pré-PR** adicionado ao WORKFLOW.md
- **Testes de invariantes** criados (5 novos testes)

### Hotfix (após PR #65)

- **Fix:** Tela preta — adicionado ErrorBoundary no root (main.tsx)
- **Fix:** Restaurado `as any` com comment ponytail (Supabase Insert type mismatch)
- **Fix:** Force reload on version change (previne SW cache stale)
- **Fix:** Supabase client não crasha se env vars faltam
- **Fix:** Remove SkeletonHero import (deletado mas importado no Dashboard)
- **Fix:** ROOT CAUSE — DataProvider movido acima de AppSidebar/BottomTabBar
  - AppSidebar e BottomTabBar usavam useData() mas estavam FORA do DataProvider
  - Causava crash silencioso → tela preta
- **Docs:** Hierarquia de Providers adicionada ao CONVENTIONS.md e WORKFLOW.md
- **Test:** Smoke tests para prevenir tela preta futuramente

### Mudanças no PR #65

**Código:**
- Fix: transfer reversal usa custo proporcional
- Fix: .sort() não muta arrays memoizados
- Fix: clearAccountData preserva Transferência
- Fix: useNavigate() no Dashboard
- Fix: removed as any do DataContext
- Refactor: downloadCSV extraído para lib/utils.ts
- Chore: staleTime redundante removido de 7 hooks
- Chore: SkeletonHero deletado

**Documentação:**
- CONVENTIONS.md: 4 novas seções (Invariantes Financeiras, Imutabilidade, Promessas de UI, Config Global)
- WORKFLOW.md: Checklist pré-PR obrigatório (5 seções)
- Council verdict: docs/council/2026-07-10-novas-convencoes-code-review-veredito.md

**Testes:**
- tests/unit/invariants.test.ts: 5 testes de integridade financeira
- Total: 40/40 ✅

### Branch atual

`chore/code-review-cleanup` → PR #65 para `main`

### Build & Test

- TypeScript: clean
- Vite build: ✅ (646kB)
- Testes: 40/40 ✅

### Próximos passos

1. Merge PR #65
2. Sprint #7: Multi-idioma (i18n), Dark mode toggle, Atalhos de teclado
