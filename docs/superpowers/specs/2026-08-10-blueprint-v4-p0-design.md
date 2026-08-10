# Design — Blueprint v4.0 P0: Infraestrutura Feature-First (grafo, sync-map, rules 40/41)

> Data: 2026-08-10 · Card: `docs/tasks/P3-26-blueprint-v4-p0.md`
> Categoria: refactor · Branch: `refactor/blueprint-v4-p0` · Origem: Blueprint MilesControl v4.0 (ground truth do usuário)

## Contexto

O Blueprint v4.0 (fornecido pelo usuário como "ground truth absoluto") define duas fases:

- **P0 — Eficiência de tokens e Code Review Graph:** gerar `.pi/logs/dependency-graph.json`
  via `generate-graph`, protocolo de validação de dependências circulares, e atualizar
  `.pi/logs/migration-status.json` a cada 3 arquivos migrados.
- **P1 — Arquitetura Feature-First com RTK Query:** migrar domínios para `src/features/`
  e substituir gradualmente TanStack React Query por RTK Query.

### Reconcilição com o estado real do repo (evidência coletada)

| Blueprint (assume) | Realidade no repo (2026-08-10) | Decisão |
|---|---|---|
| (legado) src/store/slices/authSlice.ts | **Não existe.** Auth viveu em src/contexts/AuthContext.tsx (removido na P1) | P1 migra de `contexts/AuthContext` → `src/features/auth/` |
| (legado) src/store/slices/milesSlice.ts | **Não existe.** Entradas/milhas em `src/hooks/useDatabase/entries.ts` + `src/lib/metrics.ts` | P1 migra de `hooks/useDatabase` → `src/features/entradas/` |
| (legado) src/components/cpf | **Não existe.** CPF em `src/pages/ControleCPF.tsx` | P1 migra de `pages/ControleCPF` → `src/features/controle-cpf/` |
| (legado) src/components/simulator | **Não existe.** Simulador dentro de `src/pages/Vendas.tsx` | P1 migra de `pages/Vendas` → `src/features/simulador-venda/` |
| `generate-graph.ts` (ts-morph) | ts-morph **não instalado**; repo usa scripts zero-dep ("ponytail") | `scripts/generate-graph.mjs` zero-dep, mesmo contrato |
| `sync-map.ts` | Não existe | `scripts/sync-map.mjs` zero-dep |
| Rules 40/41 | **Não existem** (só 1–39) | Criar `scripts/rules/rule-40-*.mjs` + `rule-41-*.mjs` + RULES.md + AGENTS.md |
| `.pi/logs/` | **Gitignored** (padrão `logs` no .gitignore) | Arquivos gerados são artefatos de runtime; scripts criam o diretório |
| RTK Query instalado | **Não.** Só `@tanstack/react-query ^5.56.2` | Instalação + migração ficam na **Fase P1** (um domínio por PR) |

### Regras do projeto aplicáveis

- **rule-28**: spec obrigatória no workflow refactor (este documento).
- **rule-16**: todo script em `scripts/` precisa de atalho npm.
- **rule-13**: toda regra no AGENTS.md precisa de script de validação → criar 40/41.
- **rule-17**: docs novos precisam estar no MAP.md (auto-heal do pre-pr cobre).
- **rule-38/39**: mudanças de código exigem evidência de subagente (`coding:done`, `code-review:done`).
- **rule-30**: outcome grade ≥ 80%.

## Abordagem

### Escopo desta sessão (P0 — um único PR)

Entregar **infraestrutura** completa da Fase P0 + fundação de governança (rules 40/41).
Nenhuma migração de domínio (P1) acontece neste PR — P1 vira task-cards separados
(política do ROADMAP: um item por PR).

### 1. `scripts/generate-graph.mjs` (zero-dep) — atalho npm `graph:generate`

Contrato (mesmo do blueprint, sem ts-morph):
- Lê `tsconfig.json` → resolve alias `@/*` → `./src/*`.
- Varre `src/**/*.{ts,tsx}` (exclui `src/vite-env.d.ts`, `.d.ts`).
- Para cada arquivo, extrai import statements (`from "..."`, `import("...")`, `require("...")`)
  e resolve para caminho relativo a `src/`:
  - `@/x` → `src/x` (via paths do tsconfig)
  - `./x`, `../x` → resolve relativo ao arquivo
  - bare imports (`react`, `@tanstack/...`) → ignorados (não fazem parte do grafo interno)
- Escreve `.pi/logs/dependency-graph.json`: `{ "file": ["dep1", ...], ... }` (ordenação estável).
- **Detecção de ciclos**: DFS com estados (0=não visitado, 1=em visita, 2=concluído);
  reporta cadeias circulares no stdout; exit 1 se `--check` e houver ciclo.
- Flags: `--dry-run` (não escreve arquivo, só imprime resumo), `DEBUG=true` (log detalhado).
- Cria `.pi/logs/` se não existir.
- **Artefatos**: `.pi/logs/dependency-graph.json`, `.pi/logs/migration-status.json` (inicializa
  com `{"fase":"P0","ultimaAtualizacao":..., "migrados":0}` se ausente).

### 2. `scripts/sync-map.mjs` (zero-dep) — atalho npm `map:sync`

