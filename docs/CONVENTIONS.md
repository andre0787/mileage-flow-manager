# 📏 Convenções de Código — MilesControl

> Índice. As seções foram fatiadas por categoria para lazy loading.
> Cada sessão carrega **apenas** o slice relevante (ver AGENTS.md — Regra #02).

## Categorias → Slices

| Categoria | Slices carregados |
|-----------|-------------------|
| feature | `conventions/common.md` + `conventions/feature.md` |
| bugfix | `conventions/common.md` + `conventions/bugfix.md` |
| refactor | `conventions/common.md` + `conventions/refactor.md` |
| workflow (todas) | `conventions/workflow.md` |

## Links

- [Convenções Comuns](conventions/common.md) — nomenclatura, organização, navegação, importações, escopo estrito
- [Convenções de Feature](conventions/feature.md) — React, shadcn/ui, providers, financeiro, estado, UI, config, estoque/cache, testes #24
- [Convenções de Bugfix](conventions/bugfix.md) — registro de bugs, debug
- [Convenções de Refactor](conventions/refactor.md) — DRY, órfãos #14, duplicados #15, scripts órfãos #16, novos .md #17, duplicados raiz #18
- [Convenções de Workflow](conventions/workflow.md) — handoff, relatório pós-impl, caixa de entrada, validação automática, limpeza, CI/CD, testes contra produção #25

## Observações

- `scripts/context-pack.mjs` agrega os slices ao gerar pacote seletivo de contexto.
- `rule-25-production-tests.mjs` lê a Regra #25 em `conventions/workflow.md`.
