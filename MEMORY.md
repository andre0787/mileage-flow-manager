# UX Sprint — Memória de Planejamento

## Branch
`feat/ux-sprint` (baseada em `main`)

## Sprints

### Sprint 1 — Critical UX (Loading + Error + Debounce)
**Objetivo**: Percepção de performance e resiliência

| Item | Arquivos | Status |
|------|----------|--------|
| 1.1 DataContext: expor `isLoading` | `src/contexts/DataContext.tsx` | ✅ |
| 1.2 ErrorBoundary global | `src/components/ErrorBoundary.tsx`, `src/App.tsx` | ✅ |
| 1.3 useDebounce hook | `src/hooks/useDebounce.ts` | ✅ |
| 1.4 SkeletonLoader component | `src/components/SkeletonLoader.tsx` | ✅ |
| 1.5 Skeletons em Dashboard | `src/pages/Dashboard.tsx` | ✅ |
| 1.6 Skeletons em Entradas | `src/pages/Entradas.tsx` | ✅ |
| 1.7 Skeletons em Vendas | `src/pages/Vendas.tsx` | ✅ |
| 1.8 Skeletons em Clientes | `src/pages/Clientes.tsx` | ✅ |
| 1.9 Debounce em Entradas | `src/pages/Entradas.tsx` | ✅ |
| 1.10 Debounce em Vendas | `src/pages/Vendas.tsx` | ✅ |
| 1.11 Debounce em Clientes | `src/pages/Clientes.tsx` | ✅ |
| 1.12 Validação: build + lint + E2E | — | ✅ |

### Sprint 2 — Visual Hierarchy + Empty States
**Objetivo**: Guiar olhar do usuário do macro → micro

| Item | Arquivos | Status |
|------|----------|--------|
| 2.1 EmptyState component | `src/components/EmptyState.tsx` | ✅ |
| 2.2 Empty states em Dashboard | `src/pages/Dashboard.tsx` | ✅ |
| 2.3 Empty states em Entradas | `src/pages/Entradas.tsx` | ✅ |
| 2.4 Empty states em Vendas | `src/pages/Vendas.tsx` | ✅ |
| 2.5 Empty states em Clientes | `src/pages/Clientes.tsx` | ✅ |
| 2.6 Empty states em Contas | `src/pages/Contas.tsx` | ✅ |
| 2.7 Validação: build + lint + E2E | — | ✅ |

### Sprint 3 — Polish & Micro-interações
**Objetivo**: Feedback emocional e refinamento

| Item | Arquivos | Status |
|------|----------|--------|
| 3.1 Confetti em venda concluída | `src/pages/Vendas.tsx` | ✅ |
| 3.2 Haptic feedback em ações críticas | `src/hooks/useHaptic.ts` | ✅ |
| 3.3 JetBrains Mono + font swap (já configurado) | `index.html` | ✅ |
| 3.4 Transições de página (View Transitions API) | `src/index.css` | ✅ |
| 3.5 Confetti em criação de entrada | `src/pages/Entradas.tsx` | ✅ |
| 3.6 Validação: full test suite | — | ✅ |

### Validação Final
| Item | Status |
|------|--------|
| `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ |
| `npm run lint` | ✅ (0 errors) |
| `npx playwright test` | ✅ (13.7s) |
| Aprovação do usuário | 🔴 |
| Merge `main` + push | 🔴 |

## Notas técnicas
- Loading states: usar `isPending` do TanStack Query para skeletons iniciais
- ErrorBoundary: class component, sem dependências
- Debounce: 300ms, hook customizado com `useEffect` + `setTimeout`
- EmptyState: componente com icon, title, description, action (opcional)
- View Transitions: API nativa do browser (sem framer-motion)
- Confetti: `canvas-confetti` — import direto (40–60 particles)
- Haptic: `navigator.vibrate()` com fallback silencioso
- JetBrains Mono já incluso com `display=swap` no index.html
