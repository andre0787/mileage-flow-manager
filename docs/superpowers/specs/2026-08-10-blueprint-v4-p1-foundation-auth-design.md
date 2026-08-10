# Design — Blueprint v4.0 P1: Fundação Feature-First + domínio auth

> Data: 2026-08-10 · Card: `docs/tasks/P3-27-blueprint-v4-p1-foundation-auth.md`
> Categoria: refactor · Branch: `refactor/blueprint-v4-p1` · Origem: Blueprint MilesControl v4.0 (ground truth do usuário), fase P1

## Contexto

O Blueprint v4.0 define a Fase P1 como a migração para **arquitetura Feature-First**
(`src/features/[domínio]`) com **RTK Query** substituindo gradualmente TanStack React Query,
um domínio por PR (política do ROADMAP). A Fase P0 (P3-26, merged) entregou a infraestrutura:
`generate-graph.mjs`, `sync-map.mjs` e as rules 40/41 — a rule-40 (Architect) exige barrel
`index.ts` em cada feature a partir do momento em que `src/features/` existir.

### Realidade atual (evidência coletada em 2026-08-10)

| Item | Estado |
|---|---|
| (legado) src/contexts/AuthContext.tsx (removido na P1) | Provider + hook `useAuth()`; **17 consumidores** em `src/` |
| `src/contexts/DataContext.tsx` | Agrega hooks `useDatabase/*` (TanStack React Query) |
| `src/hooks/useDatabase/*` | 9 módulos de hooks (owners, programs, origemTypes, accounts, entries, sales, clients, alerts, shared) — **não migram neste PR** |
| `@reduxjs/toolkit` / `react-redux` | **Não instalados** (disponíveis: 2.12.0 / 9.3.0) |
| `@tanstack/react-query` | ^5.56.2 — permanece até P3-28+ |
| `src/features/` | **Não existe** — criado neste PR |

### Decisão de design: auth primeiro

Auth é o domínio ideal para o PR de fundação porque:
1. **Não depende de TanStack React Query** (usa `supabase.auth` diretamente) — a migração
   para Redux slice é isolada e reversível.
2. É o alicerce dos demais domínios (todos os hooks `useDatabase` leem `useUserId()`).
3. Prova o padrão completo (store + slice + provider + barrel) com impacto controlado.

### Contrato público preservado

`useAuth()` continua exportando a **mesma interface** para não quebrar consumidores:

```ts
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email, password) => Promise<string | null>;
  signUp: (email, password, name) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email) => Promise<string | null>;
  updatePassword: (newPassword) => Promise<string | null>;
}
```

## Abordagem

### 1. Instalação (rule: nenhuma lib de UI nova — RTK não é UI, é estado)

```
npm install @reduxjs/toolkit react-redux
```

### 2. `src/features/store.ts` (novo)

- `configureStore` com `reducer: { auth: authReducer }` + middleware default (thunk).
- Hooks tipados `useAppDispatch` / `useAppSelector` (padrão RTK TS).

### 3. `src/features/auth/authSlice.ts` (novo)

Slice `auth` com estado `{ user, session, loading }`:
- `setSession` (user + session), `setLoading`, `clear`.
- Seletores derivados (user, session, loading) exportados.
- **Sem lógica de Supabase aqui** — o provider chama `dispatch` (padrão ponytail do repo).

### 4. `src/features/auth/AuthProvider.tsx` (novo)

Migra a lógica de `AuthContext.tsx`:
- `useEffect`: `supabase.auth.getSession()` + `onAuthStateChange` (com o mesmo guard
  `initialized.current` anti-race) → `dispatch(setSession(...))`.
- `signIn/signUp/signOut/resetPassword/updatePassword` idênticos, chamando
  `supabase.auth.*` e retornando `error?.message ?? null`.
- Exporta `useAuth()` (mesma interface) que lê do store via `useAppSelector`.

### 5. `src/features/auth/index.ts` (novo — barrel, rule-40)

Reexporta `AuthProvider`, `useAuth`, `authReducer`, seletores.

### 6. Integração

- `src/App.tsx`: envolver `<App />` internamente com `<Provider store={store}>` (mais simples
  que mexer no `main.tsx` try/catch); `AuthProvider` continua no mesmo lugar da árvore.
- Todos os 17 consumidores: trocar `import { useAuth } from "@/contexts/AuthContext"`
  por `import { useAuth } from "@/features/auth"`.
- **Remover** (legado) src/contexts/AuthContext.tsx (sem reexport stub — proibição de código morto).

### 7. Testes (rule-31/32)

- `tests/unit/auth-slice.test.ts`: reducer puro (setSession/setLoading/clear), seletores.
- `tests/unit/features-auth.test.ts`: provider + hook com mock de `@/lib/supabase`
  (`vi.mock`) — getSession resolve, signIn/Out chamam supabase e retornam erro/null.
- Rodar bateria completa + lint + typecheck + `rule:40` (barrel presente → passa).

## Fluxo de dados

```
App.tsx → <Provider store={store}> → AuthProvider (supabase.auth) → dispatch(setSession)
consumidores → useAuth() → useAppSelector(selectAuth) → user/session/loading
actions (signIn/signUp/...) → supabase.auth.* → dispatch(setSession) → UI
```

## Critérios de aceite

- [ ] `@reduxjs/toolkit` + `react-redux` em `package.json` (sem UI nova).
- [ ] `src/features/auth/` com barrel `index.ts` (rule-40 passa).
- [ ] `useAuth()` com mesma interface; **nenhum import restante** de (legado) @/contexts/AuthContext.
- [ ] (legado) src/contexts/AuthContext.tsx removido.
- [ ] Testes novos verdes + suíte completa (`npm run test`), lint, typecheck.
- [ ] `npm run rule:40` passa; `npm run pre-pr` verde; PR único para `main`.

## Não-objetivos (cards futuros)

- Migração de `hooks/useDatabase/*` → RTK Query (P3-28 entradas, P3-29 contas, P3-30 clientes,
  P3-31 vendas, P3-32 controle-cpf, P3-33 relatorios, P3-34 simulador-venda, P3-35 dashboard).
- Substituição de TanStack React Query por RTK Query nos domínios de dados.
- Nenhuma lib de UI nova (Blueprint §6).
