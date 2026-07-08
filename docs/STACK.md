# ⚙️ Stack & Setup — MilesControl

## Stack

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

## Comandos

```bash
npm run dev                           # Servidor dev (localhost:8080)
npm run build                         # Build produção
npm run lint                          # ESLint
npx tsc --noEmit                      # TypeScript check
npx playwright test --reporter=list --workers=1  # E2E
vercel --prod                         # Deploy manual
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

## Dependências de Dev

- `@playwright/test` — testes E2E
- `typescript` — type checking
- `eslint` — linting
- `tailwindcss` — CSS utility-first

## Agente (pi / opencode)

- **Harness**: pi 0.80.3 (delega runtime para opencode)
- **Modelo**: deepseek-v4-flash-free
- **Config**: `~/.config/opencode/opencode.jsonc`
- **Plugins**: superpowers, ponytail, caveman
- **MCPs**: context7, sequential-thinking, playwright, filesystem, github, supabase
- **Pacotes pi**: ponytail, superpowers
- **Skills**: 112 skills carregadas (Anthropic, design, planning, ponytail, superpowers, caveman, llm-council)
- **Tema TUI**: mileage-dark
