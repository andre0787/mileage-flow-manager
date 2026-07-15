# Gerenciamento de Contexto

> Estratégia para maximizar a eficiência de agentes de IA no projeto,
> reduzindo ruído e melhorando a qualidade de raciocínio.

## O Problema

Agentes de IA iniciam sessões carregando ~79KB / ~2.000 linhas de documentação,
consumindo ~20K tokens antes de qualquer trabalho real. Isso causa:
- **Lost in the middle:** informações relevantes se perdem no ruído
- **Erros de interpretação** de regras
- **Degradação de raciocínio** em modelos menores

## A Solução

### Lazy Loading por Categoria

O projeto usa um sistema de categorias para carregar APENAS os docs relevantes:

| Categoria | Docs Carregados |
|-----------|-----------------|
| feature | WORKFLOW.md + CONVENTIONS.md |
| bugfix | DEBUG.md + CONVENTIONS.md |
| docs | (só AGENTS.md) |
| refactor | CONVENTIONS.md + ARCHITECTURE.md |
| chore | (só AGENTS.md) |

### Hub Compacto (AGENTS.md)

O AGENTS.md foi reduzido de ~9KB para ~3KB contendo apenas:
- Mapa de conhecimento (tabela de docs com tamanhos)
- 7 regras essenciais
- Tabela de categorias
- Workflow mínimo (6 passos)

### Snapshot Automático (handoff.md)

O handoff.md contém no topo um snapshot do projeto gerado automaticamente
pelo `npm run handoff:snapshot`, incluindo stack, estrutura, regras críticas,
bugs abertos e commits recentes.

## Scripts de Validação

| Nº | Script | O que valida |
|----|--------|-------------|
| — | `rule-02-category-loading.mjs` | Docs carregados correspondem à categoria |
| — | `rule-03-handoff-completeness.mjs` | handoff.md tem todos os campos obrigatórios |
| — | `rule-20-no-agenda-load.mjs` | Nenhum script referencia AGENDA.md |

## Benefícios

- **~85% menos consumo de contexto** na inicialização (79KB → 12KB)
- **Modelos menores** conseguem seguir as regras corretamente
- **Tempo de raciocínio reduzido** — menos ruído = decisões mais rápidas
- **Escalável** — novas categorias adicionadas sem aumento de custo

## Para Modelos Menores

Este projeto foi projetado para funcionar com modelos de contexto limitado.
As validações automáticas (pre-pr, pre-commit hooks) garantem que mesmo
modelos com pouca capacidade de contexto sigam as regras corretamente.
