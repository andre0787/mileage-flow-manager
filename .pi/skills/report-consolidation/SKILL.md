---
name: report-consolidation
description: Use when asked for a summary of delivered value over a period (day/week/sprint) — generate ONE executive report with Detalhamento por item at PR level instead of stitching multiple session reports
---

# Report Consolidation

## Overview

Quando o executivo pergunta "o que foi entregue ontem/esta semana?", NÃO colete relatórios de sessão individuais. Gere **um** briefing consolidado com 1 linha por PR (título real + benefício/impacto por tipo + custo de token agregado).

**Core principle:** 1 PR = 1 linha. Nunca liste commits nem repita narrativas de sessão.

## When to Use

- "Resumo do que fizemos ontem/hoje/na semana"
- Preparação de apresentação executiva (deck para líderes)
- Fechamento de sprint/retro

**Don't use** para: relatório de UMA sessão específica (use `npm run report`).

## Workflow

```bash
# Intervalo de datas (padrão: ontem..hoje)
npm run report:consolidate -- --from YYYY-MM-DD --to YYYY-MM-DD --write

# Ou lista explícita de PRs
npm run report:consolidate -- --prs 348,349,350 --write
```

O relatório sai em `docs/reports/<to>/PR-CONSOLIDADO-*.html` com:

- **Detalhamento por item** — 1 linha por PR (Item = PR #N, Correção = título real, Benefício/Impacto por tipo, Custo Token agregado)
- **KPIs** — total de PRs, breakdown por tipo (feat/fix/refactor/docs/chore), timeline de merges
- **BLUF executivo** — resumo em 1 parágrafo com números

## Executive Narrative

Na resposta ao usuário, apresente APENAS:

1. Total de entregas + janela (ex.: "21 PRs (12–13/08)")
2. Breakdown por tipo (ex.: 8 feat · 6 fix · 3 refactor · 3 chore)
3. Tabela enxuta: PR | Entrega | Benefício | Custo (as 5-8 de maior valor)
4. Link do relatório completo

## Common Mistakes

| Mistake                       | Cost                    | Fix                                    |
| ----------------------------- | ----------------------- | -------------------------------------- |
| Copiar 5 relatórios de sessão | Duplicação + tokens     | 1 consolidado por período              |
| Listar commits                | Ruído para executivo    | `derivePrRows` agrega por PR           |
| Narrativa manual de impacto   | Inconsistência          | Script mapeia por tipo automaticamente |
| Esquecer o link               | Usuário não acha o deck | Sempre informar o path do HTML         |
