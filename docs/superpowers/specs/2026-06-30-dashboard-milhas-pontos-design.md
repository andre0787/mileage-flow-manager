# Dashboard: Separação entre Milhas e Pontos

## Motivação

O Dashboard atualmente trata todo saldo/volume como "milhas", mas o modelo de dados já diferencia contas/programas entre `type: 'milhas'` e `type: 'pontos'`. A página de Contas e Entradas já respeitam essa diferença; o Dashboard precisa acompanhar.

## Abordagem escolhida

Abas: **Milhas** | **Pontos** (sem aba "Geral").

Receita/lucro/margem vêm exclusivamente de vendas de milhas — portanto aparecem apenas na aba Milhas, e também são exibidos na aba Pontos como referência (já que o financeiro é unificado).

## Comportamento por aba

### Aba Milhas

Tudo como hoje, mas filtrando **apenas** contas do tipo `milhas`:
- Hero: saldo milhas + entradas do mês (milhas) + milhas vendidas + custo médio/milha
- Side stats: margem média, receita total (ambos de milhas)
- Metric cards: Total Investido, Faturamento Mensal, Lucro Mensal, Margem de Lucro (tudo milhas)
- FlowMap presente
- DashboardCharts: Milhas por Programa + Vendas Mensais
- Secondary metrics: Contas Ativas (milhas), Vendas Pendentes, Alertas CPF
- Estoque por Dono (milhas) + Vendas Recentes

### Aba Pontos

Visão focada em investimento em pontos:
- Hero: saldo pontos + entradas do mês (pontos)
- Sub-metrics: "Total Investido (Pontos)", "Custo médio/ponto", "Contas Ativas (Pontos)"
- Side stats: ocultos (financeiro é só de milhas)
- Metric cards: ocultos (financeiro é só de milhas; investimento já aparece no hero)
- FlowMap: oculto (vendas só existem pra milhas)
- DashboardCharts: apenas "Pontos por Programa" (pizza), sem o gráfico de barras de vendas
- Secondary metrics: apenas "Contas Ativas (Pontos)"
- Estoque por Dono (Pontos) + Entradas Recentes (últimas entradas de pontos)

## O que NÃO muda

- Layout visual, cores, animações, design system
- DataContext, hooks (useDatabase), tipos TypeScript
- Fluxo de dados do Supabase
- Componentes shadcn/ui

## Mudanças necessárias

### `src/pages/Dashboard.tsx`
- Adicionar estado `activeTab: "milhas" | "pontos"`
- Adicionar Tabs (shadcn) no topo
- Filtrar accounts, entries, sales por type em cada aba
- Calcular métricas separadas para cada aba (useMemo)
- Render condicional de FlowMap, Charts, cards, tabelas conforme aba
- Rótulos dinâmicos: "milhas" vs "pontos" nos textos

### `src/components/FlowMap.tsx`
- Nenhuma mudança estrutural (já recebe props numéricas). Talvez mudar o título "Fluxo de Milhas" dinamicamente via prop opcional `unitLabel`.

### `src/components/DashboardCharts.tsx`
- Aceitar prop opcional `hideBarChart?: boolean` para ocultar o gráfico de vendas na aba Pontos.
- Aceitar prop opcional `title?: string` para "Milhas por Programa" vs "Pontos por Programa".

### `src/components/MetricCard.tsx`
- Nenhuma mudança necessária (já é genérico).

## Não escopo

- Alterações em Contas, Entradas, Vendas, Clientes, ControleCPF, Relatorios, Configuracoes
- Alterações em hooks/useDatabase.ts
- Alterações em tipos TypeScript
- Novas queries SQL ou migrations

## Próximos passos

1. Implementar as mudanças no Dashboard.tsx
2. Ajustar FlowMap.tsx para aceitar unitLabel opcional
3. Ajustar DashboardCharts.tsx para aceitar hideBarChart e title opcionais
