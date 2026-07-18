# MilesControl

Sistema de gerenciamento de milhas e pontos para controle de aquisição, transferência e venda.

## Funcionalidades

- **Dashboard** - Visão geral com métricas financeiras, gráficos mensais e alertas de CPF
- **Contas** - Gerenciamento de contas de pontos e milhas por programa e proprietário
- **Clientes** - Cadastro de clientes com histórico de compras
- **Entradas** - Registro de aquisição de pontos/milhas e transferências entre contas (com bonificação)
- **Vendas** - Registro de vendas com cálculo automático de lucro e margem; suporte a cancelamento
- **Controle CPF** - Monitoramento de ciclo de passageiros por programa com alertas
- **Relatórios** - Visualização consolidada de dados com exportação CSV (donos e programas)
- **Perfil** - Edição de nome, email e senha
- **Simulador de Venda** - Cálculo rápido de lucro, margem e ROI sem criar registro
- **Busca Global** - Pesquisa em todas as entidades via dropdown no header (Cmd/Ctrl+K)
- **Modo Offline** - Service Worker com cache de assets, aviso quando sem conexão

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router v6 + TanStack React Query
- Recharts (gráficos)
- Supabase (PostgreSQL, Auth, RLS)
- Vite Plugin PWA + Workbox (offline)
- Playwright (testes E2E)
- Vercel (deploy)

## Desenvolvimento

```bash
npm install
npm run dev     # localhost:8080
npm run build   # build produção
npm run lint    # ESLint
```

## Deploy

Produção: https://mileage-flow-manager.vercel.app

## Git Workflow

> 📜 **Workflow canônico:** [`docs/WORKFLOW-MANIFEST.md`](docs/WORKFLOW-MANIFEST.md)  
> Categorias, estados, comandos obrigatórios, alvo de PR e política de bypass.

- `main` — produção (deploy automático Vercel), alvo de todo PR
- `feat/*`, `fix/*`, `docs/*`, `chore/*` — branches de trabalho com PR para `main`
- Não há branch `develop` — o fluxo é direto para `main`
