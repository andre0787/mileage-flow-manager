# 🏗️ Arquitetura — MilesControl

## Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/              # shadcn/ui (19 mantidos)
│   ├── AccountDialog.tsx
│   ├── AltitudeBar.tsx
│   ├── AnimatedNumber.tsx
│   ├── AppSidebar.tsx
│   ├── BottomTabBar.tsx
│   ├── DeleteEntryDialog.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── FlowMap.tsx
│   ├── FormDrawer.tsx
│   ├── MetricCard.tsx
│   ├── ProtectedRoute.tsx
│   └── SkeletonLoader.tsx
├── contexts/
│   ├── AuthContext.tsx       # Auth + sessão
│   └── DataContext.tsx       # Dados + isLoading + clearCache
├── hooks/
│   ├── useDatabase.ts       # Todas queries + mutations React Query
│   ├── useDebounce.ts       # 300ms
│   └── useHaptic.ts         # Vibração mobile
├── lib/
│   ├── metrics.ts           # Cálculos de domínio (funções puras)
│   ├── utils.ts             # formatCPF + isTransferencia + helpers
│   └── supabase.ts          # Cliente Supabase
├── pages/
│   ├── Dashboard.tsx        # Abas Milhas/Pontos
│   ├── Entradas.tsx         # Entradas + Transferências
│   ├── Vendas.tsx           # Vendas + Simulador
│   ├── Contas.tsx
│   ├── Clientes.tsx
│   ├── ControleCPF.tsx
│   ├── Relatorios.tsx
│   ├── Configuracoes.tsx
│   ├── Perfil.tsx
│   └── Login.tsx
└── types/
    └── index.ts             # Tipos TS
```

## Fluxo de Dados

```
Usuário → React Query → Supabase (RLS por user_id)
              ↓
         DataContext (cache + isLoading)
              ↓
         Páginas (Dashboard, Entradas...)
              ↓
         Componentes (MetricCard, AltitudeBar...)
```

### Regras

- **Business logic em `lib/`** (funções puras, sem React/Supabase)
- **Queries/mutations em `hooks/useDatabase.ts`**
- **UI em `pages/` e `components/`**
- **DataContext**: só dados + isLoading + clearCache/clearAccountData. Mutations NÃO ficam no contexto.
- **React Query**: staleTime 30s, invalidateQueries após mutations
- **Todo mapper snake_case → camelCase** centralizado em `lib/utils.ts`

## Rotas

| Rota | Página | Autenticação |
|------|--------|-------------|
| `/login` | Login | Pública |
| `/` | Dashboard | Protegida |
| `/entradas` | Entradas | Protegida |
| `/vendas` | Vendas | Protegida |
| `/contas` | Contas | Protegida |
| `/clientes` | Clientes | Protegida |
| `/controle-cpf` | ControleCPF | Protegida |
| `/relatorios` | Relatorios | Protegida |
| `/configuracoes` | Configuracoes | Protegida |
| `/perfil` | Perfil | Protegida |
| `/forgot-password` | ForgotPassword | Pública |
| `/reset-password` | ResetPassword | Pública |

## Banco de Dados (Supabase)

Tabelas: `profiles`, `owners`, `programs`, `origem_types`, `accounts`, `entries`, `clients`, `sales`

- **RLS**: todas as tabelas filtram por `user_id = auth.uid()`
- **Auth**: email/senha, sem confirmação de email
