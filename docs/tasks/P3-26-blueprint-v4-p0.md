# Task Card — Blueprint v4.0 P0: Infraestrutura Feature-First

| Campo | Valor |
|-------|-------|
| `id` | P3-26 |
| `categoria` | refactor |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | implementing |
| `origem` | Blueprint MilesControl v4.0 (ground truth do usuário), fase P0 |

## Objetivo
Entregar a infraestrutura da Fase P0 do Blueprint v4.0: `generate-graph.mjs`
(grafo de dependências com resolução `@/` + detecção de ciclos), `sync-map.mjs`
(sincroniza árvore `src/` com docs/MAP.md em seção delimitada), rules 40/41
(Architect + Optimizer) com validação automática e atalhos npm.

## Não objetivos
- Instalar RTK Query / migrar queries (Fase P1 — cards por domínio).
- Criar `src/features/*` (P1).
- Migrar `contexts/` para slices (P1).

## Contexto
Blueprint v4.0 referencia caminhos legados que não existem (`src/store/slices/*`,
`src/components/cpf|simulator/*`). Realidade: `src/contexts/` + `src/hooks/useDatabase`
(React Query) + `src/pages/`. Spec de reconciliação:
`docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md`.

## Arquivos permitidos
- `scripts/generate-graph.mjs` (novo)
- `scripts/sync-map.mjs` (novo)
- `scripts/rules/rule-40-architect.mjs` (novo)
- `scripts/rules/rule-41-optimizer.mjs` (novo)
- `scripts/rules/__fixtures__/*` (novo, fixtures de teste)
- `tests/unit/generate-graph.test.ts` (novo)
- `tests/unit/scripts-rules.test.ts` (estender)
- `package.json` (atalhos npm: `graph:generate`, `map:sync`, `rule:40`, `rule:41`)
- `docs/RULES.md` (linhas 40/41)
- `AGENTS.md` (regras 40/41)
- `docs/MAP.md` (registro de spec/card)
- `docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md` (já criado)
- `.pi/logs/` (runtime, gitignored)
- `docs/RADAR.md` (artefato gerado pela sessão)
- `docs/tracking/events.jsonl` (artefato gerado pela sessão)
- `docs/tracking/quality.jsonl` (artefato gerado pelo pre-pr)

## Critérios de aceite
- [ ] `npm run graph:generate` gera `.pi/logs/dependency-graph.json` com resolução `@/` correta (sem bare imports internos).
- [ ] `--check` exit 1 em fixture com ciclo; exit 0 sem ciclo; `--dry-run` não escreve.
- [ ] `npm run map:sync` atualiza só a seção `STRUCTURE-START/END` do docs/MAP.md.
- [ ] `npm run rule:40`/`rule:41` passam na branch (vacuous/grandfathered) e falham em fixtures negativos.
- [ ] RULES.md + AGENTS.md com regras 40/41; rule-13 ok; `npm run pre-pr` verde.

## Riscos / Invariantes
- Baseline legado (>150 linhas em main) NÃO pode bloquear PRs (rule-41 diff-scoped).
- `.pi/logs/` é gitignored — artefatos não sujam git status.
- Nenhuma mudança em `src/` neste PR.

## Testes obrigatórios
- `npm run test` (unit), `npm run lint`, `npm run typecheck`
- `npm run pre-pr`

## Evidência de pronto
- Spec `2026-08-10-blueprint-v4-p0-design.md`, relatório pre-pr, PR único para `main`.
