# Task Card — Blueprint v4.0 P1: Fundação Feature-First + domínio auth

| Campo | Valor |
|-------|-------|
| `id` | P3-27 |
| `categoria` | refactor |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | done |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P1, item 1 |
| `dependeDe` | P3-26 (infraestrutura P0) |
| `capability` | implementation |

## Objetivo
Instalar `@reduxjs/toolkit` + `react-redux`, criar a fundação Feature-First
(`src/features/store.ts` + `src/features/api/baseApi.ts` com RTK Query) e migrar o
**primeiro domínio (auth)**: (legado) src/contexts/AuthContext.tsx → `src/features/auth/`
(slice de estado + barrel `index.ts` + provider compatível), mantendo o contrato
público `useAuth()` intacto para os 17 consumidores atuais.

## Não objetivos
- Migrar domínios de dados (entradas, contas, clientes, vendas, alerts,
  owners, programs, origem-types) — cards P3-28..P3-35, um por PR.
- Substituir TanStack React Query nos hooks `useDatabase/*` (P3-28+).
- Nenhuma lib de UI nova (proibição de escopo Blueprint §6).

## Contexto
- Realidade atual: (legado) src/contexts/AuthContext.tsx (provider + hook) com 17 consumidores.
- `App.tsx` envolve tudo com `QueryClientProvider` + `AuthProvider`; `main.tsx` renderiza `<App />`.
- RTK disponível: `@reduxjs/toolkit` 2.12.0, `react-redux` 9.3.0 (não instalados).
- Spec de reconciliação: `docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md`
  (tabela: auth migra de `contexts/AuthContext` → `src/features/auth/`).
- rule-40 (Architect) agora é **ativo** quando `src/features/` existir: cada feature
  precisa de barrel `index.ts`.
- rule-31/32: libs e hooks customizados novos exigem teste unitário.

## Arquivos permitidos
- `package.json` (adicionar `@reduxjs/toolkit`, `react-redux`)
- `package-lock.json` (lockfile atualizado)
- `src/features/store.ts` (novo — `configureStore` + hooks tipados)
- `src/features/api/baseApi.ts` (novo — `createApi` RTK Query base)
- `src/features/api/index.ts` (novo — barrel da feature api, exigido pela rule-40)
- `src/features/auth/index.ts` (novo — barrel, rule-40)
- `src/features/auth/authSlice.ts` (novo — slice de estado de autenticação)
- `src/features/auth/AuthProvider.tsx` (novo — provider que conecta Supabase auth ao slice)
- (legado) src/contexts/AuthContext.tsx (remover — migrado; consumidores passam a usar `@/features/auth`)
- `src/App.tsx` (adicionar `<Provider store={store}>`)
- `src/components/ProtectedRoute.tsx` (import de `@/features/auth` se necessário)
- `src/pages/Login.tsx` (import de `@/features/auth`)
- `src/pages/ForgotPassword.tsx` (import de `@/features/auth`)
- `src/pages/ResetPassword.tsx` (import de `@/features/auth`)
- `src/pages/Perfil.tsx` (import de `@/features/auth`)
- `src/components/AppSidebar.tsx` (import de `@/features/auth`)
- `src/components/FeedbackDialog.tsx` (import de `@/features/auth`)
- `src/contexts/DataContext.tsx` (só import de `useAuth` → `@/features/auth`)
- `src/hooks/useDatabase/shared.ts` (só import de `useAuth` → `@/features/auth`)
- (removido) o hook de owners: seus conteúdos migrados para `src/features/owners/`; agora apenas o import de `useAuth` vem de `@/features/auth`.
- (removido) o hook de programs: seus conteúdos migrados para `src/features/programs/`; agora apenas o import de `useAuth` vem de `@/features/auth`.
- `src/hooks/useDatabase/origemTypes.ts (removido)` (só import de `useAuth` → `@/features/auth`)
- (legado) `src/features/contas/index.ts` passou a concentrar o domínio de contas após P3-29
- `src/features/entradas/` (domínio migrado em P3-28; referência histórica ao hook legado que só importava `useAuth` → `@/features/auth`)
- (removido) src/hooks/useDatabase/sales.ts (migração concluída em P3-31)
- `src/features/clientes/` (domínio migrado em P3-30; referência histórica ao hook legado que só importava `useAuth` → `@/features/auth`)
- `tests/unit/auth-slice.test.ts` (novo — teste do slice + store)
- `tests/unit/features-auth.test.ts` (novo — teste do provider/hook)
- `docs/MAP.md` (registro da spec/card — rule-17)
- `docs/tasks/ROADMAP.md` (estado do card)
- `docs/RADAR.md` (artefato gerado)
- `docs/tracking/events.jsonl` (artefato gerado)
- `docs/tracking/quality.jsonl` (artefato gerado)
- `docs/handoff.md`
- `docs/ARCHITECTURE.md` (drift: remover AuthContext da árvore)
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md` (refs sem backticks)
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-foundation-auth-design.md` (nova spec — rule-28)
- `docs/tasks/P3-26-blueprint-v4-p0.md` (estado done — P0 concluída)

## Critérios de aceite
- [ ] `@reduxjs/toolkit` + `react-redux` em `package.json` (sem lib de UI nova).
- [ ] `src/features/auth/` com barrel `index.ts` (rule-40 passa com `src/features/` presente).
- [ ] `useAuth()` com a MESMA interface de `AuthContextType`; nenhum import restante de `@/contexts/AuthContext`.
- [ ] (legado) src/contexts/AuthContext.tsx removido (sem reexport stub).
- [ ] Testes novos verdes (`auth-slice`, `features-auth`) + suíte completa (`npm run test`), `lint`, `typecheck`.
- [ ] `npm run rule:40` passa; grafo de dependências regenerado (`npm run graph:generate`).

## Riscos / Invariantes
- Contrato público `useAuth()` é invariante — consumidores (17) não mudam de assinatura.
- `src/features/api/baseApi.ts` é placeholder sem endpoints (P3-28+ injeta) — manter referenciado
  (barrel `api/index.ts` + reexport no store) para não violar a rule-14 (sem órfãos em `src/`).
- Nenhuma lógica de Supabase dentro do slice (o provider faz `dispatch`) — separação slice/provider.
- Proibição de libs de UI novas (Blueprint §6) — RTK é estado, não UI.
- Sem `console.log` em `src/` (rule-30).

## Testes obrigatórios
- `npm run test` (unit — slice auth, store, provider), `npm run lint`, `npm run typecheck`
- `npm run rule:40` (features/ com barrel), `npm run pre-pr`

## Evidência de pronto
- Spec `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-foundation-auth-design.md`
- `npm run pre-pr` verde; PR único para `main` com eventos `coding:done`/`code-review:done`
  (subagent:true).
