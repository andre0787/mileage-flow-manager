# ⚙️ Stack & Setup — MilesControl

## Stack

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React 19 + TypeScript | ^19 / ^5.5 | UI |
| Vite | ^6 | Bundler |
| Tailwind CSS | ^3 | Estilização |
| shadcn/ui | — | Componentes base |
| React Router v8 | ^8 | Rotas |
| TanStack React Query | ^5 | Server state |
| Recharts | ^2 | Gráficos |
| react-hook-form + zod | — | Formulários |
| Supabase | — | Backend (Auth + PostgreSQL + RLS) |
| canvas-confetti | ^1 | Confete |
| Playwright | ^1 | E2E |

## Comandos

```bash
npm run dev                           # Servidor dev (localhost:8080)
npm run build                         # Build produção
npm run lint                          # ESLint
npx tsc --noEmit                      # TypeScript check
npx playwright test --reporter=list --workers=1  # E2E
vercel --prod                         # Deploy manual
```

### Comandos do AI Core (SDD v5.0 — P11/P12)

```bash
npm run check:fast                    # typecheck + lint + format + test + verify-docs
npm run pre-pr                        # relatório obrigatório antes de todo PR
npm run ai:p11:score                  # certificação P11 (15 eixos ≥ 9,5)
npm run p12:validate                  # P12: roda 162 runs e gera Evidence Report + P13 Roadmap
npm run exec:run:real <taskId>        # pipeline §3 real via dispatcher TS (tsx)
TELEMETRY_PERSIST=1 npm run exec:run:real <taskId>  # grava envelopes.jsonl
npm run graph:status                  # estado do grafo (CRG --json)
npm run graph:impact <alvo>           # nós alcançáveis a partir de um arquivo/símbolo
npm run map:sync                      # regenera seção STRUCTURE do docs/MAP.md
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |

## Dependências Principais

- `@supabase/supabase-js` — cliente Supabase
- `@tanstack/react-query` — React Query
- `recharts` — gráficos
- `react-hook-form` + `zod` — formulários + validação
- `canvas-confetti` — confetes
- `lucide-react` — ícones
- `vite-plugin-pwa` — PWA + Service Worker
- `workbox-build` + `workbox-window` — cache offline

## Dependências de Dev

- `@playwright/test` — testes E2E
- `typescript` — type checking
- `eslint` — linting
- `tailwindcss` — CSS utility-first
- `tsx` — runner de scripts TS com alias `@/` (exec:run:real, p12:validate)
- `code-review-graph` (CLI, v2.3.7+) — grafo estrutural tree-sitter (graph:status/impact/…)

## Agente (pi / opencode)

- **Harness**: pi (delega runtime para opencode)
- **Config**: `~/.config/opencode/opencode.json`
- **Packages**: ponytail, superpowers, pi-subagents
- **Plugins**: caveman
- **Skills (pi)**: council-to-superpowers, handoff, ponytail, planning-with-files, subagent-driven-development, dispatching-parallel-agents, using-git-worktrees
- **Skills (opencode)**: council-to-superpowers, ponytail, frontend-design, caveman, cavecrew
- **Subagentes**: `subagent` tool via pi-subagents — execução single, parallel, chain, async
- **Tema TUI**: mileage-dark
