# Task Card — Budgets de bundle, tempo e flakiness

| Campo | Valor |
|-------|-------|
| `id` | P2-19 |
| `categoria` | chore |
| `onda` | P2 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #19 |
| `dependeDe` | [P1-14] |

## Objetivo
Adicionar budgets de bundle, tempo de testes e flakiness; falhar apenas em
regressões relevantes, com baseline versionado.

## Não objetivos
- Falhar em deltas minúsculos (apenas regressões relevantes).

## Contexto
Hoje o bundle de produção tem ~1,39 MB precacheado com chunks >500 kB e nenhum
budget bloqueante (veredito, evidências). Sem baseline versionado, não há como
detectar regressão automaticamente.

## Arquivos permitidos
- `vite.config.*` / `scripts/budget-check.*`
- `package.json` (atalho)
- baseline versionado (ex.: `docs/baselines/bundle.json`)

## Critérios de aceite
- [ ] Budget de bundle (precache + chunks) definido e versionado.
- [ ] Budget de tempo de `check:fast`/`check:pr` registrado.
- [ ] Regressão acima do threshold falha o check.
- [ ] Baseline pode ser atualizado via commit explícito (não automático).

## Riscos / Invariantes
- Não bloquear adições legítimas sem caminho de bump.

## Testes obrigatórios
- `npm run check:pr` com budget verde.
- Demonstração de falha ao estourar budget.

## Evidência de pronto
- Baseline + diff de check com regressão simulada.
