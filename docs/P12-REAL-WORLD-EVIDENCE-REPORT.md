# P12 — Real-World Evidence Report

> Gerado automaticamente em 2026-08-15T20:11:00.030Z (branch `feat/p12-real-world-validation`, commit `ad640432715f62829296fab2836a7a879cd5b96d`, working tree sujo).
> Dataset: 24 tasks reais × 3 estratégias = 162 runs.

## 1. Executive Summary

A P12 executou o dataset real (bugs, features e refactors reais do repositório) nas 3 estratégias com controle de variáveis (mesma task, mesmo modelo `gpt-4o-mini`, mesmo estado do repositório — variando apenas a estratégia).

- **O que funcionou:** multi-agent melhora qualidade e reduz retrabalho em tasks medium+; graph+multi agrega valor em tasks com alto risco de grafo.
- **O que não funcionou:** graph+multi é **prejudicial ou neutro** em tasks tiny/small (custo de contexto sem ganho); single-agent continua ideal para tarefas triviais.
- **Over-orchestration:** não detectado nos thresholds atuais.
- **3/6 triggers de investigação acionados.**

## 2. Task Dataset

- **Total:** 24 tasks (24 no dataset real, ancoradas em arquivos existentes).
- **Distribuição por classe:** tiny 2 · small 8 · medium 9 · large 5 · architectural 1.
- **Tipos:** bugs reais (datas fuso -3, transferências no totalMiles, 409, cache), features (text-to-query, auto-classify, alerts), refactors e schema/API.

## 3. Strategy Comparison

| Strategy | Success | Quality | Duration (ms) | Tokens | Cost (USD) | Rework | Orchestration |
| --- | --- | --- | --- | --- | --- | --- | --- |
| single | 36/54 | 6.6 | 662 | 725 | 0.00218 | 24.5% | 15.7% |
| multi | 51/54 | 7.0 | 802 | 835 | 0.00250 | 12.9% | 20.5% |
| graph+multi | 51/54 | 6.7 | 982 | 1875 | 0.00563 | 15.2% | 34.5% |

**Leitura:** a melhor estratégia depende da classe — ver §4.

## 4. Graph ROI

- **tiny**: graph-harmful (quality -0.4, rework -0.03)
- **small**: graph-harmful (quality -0.61, rework -0.05)
- **medium**: graph-neutral (quality -0.05, rework +0.04)
- **large**: graph-beneficial (quality +0.1, rework +0.07)
- **architectural**: graph-neutral (quality -0.05, rework +0.07)

- **Overall quality gain:** -0.09
- **Overall rework reduction:** +0.03
- **Overall token saving:** -1.4
- **Overall latency cost:** +0.34

## 5. Agent Performance

_Ver matrizes em P12-06 (agregadas nos relatórios internos)._

## 6. Model Performance

- Modelo único usado no baseline (controle de variáveis): `gpt-4o-mini`.
- Comparação entre modelos requer dataset multi-modelo — **insufficient_evidence** (spec §13).

## 7. Role Performance

| Role | Invoc. | Skip | Sucesso | Falha | Rework prev. | Latency (ms) | Tokens | Value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classifier | 0 | 162 | 0 | 0 | 0.0% | 0 | 0 | 90.000 |
| planner | 108 | 54 | 102 | 6 | 0.0% | 595 | 903 | 18.481 |
| scouts | 54 | 108 | 51 | 3 | 25.0% | 327 | 625 | 44.078 |
| architect | 108 | 54 | 102 | 6 | 25.0% | 595 | 903 | 26.694 |
| implementer | 162 | 0 | 138 | 24 | 10.0% | 815 | 1145 | 48.759 |
| tester | 108 | 54 | 102 | 6 | 16.0% | 595 | 903 | 42.264 |
| reviewer | 108 | 54 | 102 | 6 | 16.0% | 595 | 903 | 42.264 |
| validator | 162 | 0 | 138 | 24 | 16.0% | 815 | 1145 | 17.872 |

**Roles desnecessários:** nenhum.

## 8. Reliability

- **Failure rate:** 14.8% (trigger > 5.0%)
- **Rework rate:** 17.5% (trigger > 10.0%)
- **Telemetry completeness:** 100.0% (trigger < 99.5%)
- **Budget violation:** 14.8% · **Timeout:** 0.0% · **Context stale:** 0.0%

## 9. Bottlenecks

| Rank | Fase | Total (ms) | Share |
| --- | --- | --- | --- |
| 1 | agent | 79282 | 60.0% |
| 2 | tool | 31712 | 24.0% |
| 3 | planner | 24066 | 18.2% |
| 4 | validation | 20765 | 15.7% |
| 5 | graph | 7945 | 6.0% |

## 10. Over-orchestration

- **Orchestration overhead médio:** 24.0%
- **Suspeita:** não — overhead está dentro do custo aceitável.

## 11. Context Efficiency

- **Context size médio:** 2519 tokens
- **Freshness média:** 97.7%
- **Context stale rate:** 0.0%

## 12. Neo4j Readiness

- **Need score:** 53 / 100
- **Trend:** falling · **Query p95:** 315 ms
- **Multi-hop ratio:** 35.0% · **Nodes:** 2697 · **Edges:** 30638 · **Concurrency:** 14
- **Recomendação:** WATCH — sem pressão persistente para Neo4j.

## 13. Unexpected Findings

- **Nuance:** graph ajuda em large mas atrapalha em tiny, small — o valor do graph é condicional à classe.

## 14. Decision Matrix

| Recommendation | Evidence | Impact | Confidence | Effort | Priority | Action |
|---|---|---|---|---|---|---|
| P13-01 | Failure rate 14.8% acima do trigger (5.0%) | Falhas custam rework e confiança na automação | high | M | P1 | IMPLEMENT |
| P13-02 | Gargalo de agent (60.0% do tempo total) | Latência domina o custo da orquestração | high | M | P2 | IMPLEMENT |
| P13-03 | Graph+multi é prejudicial em: tiny, small | Custo de contexto e latência sem ganho de qualidade | medium | S | P2 | IMPLEMENT |
| P13-05 | Neo4j readiness abaixo do limiar persistente | Sem pressão comprovada para migrar | high | S | P3 | WATCH |

---

**P12 = Evidence Collected.** Próximo: P13 = Evidence-Driven Evolution.
