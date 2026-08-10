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
│   ├── DeleteConfirmDialog.tsx   # AlertDialog reutilizável p/ exclusões
│   ├── DeleteEntryDialog.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── FlowMap.tsx
│   ├── FormDrawer.tsx
│   ├── GlobalSearch.tsx          # Busca global no header
│   ├── KeyboardShortcutsHelp.tsx # Modal de atalhos (atalho ?)
│   ├── LanguageSelector.tsx      # Seletor pt-BR / en
│   ├── MetricCard.tsx
│   ├── OfflineBanner.tsx     # Banner "Sem conexão"
│   ├── ProtectedRoute.tsx
│   └── SkeletonLoader.tsx
├── contexts/
│   ├── DataContext.tsx       # Dados + isLoading + clearCache + clearAccountData
│   ├── I18nContext.tsx       # Internacionalização (Sprint #10)
│   └── OnlineContext.tsx     # Estado da conexão
├── hooks/
│   ├── useDatabase/         # Queries + mutations por entidade (split)
│   │   ├── index.ts
│   │   ├── accounts.ts
│   │   ├── clients.ts
│   │   ├── entries.ts
│   │   ├── mappers.ts
│   │   ├── origemTypes.ts
│   │   ├── owners.ts
│   │   ├── programs.ts
│   │   ├── sales.ts
│   │   └── shared.ts
│   ├── useDatabase.ts       # Barrel re-export do useDatabase/
│   ├── useDebounce.ts       # 300ms
│   ├── useHaptic.ts         # Vibração mobile
│   └── useKeyboardShortcuts.ts  # Atalhos: g,e,v,c,p,s,r,? (Sprint #7)
├── lib/
│   ├── accounts.ts          # Lógica de domínio de contas
│   ├── dates.ts             # Formatação de datas
│   ├── i18n.ts              # Traduções pt-BR/en (Sprint #10)
│   ├── logger.ts            # Debug log estruturado (Sprint #6)
│   ├── metrics.ts           # Cálculos de domínio (funções puras)
│   ├── origemTypes.ts       # Lógica de tipos de origem
│   ├── supabase.ts          # Cliente Supabase
│   ├── supabase-types.ts    # Tipos gerados do Supabase
│   └── utils.ts             # formatCPF + isTransferencia + helpers
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

## PWA / Offline (Sprint #6)

- **Service Worker**: Workbox via `vite-plugin-pwa` (cache de assets + API)
- **OnlineContext**: estado da conexão (`isOnline`)
- **OfflineBanner**: aviso quando sem internet
- **Botões desabilitados**: criação/edição bloqueada offline
