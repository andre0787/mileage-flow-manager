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
- `vite-plugin-pwa` — PWA + Service Worker
- `workbox-build` + `workbox-window` — cache offline

## Dependências de Dev

- `@playwright/test` — testes E2E
- `typescript` — type checking
- `eslint` — linting
- `tailwindcss` — CSS utility-first

## Agente (pi / opencode)

- **Harness**: pi (delega runtime para opencode)
- **Config**: `~/.config/opencode/opencode.jsonc`
- **Plugins**: superpowers, ponytail, caveman
- **Skills**: council-to-superpowers, planning-with-files, ponytail, caveman, frontend-design, webapp-testing
- **Tema TUI**: mileage-dark
