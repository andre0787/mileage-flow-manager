# Upgrade React 19 + react-router 8 — Especificação de Design

> **Data:** 2026-08-03
> **Status:** design (workflow refactor)
> **Categoria:** refactor
> **P1 (roadmap):** `docs/ROADMAP.md` — GHSA-qwww-vcr4-c8h2 + npm audit
> **Radar:** `docs/RADAR.md` — `react-router@7.18.2` no range `>=7.12.0 <8.3.0`

## Objetivo

Eliminar as vulnerabilidades ativas de produção via upgrade major:

| Pacote | Atual | Objetivo | Advisory |
|---|---|---|---|
| `react-router-dom` | `7.18.2` | `react-router@8.3.0` (pacote único, DOM no export `./dom`) | GHSA-qwww-vcr4-c8h2 (RSC CSRF) |
| `react` | `18.3.1` | `19.2.8` | peer obrigatório do router 8 |
| `react-dom` | `18.3.1` | `19.2.8` | peer obrigatório do router 8 |

Isso também zera `npm audit --omit=dev` (2 high: brace-expansion e fast-uri são transitivos de tooling — revalidar após o upgrade).

## Motivação (INTENT)

**Código faz:** o app é SPA clássica com `BrowserRouter/Routes/Route` declarativo; sem RSC/SSR, o vetor do GHSA (RSC Mode CSRF) **não é alcançável** — ver RADAR. Mas a dependência permanece no range vulnerável.
**Teste espera:** política de dependências rejeita `react-router <8.3.0` e `react <19`; suíte 381+ verde; build ok.
**Spec diz:** upgrade major duplo, DRY via migration de imports `react-router-dom` → `react-router`, teste de política em `scripts/lib/project-audit.mjs` + test unitário.

## Restrições

- **Looped de riscos controlado:** `react-router-dom` NÃO tem v8 no registry — v8 unifica tudo no core `react-router` (export `./dom` + index com BrowserRouter/NavLink/useNavigate/MemoryRouter — confirmado no tarball 8.3.0).
- Todas as libs dependentes validam React 19 (recharts, react-query, sonner, vaul, next-themes, lucide, radix — verificado via peerDeps).
- Política de dependência nova: regra de auditoria **read-only** (reaproveita `check-radar.mjs`/`npm audit`, sem `--fix`).
- Não tocar em `vercel/tools` com commit de linha no lock.
- Preservar `public/kpi-data.json`, reports e tracking (histórico).

## Design

### 1. Dependências (`package.json`)

- Remover `react-router-dom`; adicionar `react-router@^8.3.0`.
- `react`/`react-dom`: `^19.2.8`; `@types/react`/`@types/react-dom`: `^19`.
- `npm install` (sem `--force`; peer resolution automática).
- `npm audit --omit=dev` deve sair zero high/critical no radar.

### 2. Imports (migração oficial 7→8)

`react-router-dom` → `react-router` em 13 arquivos (`src/pages/*`, `src/components/*`, `src/hooks/*`, `src/App.tsx`, `src/components/tests/GlobalSearch.test.tsx`). O core 8 reexporta exatamente os símbolos usados (`BrowserRouter`, `Routes`, `Route`, `useLocation`, `useNavigate`, `Link`, `NavLink`, `Navigate`, `MemoryRouter`).

### 3. Política de dependência (guarda da regressão)

Escrever check **read-only** em `scripts/lib/project-audit.mjs` (ou helper novo com test unit):

- Parse `package.json` (deps + devDeps).
- Regras: `react-router >= 8.3.0`; `react >= 19`; proibido `react-router-dom` direto.
- Saída: achados com `category/path/reason`; `--strict` exit 1 em falha.
- Teste TDD: fixture com versão vulnerável falha; versão ok passa; `react-router-dom` presente → falha.

### 4. Docs

- Atualizar `docs/RADAR.md` (remover react-router da tabela ativa após lock verde; manter histórico do advisório resolvido — não reclassificar passado).
- Registrar migration no `docs/CONVENTIONS.md` (seção de dependências/idades) e roadmap P1 → done.
- `docs/superpowers/specs/2026-08-03-react-router-8-upgrade-design.md` (este arquivo).

## Critérios de Aceite

1. `npm audit --omit=dev` — 0 vulnerabilities de high/critical (radar limpo nos 3 pacotes ou 2 tooling).
2. `npm run check` verde (typecheck, lint, format, unit, verify-docs, build).
3. Suite 391 testes (RED→GREEN do teste de política primeiro).
4. Radars ativo: nenhum pacote no range vulnerável dos advisories ativos.
5. Deploy em produção após merge (Vercel bot), HTTP 200, kpi-data servido.

## Riscos / Mitigações

- Breaking visual de shadcn com React 19: mitigado pelas libs locales (radix 19 ok); rodar suíte de componentes.
- `vite@6` + React 19: compatível (plugin-react já usa jsx transform automático).
- Lockfile muda ~pacotes; revisão por commit único e `git diff --stat` antes do PR.