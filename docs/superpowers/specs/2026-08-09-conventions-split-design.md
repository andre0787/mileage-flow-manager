# Fatiar CONVENTIONS.md em slices por categoria — Design

## Contexto

`docs/CONVENTIONS.md` tem 750 linhas / ~29.5KB e é carregado inteiro por
feature, bugfix e refactor (lazy loading via AGENTS.md). A auditoria
(AUDIT-WORKFLOW-2026-08-09, item 4.3.1) recomenda fatiar por categoria para
que cada sessão carregue apenas o slice relevante (~5-10KB em vez de 29.5KB).

## Decisão

Criar `docs/conventions/` com slices por categoria e manter `docs/CONVENTIONS.md`
como **índice compacto** (tabela de categorias → slices + links). Atualizar o
`CATEGORY_MAP`/`DOCS_CARREGADOS` (mesmo mapa) em 3 scripts para carregar os
slices certos.

## Mapeamento de seções (30 headings → slices)

| Slice | Seções |
|-------|--------|
| `conventions/common.md` | Nomenclatura, Organização de Código, Navegação de Código, Importações, Escopo Estrito, Observações Gerais |
| `conventions/feature.md` | React & Estado, shadcn/ui, Hierarquia de Providers, Invariantes Financeiras, Imutabilidade de Estado, Promessas de UI, Config Global, Estoques e Cache (#19/#20), Testes com Uso Real (#24) |
| `conventions/bugfix.md` | 🐞 Registro de Bugs, Debug |
| `conventions/refactor.md` | DRY & Modularidade, Arquivos Órfãos (#14), Código Duplicado (#15), Scripts Órfãos (#16), Novos .md Válidos (#17), Arquivos Duplicados Raiz/Docs (#18) |
| `conventions/workflow.md` | Handoff Pós-PR, Relatório Pós-Impl, 💭 Caixa de Entrada, Validação Automática de Regras, Limpeza Pós-Sessão, CI/CD & Verificação, Testes Contra Produção (#25), Regras #02/#03/#20/#26/#27/#28 |

## Novo CATEGORY_MAP (idêntico nos 3 scripts)

```
feature: ["WORKFLOW.md", "conventions/common.md", "conventions/feature.md"]
bugfix:  ["DEBUG.md", "conventions/common.md", "conventions/bugfix.md"]
docs:    ["AGENTS.md"]
refactor:["conventions/common.md", "conventions/refactor.md", "ARCHITECTURE.md"]
chore:   ["AGENTS.md"]
```

## Arquivos alvo

| Arquivo | Mudança |
|---------|---------|
| `docs/conventions/{common,feature,bugfix,refactor,workflow}.md` | **novos** — seções movidas |
| `docs/CONVENTIONS.md` | reescrito como índice compacto (~40 linhas) |
| `scripts/session-start.mjs` | `DOCS_CARREGADOS` novo mapa |
| `scripts/lib/session-heal.mjs` | idem |
| `scripts/rules/rule-02-category-loading.mjs` | `CATEGORY_MAP` novo mapa |
| `scripts/rules/rule-02-grid.mjs` | verificar mapa (se duplicado) |
| `scripts/rules/rule-25-production-tests.mjs` | Regra #25 agora em `conventions/workflow.md` |
| `scripts/context-pack.mjs` | `CONVENTIONS_PATH` → `docs/conventions/` (lê todos os slices; seções por heading continuam funcionando) |
| `scripts/verify-docs.mjs` | entryDocs: manter `docs/CONVENTIONS.md` (índice) + adicionar `docs/conventions/common.md` |
| `docs/CONTEXT-MANAGEMENT.md` | tabela lazy loading atualizada |
| `AGENTS.md` | tabela de lazy loading (Regra #02) atualizada |
| `docs/MAP.md` | auto-registro dos novos docs via rule-17 |

## Restrições

- `rule-25-production-tests.mjs` deve continuar achando "Regra #25" (agora em
  `docs/conventions/workflow.md`) — atualizar o path.
- `context-pack.mjs` extrai seções por heading — deve funcionar lendo todos os
  arquivos de `docs/conventions/` (agregar antes de extrair).
- `rule-02` fixtures (`__fixtures__/handoff/valid|invalid-category`) usam
  "WORKFLOW.md, CONVENTIONS.md" — manter compatibilidade: o mapa novo ainda
  aceita "CONVENTIONS.md"? **Não** — atualizar fixtures para os slices novos.
- Zero deps, ponytail mode.
- Regra #17: novos .md devem estar no MAP.md (auto-registro no pre-pr).
- rule-29: AGENTS.md/CONVENTIONS.md são monitorados — rodar `prompt:manifest`.

## Validação

- `node scripts/rules/rule-02-category-loading.mjs` passa com handoff real (categoria refactor → conventions/common.md, conventions/refactor.md, ARCHITECTURE.md).
- `node scripts/rules/rule-25-production-tests.mjs` passa (Regra #25 em workflow.md).
- `node scripts/context-pack.mjs --task <id>` ainda extrai seções (agregação).
- `npx vitest run tests/unit/scripts-rules.test.ts` verde (fixtures atualizadas).
- pre-pr --strict 0 errors.
- Slices têm referência cruzada (índice CONVENTIONS.md linka cada slice).
