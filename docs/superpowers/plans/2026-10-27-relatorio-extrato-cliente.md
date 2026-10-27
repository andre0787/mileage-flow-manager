# Relatório completo do cliente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Exibir na aba Cobrança o extrato completo de cada cliente, resumo de recebido e saldo final, com vendas e movimentos de crédito em ordem decrescente de data.

**Architecture:** Estender o agregador puro de `src/lib/collections.ts` para montar saldos e atividades de cliente a partir das vendas e do ledger já carregados. A seção de cobrança exibirá esse agregado e exportará as mesmas atividades, ignorando os filtros da página para preservar o histórico completo.

**Tech Stack:** React, TypeScript, TanStack Query/RTK Query existente, Supabase existente, Vitest.

**Decision record:** [`Council verdict`](../../council/2026-10-27-historico-cobranca-veredito.md).

## Global Constraints
- Não alterar schema nem mutations financeiras.
- Excluir vendas canceladas; preservar todas as demais vendas e movimentos de crédito.
- Nunca contar movimento do ledger duas vezes no saldo final.
- Ordenar todo lançamento por data decrescente.
- Manter cada arquivo novo/alterado sob o limite de 150 linhas aplicável.
- Não tocar nos arquivos locais preexistentes fora do escopo da feature.

---

### Task 1: Agregador do extrato completo

**Files:**
- Modify: `src/lib/collections.ts`
- Test: `tests/unit/collections.test.ts`

**Interfaces:**
- Consumes: `CollectionSale[]`, `ClientCredit[]`.
- Produces: uma linha por cliente com vendas não canceladas, ledger completo, totais de vendido/recebido/pendente/crédito disponível e saldo final assinado; atividades ordenadas mais recente primeiro.

- [ ] Cobrir venda quitada e pendente, cancelada omitida, créditos `earn`/`spend`/`reversal`, cliente com apenas créditos, saldo final devedor/credor e ordenação decrescente.
- [ ] Implementar o agregado e preservar compatibilidade necessária à exportação existente.

### Task 2: Resumo, histórico e CSV

**Files:**
- Modify: `src/components/reports/CollectionSection.tsx`
- Modify: `src/pages/Relatorios.tsx`
- Test: testes de relatório existentes, se houver cobertura direta do componente.

**Interfaces:**
- Consumes: agregado de Task 1 com todas as vendas carregadas e movimentos de crédito.
- Produces: painel por cliente com resumo sempre visível, histórico expandido em ordem decrescente e CSV com mesmos lançamentos e saldo final.

- [ ] Passar para Cobrança vendas sem filtros de período, dono ou programa; manter os filtros originais para as demais abas.
- [ ] Renderizar resumo e lançamentos detalhados, explicitando débitos, movimentos de crédito e saldo final devedor/credor.
- [ ] Atualizar CSV para espelhar histórico completo, ordem e resumo de fechamento.
