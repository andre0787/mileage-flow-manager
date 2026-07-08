# 🧠 MEMORY — MilesControl

> Arquivo de memória do projeto. Contém histórico de decisões, sprints concluídas,
> convenções estabelecidas e contexto para agentes futuros.

---

## 📋 Índice
1. [Stack & Setup](#stack--setup)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Convenções de Código](#convenções-de-código)
4. [Git Workflow](#git-workflow)
5. [UX Sprint — Histórico](#ux-sprint--histórico)
6. [Componentes e Padrões de UI](#componentes-e-padrões-de-ui)
7. [Regras de Negócio](#regras-de-negócio)
8. [Testes](#testes)
9. [Deploy](#deploy)

---

## Stack & Setup

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React 18 + TypeScript | ^18 | UI |
| Vite | ^5 | Bundler |
| Tailwind CSS | ^3 | Estilização |
| shadcn/ui | — | Componentes base |
| React Router v6 | ^6 | Rotas |
| TanStack React Query | ^5 | Server state |
| Recharts | ^2 | Gráficos |
| react-hook-form + zod | — | Formulários |
| Supabase | — | Backend (Auth + PostgreSQL + RLS) |
| canvas-confetti | ^1 | Confete |
| Playwright | ^1 | E2E |

### Comandos
```bash
npm run dev        # servidor dev (localhost:8080)
npm run build      # build produção
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript check
npx playwright test --reporter=list --workers=1  # E2E
```

---

## Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/               # shadcn/ui (19 mantidos)
│   ├── AccountDialog.tsx
│   ├── AnimatedNumber.tsx
│   ├── AppSidebar.tsx
│   ├── BottomTabBar.tsx
│   ├── DeleteEntryDialog.tsx   # Extraído de Entradas.tsx
│   ├── EmptyState.tsx          # UX Sprint 2
│   ├── ErrorBoundary.tsx       # UX Sprint 1
│   ├── FlowMap.tsx
│   ├── FormDrawer.tsx
│   ├── MetricCard.tsx
│   ├── ProtectedRoute.tsx
│   └── SkeletonLoader.tsx      # UX Sprint 1
├── contexts/
│   ├── AuthContext.tsx         # Auth + sessão
│   └── DataContext.tsx         # Dados + isLoading + cache
├── hooks/
│   ├── useDatabase.ts          # Todas queries + mutations React Query
│   ├── useDebounce.ts          # UX Sprint 1 (300ms)
│   └── useHaptic.ts            # UX Sprint 3 (vibração mobile)
├── lib/
│   ├── metrics.ts              # Cálculos de domínio (funções puras)
│   ├── utils.ts                # formatCPF + isTransferencia + helpers
│   └── supabase.ts             # Cliente Supabase
├── pages/
│   ├── Dashboard.tsx           # Abas Milhas/Pontos
│   ├── Entradas.tsx            # Entradas + Transferências
│   ├── Vendas.tsx              # Vendas + Simulador
│   ├── Contas.tsx
│   ├── Clientes.tsx
│   ├── ControleCPF.tsx
│   ├── Relatorios.tsx
│   ├── Configuracoes.tsx
│   ├── Perfil.tsx
│   └── Login.tsx
└── types/
    └── index.ts                # Tipos TS
```

---

## Convenções de Código

### Arquitetura Geral
- **Business logic em `lib/`**, queries/mutations em `hooks/`, UI em `pages/` e `components/`
- **Nunca duplicar regra de negócio**: cada cálculo (lucro, margem, saldo, custo médio) em ponto único em `lib/`
- **Funções puras em `lib/*.ts`**: sem React, sem Supabase, sem hooks
- **Ponto único de alteração**: mudança em lógica de domínio reflete em 1 arquivo apenas
- **Todo mapper snake_case → camelCase** centralizado em `lib/utils.ts` ou no módulo de domínio
- **Preferir criar módulo novo** a duplicar lógica existente

### Nomenclatura
- Componentes: `PascalCase.tsx` (ex: `MetricCard.tsx`)
- Utilitários/hooks: `camelCase.ts` (ex: `useDebounce.ts`)
- Import paths: `@/` aponta para `src/`
- Interface em português (pt-BR)

### React & Estado
- **DataContext**: apenas dados + `isLoading` + `clearCache`/`clearAccountData`.
  Mutations NÃO ficam no contexto — componentes importam hooks de `useDatabase.ts` diretamente.
- **React Query**: `staleTime: 30s`, `invalidateQueries` após mutations
- **Loading states**: usar `isPending` do TanStack Query para skeletons iniciais
- **Ponytail mode**: não criar abstrações antes de precisar, preferir stdlib/nativo, remover código morto
- **shadcn/ui**: só adicionar componente se realmente for usar. Atualmente 19 mantidos.

### UI & UX (estabelecido na UX Sprint)
- **SkeletonLoader**: 4 variantes — `SkeletonPage`, `SkeletonMetricCard`, `SkeletonTable`, `SkeletonHero`
- **ErrorBoundary**: class component global em `App.tsx`, com botão "Tentar novamente"
- **Debounce**: 300ms em campos de busca (Entradas, Vendas, Clientes), via `useDebounce` hook
- **EmptyState**: componente com `icon`, `title`, `description`, `action` opcional (label + onClick)
- **Confetti**: `canvas-confetti` em criação de entrada (sempre) e venda ≥ R$ 200
- **Haptic**: `useHaptic` hook com `light`/`medium`/`heavy`/`success` via `navigator.vibrate()`
- **View Transitions API**: fade-out 200ms + fade-in 350ms entre páginas (respeita `prefers-reduced-motion`)
- **MetricCard**: `animate` prop sempre true (removida a prop)
- **Toast**: sistema removido, app usa Sonner exclusivamente

---

## Git Workflow

```
main ───── produção (Vercel)
  ↑
develop ── desenvolvimento
  ↑
fix/* ──── PR → develop → merge develop → main
```

**Ramo atual**: `main` (produção) — deploy automático via Vercel.
**Fluxo padrão**: Commitar em `develop`, mergear em `main`, push → Vercel auto-deploy.

### Commits em main (produção)
```
71dbee2 fix: light mode moderno (fundo 92%, cards 96%, sem branco puro)
852212c feat: redesign visual completo (Instrument Serif + AltitudeBar + Pontos teal + graficos tema)
2d80fc3 fix: remove docs especulativas e linha duplicada (ponytail-review)
5bf678a docs: bateria obrigatoria de testes pre-deploy documentada em AGENTS.md
c947ef9 fix: botao Nova Venda nao vaza mais no mobile (flex-wrap)
b136908 feat: upgrade visual (design tokens + bento cards + glass effect)
c84db8f feat: esqueci minha senha (fluxo completo)
916a0cb feat(ux): sprint completo — loading, empty states, confetti, haptic e view transitions
dd6a414 refactor: centraliza deducao de total invested em vendas + extrai DeleteEntryDialog
31383d8 docs: atualiza AGENTS.md e README com novas features
```

---

## UX Sprint — Histórico

### Sprint 1 — Critical UX (Loading + Error + Debounce)
**Commit**: `0435e54` → merged em `916a0cb`

| Item | Arquivo | Feito |
|------|---------|-------|
| DataContext: expor `isLoading` | `DataContext.tsx` | ✅ |
| ErrorBoundary global | `ErrorBoundary.tsx`, `App.tsx` | ✅ |
| useDebounce hook | `useDebounce.ts` | ✅ |
| SkeletonLoader (4 variantes) | `SkeletonLoader.tsx` | ✅ |
| Skeletons em Dashboard | `Dashboard.tsx` | ✅ |
| Skeletons em Entradas | `Entradas.tsx` | ✅ |
| Skeletons em Vendas | `Vendas.tsx` | ✅ |
| Skeletons em Clientes | `Clientes.tsx` | ✅ |
| Skeletons em Contas | `Contas.tsx` | ✅ |
| Skeletons em ControleCPF | `ControleCPF.tsx` | ✅ |
| Skeletons em Relatorios | `Relatorios.tsx` | ✅ |
| Skeletons em Configuracoes | `Configuracoes.tsx` | ✅ |
| Debounce em Entradas | `Entradas.tsx` | ✅ |
| Debounce em Vendas | `Vendas.tsx` | ✅ |
| Debounce em Clientes | `Clientes.tsx` | ✅ |
| Fix hooks ordering no Dashboard | `Dashboard.tsx` | ✅ |

### Sprint 2 — Empty States
**Commit**: `93a1bde` → merged em `916a0cb`

| Item | Arquivo | Feito |
|------|---------|-------|
| EmptyState component | `EmptyState.tsx` | ✅ |
| Empty states Dashboard (Milhas + Pontos) | `Dashboard.tsx` | ✅ |
| Empty states Entradas | `Entradas.tsx` | ✅ |
| Empty states Vendas | `Vendas.tsx` | ✅ |
| Empty states Clientes | `Clientes.tsx` | ✅ |
| Empty states Contas | `Contas.tsx` | ✅ |

### Sprint 3 — Polish & Micro-interações
**Commit**: `e2a40a8` → merged em `916a0cb`

| Item | Arquivo | Feito |
|------|---------|-------|
| canvas-confetti instalado | `package.json` | ✅ |
| Confetti em criação de entrada | `Entradas.tsx` | ✅ |
| Confetti em venda ≥ R$ 200 | `Vendas.tsx` | ✅ |
| useHaptic com 4 padrões | `useHaptic.ts` | ✅ |
| Haptic success em entradas + vendas | `Entradas.tsx`, `Vendas.tsx` | ✅ |
| View Transitions API (fade) | `index.css` | ✅ |
| MEMORY.md criado | `MEMORY.md` | ✅ |

### Validação Final
| Item | Status |
|------|--------|
| `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ |
| `npm run lint` | ✅ (0 errors, 7 warnings pré-existentes) |
| `npx playwright test` | ✅ (14.1s) |
| Aprovação do usuário | ✅ |
| Merge `main` + push | ✅ Deploy automático Vercel |

## ⚠️ Post-mortem — Runtime Error no Deploy

**Sintoma**: Dashboard e Vendas quebravam no runtime com erro "EmptyState is not defined".

**Causa raiz**: `Dashboard.tsx` e `Vendas.tsx` usavam `<EmptyState />` sem importar o componente.
O `tsconfig.json` tem `noUnusedLocals: false` e `strictNullChecks: false`, então `tsc --noEmit`
**não acusou erro** — apenas o runtime revelou.

**Solução**: Adicionar `import { EmptyState } from "@/components/EmptyState"` em ambos os arquivos.
Commit `1bc6258`.

**Proteção futura**: Sempre verificar imports manualmente mesmo com `tsc` zerado, ou ativar
`noUnusedLocals: true` e `strict: true` no tsconfig.

## 📚 Commits em main (produção)

```
71dbee2 fix: light mode moderno (fundo 92%, cards 96%, sem branco puro)
852212c feat: redesign visual completo (Instrument Serif + AltitudeBar + Pontos teal + graficos tema)
2d80fc3 fix: remove docs especulativas e linha duplicada (ponytail-review)
1bc6258 fix: importa EmptyState em Dashboard e Vendas (runtime error)
fe5e09c docs: atualiza MEMORY.md com historico completo e convencoes do projeto
916a0cb feat(ux): sprint completo — loading, empty states, confetti, haptic e view transitions
dd6a414 refactor: centraliza deducao de total invested em vendas + extrai DeleteEntryDialog
31383d8 docs: atualiza AGENTS.md e README com novas features
```

---

## Componentes e Padrões de UI

### shadcn/ui mantidos (19)
alert-dialog, badge, button, card, dialog, drawer, input, label, progress, select, separator, sheet, skeleton, sidebar, sonner, switch, table, tabs, tooltip

### Componentes próprios criados
| Componente | Localização | Propósito |
|-----------|-------------|-----------|
| `EmptyState` | `components/EmptyState.tsx` | Estado vazio com CTA |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Captura de erros com retry |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | 4 variantes de skeleton |
| `DeleteEntryDialog` | `components/DeleteEntryDialog.tsx` | Diálogo de exclusão com cascata |
| `AltitudeBar` | `components/AltitudeBar.tsx` | Barra animada no hero (meta configurável) |

### Hooks customizados
| Hook | Localização | Propósito |
|------|-------------|-----------|
| `useDebounce` | `hooks/useDebounce.ts` | Debounce 300ms |
| `useHaptic` | `hooks/useHaptic.ts` | Vibração tátil mobile |

---

## Convenção de Recorrência (estabelecida Ago 2026)
- **Todo `origem_type`** deve ter `description` com `hasRecurrence: true` ou `hasRecurrence: false` (nunca `undefined`).
- **Cálculo de `recurrenceEnd` e `recurrenceInterval`**: centralizado em `buildMonthlyRecurrence()` em `src/lib/origemTypes.ts`.
- **Helpers**: `serializeOrigemTypeDescription`, `parseOrigemTypeDescription`, `buildMonthlyRecurrence` — todas em `src/lib/origemTypes.ts`.
- **UI**: Configurações tem select `s tem select `<Select>` "Avulsa" / "Recorrente mensal" ao criar/editar tipo.\n- **Backfill**: migration `20260705010000` preenche `hasRecurrence` em tipos existentes.\n- **Testes**: `tests/origem-tipo.spec.ts` cobre criação recorrente + avulsa + persistência.\n\n## Regras de Negócio\n\n### Vendas"}]
- Status: `pendente` → `pago` → `concluído` | `cancelado`
- **Cancelamento**: restaura saldo e `totalInvested` da conta, excluído de métricas financeiras
- **Proportional cost**: ao criar venda, deduz `totalInvested` proporcionalmente via `calcProportionalCost` + `calcAccountUpdate`

### Transferências
- Entre contas de pontos com bonificação
- `isTransferencia()` em `lib/utils.ts`

### Entradas
- Exclusão em cascata: se entrada tem vendas vinculadas, exclui vendas primeiro
- `DeleteEntryDialog` gerencia confirmação + execução

### CPF
- Controle de ciclo de passageiros por programa
- `formatCPF` em `lib/utils.ts`

---

## Testes

### E2E Playwright
- Arquivos:
  - `tests/entradas.spec.ts` — fluxo criar → editar → excluir entrada
  - `tests/responsivo.spec.ts` — 11 páginas × 4 viewports + redimensionamento
- Helpers: `tests/helpers.ts` — criar dados via REST API com retry
- Viewport: 1280x900
- Comando: `npx playwright test --reporter=list --workers=1`

### Bateria Obrigatória (pré-deploy)
Documentada em `AGENTS.md`. Executar antes de todo push em `main`:
1. `npm run build` — sem erros
2. `npx playwright test --reporter=list --workers=1` — ambos os testes
3. Zero overflow horizontal (verificado pelo teste responsivo)
4. Screenshots salvos em `tests/screenshots/`

**Qualquer falha → blocker.**

### Convenções de teste
- `{ force: true }` em cliques dentro de Dialog/Drawer
- `.first()` em `text=` quando valor aparece em múltiplos lugares
- Registrar usuário via UI, criar dados via Supabase REST API
- Token de acesso: `localStorage.getItem('sb-{project-ref}-auth-token')`
- IDs dos campos de entrada: `#amount`, `#amountPaid`, `#conversion` (criar), `#editAmount`, `#editAmountPaid` (editar)

---

## Deploy

- **URL**: https://mileage-flow-manager.vercel.app
- **Framework**: Vite
- **Variáveis**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **CLI**: `vercel --prod`
- **Deploy automático**: push para `main` → Vercel

---

### Sessão: Redesign Visual Completo (Jul 2026)
**Commits**: `852212c`, `71dbee2`

**5 fases implementadas:**
1. **Tipografia** — Instrument Serif (`font-display-alt`) nos números hero, Google Fonts + tailwind config
2. **AltitudeBar** — `AltitudeBar.tsx` barra horizontal animada, meta 500K milhas / 300K pontos, gradiente dinâmico
3. **FlowMap** — Já era fluxo desde upgrade anterior (4 nodes + setas)
4. **Pontos teal** — Hero com `bg-gradient-hero-teal`, drift particles teal/gold, AltitudeBar teal→gold
5. **Gráficos tema** — COLORS do `DashboardCharts.tsx` agora usam `hsl(var(--primary))`, `--teal`, `--gold`, `--success`

**Light mode moderno (71dbee2):**
- Fundo: `92%` (era 97%)
- Cards: `96%` off-white (era 100% branco puro)
- Bordas: `80%` (era 88%)
- 3 camadas de profundidade: fundo → card → popover
- Nenhum elemento usa `#fff`
- Sombras com ~50% mais opacidade

**Pós-audit: fontes simplificadas (3732400):**
- `Instrument Serif` removida — números do hero agora usam `Plus Jakarta Sans` (mesma fonte do app)
- Classe `.font-display-alt` deletada do CSS
- Google Fonts: só `Plus Jakarta Sans` e `JetBrains Mono`
- `tailwind.config.ts`: `displayAlt` aponta para Plus Jakarta Sans (fallback, não usado em componentes)

**Bateria pré-deploy**: build ✅ + 2 playwright tests ✅ (48s)

---

## Sessões Recentes (legado)

### Extensões pi (MCPs substituídos)
**Criadas em**: `~/.pi/agent/extensions/`

#### `mcp-supabase/` (3 tools)
- `supabase_query`: SQL arbitrário via RPC
- `supabase_select`: consulta tabelas com filtros
- `supabase_auth_list`: lista usuários do Auth
- Deps: `@supabase/supabase-js`

#### `mcp-github/` (3 tools)
- `github_pr_list`: lista PRs do repositório
- `github_create_pr`: cria PR
- `github_workflow_status`: status dos workflows/deploy
- Deps: `octokit`

### Ponytail (lazy senior dev mode)
Instalado via `pi install npm:@dietrichgebert/ponytail@4.8.4`
- **Extensão**: `~/.pi/agent/npm/node_modules/@dietrichgebert/ponytail/pi-extension/index.js`
- **Skills** (6): `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`
- Uso: ativar via `/skill:ponytail` para modo código mínimo

#### Mantidos via bash
- `playwright` → `npx playwright test`
- `filesystem` → `read`/`write`/`edit` nativos
- `context7` + `sequential-thinking` → skill `planning-with-files`

### Prompt Templates (6 templates)

**Global** (`~/.pi/agent/prompts/`): `/commit`, `/pr`, `/review`, `/fix`, `/deploy`
**Projeto** (`.pi/prompts/`): `/migration`

| Comando | Quando ativar | Efeito |
|---------|---------------|--------|
| `/commit` | Após `git add` | Gera mensagem conventional commit do diff staged |
| `/pr` | Antes de abrir PR | Cria descrição de PR com changelog |
| `/review` | Antes de commit/deploy | Code review do diff (bugs + DRY + segurança) |
| `/fix <erro>` | Ao encontrar erro | Analisa e localiza a correção |
| `/deploy` | Antes de deploy | Executa build + testes (bateria obrigatória) |
| `/migration` | Ao alterar banco | Snippet SQL com RLS |

**Atalho**: `/` no editor → autocomplete.

### Tema TUI mileage-dark
`~/.pi/agent/themes/mileage-dark.json` — ativado via `theme` em `.pi/settings.json`
- Fundo: navy `#0B1020`
- Accent: `#5B72C4` (primary)
- Destaques: `#CE9E1D` (gold), `#22A68F` (teal)
- 51 tokens de cor definidos + export colors

### Configurações de Projeto (`.pi/settings.json`)
```json
{
  "theme": "mileage-dark",
  "sessionDir": ".pi/sessions",
  "quietStartup": true,
  "compaction": {
    "reserveTokens": 20480,
    "keepRecentTokens": 24000
  }
}
```
- Sessões salvas dentro do projeto (`.pi/sessions/`, gitignorado)
- Startup mais silencioso
- Mais tokens preservados na compactação

### Shell Aliases (recomendados em ~/.bashrc)
```bash
alias pi-miles='pi --name "$(basename $(pwd))"'
alias pi-q='pi -p'
alias pi-r='pi -c'
alias pi-build='pi -p "npm run build && npx playwright test --reporter=list --workers=1"'
```

### tmux (para tasks paralelas)
Não instalado. Quando disponível, configurar `~/.tmux.conf`:
```
set -g extended-keys on
set -g extended-keys-format csi-u
```

### Sessão: Upgrade Visual (Jul 2026)
**Commits**: `b136908`, `c947ef9`, `5bf678a`
- **Design tokens**: paleta refinada (navy 222), shadows com elevação, radius 0.75rem
- **MetricCard**: barra gradiente no topo + glass icon + hover scale
- **FlowMap**: gradiente no topo + hover suave + glass icon
- **Dashboard hero**: glass effect nos mini cards + hover shadow
- **Overflow fix**: Vendas header com `flex-wrap` (botões vão pra row 2 no mobile)
- **Test battery**: documentada em AGENTS.md como pré-requisito de deploy

### Sessão: Esqueci minha senha (Jul 2026)
**Commit**: `c84db8f`
- `AuthContext`: add `resetPassword(email)` + `updatePassword(password)`
- `ForgotPassword.tsx`: formulário de email + tela de sucesso com check spam
- `ResetPassword.tsx`: landing do magic link → nova senha → redirect login
- `Login.tsx`: link "Esqueceu a senha?" no form de login
- Rotas: `/forgot-password` e `/reset-password`
- **Importante**: configurar redirect URLs no Supabase Dashboard

### Caveman (Ago 2026)
Instalado via `npm i -g @juliusbrussee/caveman`.
- **Skill**: comunicação concisa (economiza tokens).
- **Ativação**: `/skill:caveman` ou modo padrão se configurado.
- **Efeito**: respostas diretas, sem prosa, sem desculpas.

### Skills Instaladas (Jul 2026)
**Skills instaladas**: 95 (16 Anthropic + 67 design + 6 planning + 6 ponytail)
- `anthropic-skills/` (16 skills): `webapp-testing`, `frontend-design`, `doc-coauthoring`, `skill-creator`, documentos (pdf, docx, xlsx)
- `awesome-design-skills/` (67 temas UI): `bento`, `modern`, `shadcn`, `corporate`, `neobrutalism`, `glassmorphism`
- `planning-with-files/` (6 skills): planejamento persistente + 5 traduções
- `ponytail/` (6 skills): lazy senior dev mode (instalado via `pi install npm:@dietrichgebert/ponytail@4.8.4`)

---

## Design System

### Cores (CSS vars HSL em `index.css`)
- `--primary`: 222 70% 45% (navy premium)
- `--gold`: 38 85% 50% (ouro)
- `--teal`: 170 65% 36% (teal)
- `--success`: 152 60% 33% (verde)
- `--warning`: 38 90% 48% (âmbar)
- `--destructive`: 0 75% 55% (vermelho)
- Backgrounds, cards, foreground e muted seguem padrão shadcn/ui
- Dark mode: valores ajustados (ex: `--primary: 222 70% 58%`)

### Shadows (Tailwind + CSS vars)
- `shadow-sm`: `var(--shadow-sm)` — cards
- `shadow-md`: `var(--shadow-md)` — hover de cards
- `shadow-lg`: `var(--shadow-lg)` — modais
- `shadow-elegant`: `var(--shadow-elegant)` — glow primary
- `shadow-card`: `var(--shadow-card)` — padrão
- `shadow-glow` / `shadow-glow-gold`: glow decorativo (hero)

### Gradientes
- `bg-gradient-primary`: primary → primary-light
- `bg-gradient-gold`: gold → gold-light
- `bg-gradient-success`: success → success-light
- `bg-gradient-card`: sutil 145° (agora `hsl(0 0% 96%) → hsl(222 15% 92%)`)
- `bg-gradient-hero`: animado (gradient-shift) para hero do Dashboard
- `bg-gradient-hero-teal`: animado para hero da aba Pontos (teal/gold)
- `bg-gradient-hero-glow`: radial glow no hero

### Tipografia
- Display: `Plus Jakarta Sans` (Google Fonts com `display=swap`) — usada em todo o app, inclusive números do hero
- Mono: `JetBrains Mono` (Google Fonts com `display=swap`)
- Classe `.font-display` para títulos, `.font-body` para texto corrido

### Animações
- Classes utilitárias: `.animate-appear`, `.animate-delay-NNN`
- View Transitions: fade-out 200ms + fade-in 350ms
- Hover em MetricCard: `hover:-translate-y-0.5 hover:shadow-elegant transition-card duration-300`
- Ícone do MetricCard: `backdrop-blur-sm` + `group-hover:scale-110`
- Barra gradiente no topo de MetricCard e FlowMap
- Confetti: 40-60 particles, spread 60-70, cores [primary, gold, green]
- `animate-ping` no indicador verde