- Gera árvore de diretórios de `src/` (pastas e arquivos `.ts`/`.tsx`, ignorando `ui/` internals? **não** — árvore completa de `src/`).
- Atualiza **somente** a seção delimitada do `docs/MAP.md`:
  `<!-- STRUCTURE-START -->` … `<!-- STRUCTURE-END -->` (se não existir, cria antes da seção "🤖 Índice Auto-Gerado").
- Nunca toca tabelas curadas nem o índice auto-gerado do pre-pr (evita conflito com rule-17).
- `--dry-run` imprime diff sem escrever.

### 3. `scripts/rules/rule-40-architect.mjs` — atalho npm `rule:40`

Regra #40 (Architect): *"Estrutura Feature-First: módulos em `src/features/[feature]`, barrel `index.ts`, RLS verificado"*.
Validações automáticas:
- **A (barrel)**: se `src/features/` existir, cada subdiretório de feature DEVE ter `index.ts`
  (barrel export). Falha se faltar.
- **B (RLS)**: para cada query `supabase.from("<tabela>")` em `src/features/*/` (service layer),
  verifica se `supabase/migrations/` contém `CREATE POLICY` / `USING (auth.uid())` referenciando
  `ON public.<tabela>`. Falha se a tabela não tiver política de RLS.
- **Vacuous pass** quando `src/features/` não existe (estado atual → não bloqueia P0).
- Modo fixture: `MOCK_ROOT` (padrão das rules do repo).

### 4. `scripts/rules/rule-41-optimizer.mjs` — atalho npm `rule:41`

Regra #41 (Optimizer): *"Hard limit de 150 linhas; extração de lógica para custom hooks antes de fragmentar UI"*.
Validações automáticas (**diff-scoped** — reconciliado com baseline legado):
- Arquivos **novos** (criados na branch) em `src/` com > 150 linhas → **fail**.
- Arquivos **modificados** na branch: se passarem de 150 linhas **e** a versão em `main` tinha ≤ 150 → **fail**.
- Arquivos legados que **já** excediam 150 em `main` (ex: `Dashboard.tsx` 1126, `EntryForm.tsx` 933)
  → **warning** (grandfathered), recomendando extração de hooks — não bloqueia (senão todo PR falharia).
- Base do diff: `git merge-base main HEAD` → `git diff --name-only <base> HEAD` (só `src/**/*.{ts,tsx}`).
- Modo fixture: `MOCK_ROOT` + `MOCK_BRANCH`.

### 5. Registros de governança

- `docs/RULES.md`: linhas 40 e 41 (tabela canônica).
- `AGENTS.md`: regras 40 e 41 no formato `40. **📐 Architect Gate** — ...` (rule-13 exige).
- `docs/MAP.md`: registrar este spec + card (rule-17; auto-heal do pre-pr também cobre).
- `.pi/logs/` é gitignored → artefatos não sujam `git status` (regra git status ZERO).

### 6. Testes

- `tests/unit/scripts-rules.test.ts` (padrão existente, MOCK_ROOT + fixtures em
  `scripts/rules/__fixtures__/`): casos rule-40 (barrel ok/faltando, RLS ok/faltando)
  e rule-41 (novo >150 fail, novo ≤150 pass, legado grandfather warning, vazio pass).
- `tests/unit/generate-graph.test.ts`: grafo com fixture de imports `@/` + relativo + bare,
  resolução de alias, detecção de ciclo (`--check` exit 1), `--dry-run` não escreve.
- Rodar: `npm run test` (bateria unit), `npm run lint`, `npm run typecheck`.

## Fluxo de dados

```
npm run graph:generate
  → varre src/**/*.{ts,tsx} (tsconfig paths @/ )
  → .pi/logs/dependency-graph.json + detecção de ciclos (--check)
npm run map:sync
  → árvore src/ → docs/MAP.md (seção STRUCTURE-START/END)
npm run rule:40 / rule:41
  → gates automáticos no pre-pr (auto-descoberta scripts/rules/)
```

## Critérios de aceite

- [ ] `npm run graph:generate` produz `.pi/logs/dependency-graph.json` com resolução `@/` correta e sem bare imports internos.
- [ ] `npm run graph:generate -- --check` exit 1 quando há ciclo (fixture), exit 0 sem ciclo.
- [ ] `npm run map:sync` atualiza só a seção delimitada do `docs/MAP.md`.
- [ ] `npm run rule:40` e `npm run rule:41` passam na branch atual (vacuous/grandfathered) e falham nos fixtures negativos.
- [ ] Atalhos npm existem para os 4 scripts (rule-16) e `npm run pre-pr` verde.
- [ ] RULES.md + AGENTS.md registram regras 40/41; rule-13 ok.

## Não-objetivos (P1 — cards futuros)

- Instalar `@reduxjs/toolkit`/`react-redux` ou migrar queries (TanStack → RTK Query).
- Criar `src/features/*` (vira card por domínio: auth, entradas, contas, clientes, vendas, controle-cpf, relatorios, simulador-venda, dashboard).
- Migração de `contexts/` para slices.
- Proibição de escopo (blueprint §6): nenhuma lib de UI nova; somente infra de milhas/vendas/CPF.
