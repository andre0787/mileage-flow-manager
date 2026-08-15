# P13 — Evidence-Driven Roadmap

> Gerado automaticamente em 2026-08-15T20:11:00.030Z a partir do Evidence Report P12.
> Princípio: **a próxima melhoria não nasce de uma ideia, nasce de uma evidência.**

## Matriz de decisão

| Recommendation | Evidence | Impact | Confidence | Effort | Priority | Action |
| --- | --- | --- | --- | --- | --- | --- |
| P13-01 | Failure rate 14.8% acima do trigger (5.0%) | Falhas custam rework e confiança na automação | high | M | P1 | IMPLEMENT |
| P13-02 | Gargalo de agent (60.0% do tempo total) | Latência domina o custo da orquestração | high | M | P2 | IMPLEMENT |
| P13-03 | Graph+multi é prejudicial em: tiny, small | Custo de contexto e latência sem ganho de qualidade | medium | S | P2 | IMPLEMENT |
| P13-05 | Neo4j readiness abaixo do limiar persistente | Sem pressão comprovada para migrar | high | S | P3 | WATCH |

## Recomendações detalhadas

### P13-01 — Failure rate 14.8% acima do trigger (5.0%) (P1)

- **What problem?** Failure rate 14.8% acima do trigger (5.0%)
- **What evidence?** P12 reliability: 162 runs
- **How often?** _frequência observada na amostra_
- **What impact?** Falhas custam rework e confiança na automação
- **What happens if we do nothing?** custo/risco persistem até a próxima medição
- **What is expected improvement?** Investigar estratégias com maior failure rate e adicionar fallback determinístico
- **Confidence:** high · **Effort:** M · **Risk:** medium
- **Action:** `IMPLEMENT`

### P13-02 — Gargalo de agent (60.0% do tempo total) (P2)

- **What problem?** Gargalo de agent (60.0% do tempo total)
- **What evidence?** P12 bottleneck ranking
- **How often?** _frequência observada na amostra_
- **What impact?** Latência domina o custo da orquestração
- **What happens if we do nothing?** custo/risco persistem até a próxima medição
- **What is expected improvement?** Otimizar a fase agent (cache, paralelismo ou redução de chamadas)
- **Confidence:** high · **Effort:** M · **Risk:** low
- **Action:** `IMPLEMENT`

### P13-03 — Graph+multi é prejudicial em: tiny, small (P2)

- **What problem?** Graph+multi é prejudicial em: tiny, small
- **What evidence?** P12 graph ROI por classe (quality/rework negativos)
- **How often?** _frequência observada na amostra_
- **What impact?** Custo de contexto e latência sem ganho de qualidade
- **What happens if we do nothing?** custo/risco persistem até a próxima medição
- **What is expected improvement?** Classifier deve evitar graph em tasks dessas classes (policy, não código)
- **Confidence:** medium · **Effort:** S · **Risk:** low
- **Action:** `IMPLEMENT`

### P13-05 — Neo4j readiness abaixo do limiar persistente (P3)

- **What problem?** Neo4j readiness abaixo do limiar persistente
- **What evidence?** P12 neo4j score 53 < 85
- **How often?** _frequência observada na amostra_
- **What impact?** Sem pressão comprovada para migrar
- **What happens if we do nothing?** custo/risco persistem até a próxima medição
- **What is expected improvement?** Manter graph engine atual; re-medir a cada rodada P12
- **Confidence:** high · **Effort:** S · **Risk:** low
- **Action:** `WATCH`

## O que NÃO fazer (sem evidência adicional)

- Reescrever Planner/Scheduler antes de medir latência real pós-deploy.
- Migrar para Neo4j sem score ≥ 85 persistente em produção.
- Adicionar novos agentes "porque seria interessante".

---

**P13 = Evidence-Driven Evolution.** Toda melhoria implementada deve seguir: hypothesis → change → measurement → comparison → decision.
