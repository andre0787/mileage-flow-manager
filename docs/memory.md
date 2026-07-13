# 🧠 MEMORY — MilesControl

> Memória histórica do projeto: sessões, post-mortems, decisões.
> Para docs ativos veja `docs/MAP.md` — este arquivo NÃO duplica o que já existe lá.

---

## UX Sprint — Histórico

### Sprint 1 — Critical UX (Loading + Error + Debounce)
**Commit**: `0435e54` → merged em `916a0cb`
- `DataContext`: expor `isLoading` ✅ | `ErrorBoundary` global ✅
- `useDebounce` hook ✅ | `SkeletonLoader` (4 variantes) ✅
- Skeletons em todas as páginas ✅

### Sprint 2 — Empty States
**Commit**: `93a1bde` → merged em `916a0cb`
- `EmptyState` component com icon/title/description/action ✅
- Aplicado em Dashboard, Entradas, Vendas, Clientes, Contas ✅

### Sprint 3 — Polish & Micro-interações
**Commit**: `e2a40a8` → merged em `916a0cb`
- `canvas-confetti` em criação entrada + venda ≥ R$200 ✅
- `useHaptic` (4 padrões: light/medium/heavy/success) ✅
- View Transitions API: fade 200ms/350ms ✅ | `docs/memory.md` criado ✅

### Post-mortem — Runtime Error no Deploy
**Sintoma**: Dashboard e Vendas quebravam: "EmptyState is not defined".
**Causa**: `Dashboard.tsx` e `Vendas.tsx` usavam `<EmptyState />` sem import.
`tsconfig` com `noUnusedLocals: false` não acusou — só runtime revelou.
**Solução**: adicionar imports. Commit `1bc6258`.
**Proteção**: ativar `noUnusedLocals: true` no tsconfig.

### Commits produção (pós-Sprint 3)
```
73a59f6 docs: finaliza Sprint #6
5cb19c5 docs: atualiza HANDOFF e AGENDA Sprint #6
8e9575a docs: relatório modo offline
08cc837 feat: modo offline minimal (SW + banner + botões)
22de6b3 docs: atualiza HANDOFF/AGENDA PR #63
a7dbc95 docs: relatório busca global
71dbee2 fix: light mode moderno (fundo 92%, cards 96%)
852212c feat: redesign visual completo
```

---

## Componentes Próprios (fora shadcn/ui)

| Componente | Arquivo | Propósito |
|-----------|---------|-----------|
| `EmptyState` | `components/EmptyState.tsx` | Estado vazio com CTA |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Captura erros com retry |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | 4 variantes skeleton |
| `DeleteEntryDialog` | `components/DeleteEntryDialog.tsx` | Exclusão em cascata |
| `AltitudeBar` | `components/AltitudeBar.tsx` | Barra animada hero |
| `useDebounce` | `hooks/useDebounce.ts` | 300ms |
| `useHaptic` | `hooks/useHaptic.ts` | Vibração tátil mobile |

---

## Convenção de Recorrência (estabelecida Ago 2026)

- Todo `origem_type` tem `description.hasRecurrence` (nunca `undefined`)
- `recurrenceEnd`/`recurrenceInterval` centralizado em `buildMonthlyRecurrence()` em `lib/origemTypes.ts`
- Helpers: `serializeOrigemTypeDescription`, `parseOrigemTypeDescription`, `buildMonthlyRecurrence`
- Migration `20260705010000` preenche `hasRecurrence` em tipos existentes
- Testes: `tests/origem-tipo.spec.ts`

---

## Sessões Recentes (legado — config de agente)

### Extensões pi (MCPs)
- `mcp-supabase/`: supabase_query, supabase_select, supabase_auth_list (deps: `@supabase/supabase-js`)
- `mcp-github/`: github_pr_list, github_create_pr, github_workflow_status (deps: `octokit`)

### Ponytail
Instalado via `pi install npm:@dietrichgebert/ponytail@4.8.4`
- 6 skills: ponytail, ponytail-audit, ponytail-debt, ponytail-gain, ponytail-help, ponytail-review

### Skills Instaladas (Jul 2026): 95 total
- 16 Anthropic (webapp-testing, frontend-design, doc-coauthoring, pdf/docx/xlsx, etc.)
- 67 design (bento, modern, shadcn, corporate, neobrutalism, glassmorphism, etc.)
- 6 planning-with-files + 6 ponytail

### Prompt Templates
Global: `/commit`, `/pr`, `/review`, `/fix`, `/deploy`
Projeto (`.pi/prompts/`): `/migration`, `/report`, `/sprint`

### Tema TUI: mileage-dark
`~/.pi/agent/themes/mileage-dark.json` — navy `#0B1020`, accent `#5B72C4`, gold `#CE9E1D`, teal `#22A68F`

### Config `.pi/settings.json`
```json
{
  "theme": "mileage-dark",
  "sessionDir": ".pi/sessions",
  "quietStartup": true,
  "compaction": { "reserveTokens": 20480, "keepRecentTokens": 24000 }
}
```

### Shell Aliases
```bash
alias pi-miles='pi --name "$(basename $(pwd))"'
alias pi-q='pi -p'
alias pi-r='pi -c'
alias pi-build='pi -p "npm run build && npx playwright test --reporter=list --workers=1"'
```

---

## Sessão: Upgrade Visual (Jul 2026)

**Commits**: `b136908`, `c947ef9`, `5bf678a`
- Design tokens: navy 222, shadows com elevação, radius 0.75rem
- MetricCard: barra gradiente topo + glass icon + hover scale
- FlowMap: gradiente topo + hover suave
- Dashboard hero: glass effect nos mini cards + hover shadow
- Overflow fix: Vendas header `flex-wrap`

## Sessão: Redesign Visual Completo (Jul 2026)

**Commits**: `852212c`, `71dbee2`
- 5 fases: tipografia (Instrument Serif removida → Plus Jakarta Sans), AltitudeBar, FlowMap, Pontos teal, Gráficos tema
- Light mode: fundo 92%, cards 96%, 3 camadas profundidade
- Pós-audit: fontes simplificadas — só `Plus Jakarta Sans` + `JetBrains Mono`

## Sessão: Esqueci minha senha (Jul 2026)

**Commit**: `c84db8f`
- `AuthContext`: add `resetPassword()` + `updatePassword()`
- `ForgotPassword.tsx`, `ResetPassword.tsx`
- Rotas: `/forgot-password`, `/reset-password`
- **Requer**: configurar redirect URLs no Supabase Dashboard

---

## Design System (resumo — detalhes em docs/UI-GUIDE.md)

### Cores (CSS vars HSL)
- `--primary`: 222 70% 45% | `--gold`: 38 85% 50% | `--teal`: 170 65% 36%
- `--success`: 152 60% 33% | `--warning`: 38 90% 48% | `--destructive`: 0 75% 55%

### Sombras
- `shadow-sm/elegant/card/glow/glow-gold` definidas como CSS vars

### Gradientes
- `bg-gradient-primary/gold/success/card/hero/hero-teal/hero-glow`

### Animações
- `animate-appear`, `animate-delay-NNN`, View Transitions (fade)
- MetricCard hover: `-translate-y-0.5`, `hover:shadow-elegant`, icon `group-hover:scale-110`
- Confetti: 40-60 particles, spread 60-70, cores [primary, gold, green]
