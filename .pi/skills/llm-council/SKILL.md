---
name: llm-council
description: >
  LLM Council protocol: 5 advisors (Contrarian, First Principles, Expansionist, Outsider, Executor)
  analyze a request from different angles, then peer review and chairman synthesis.
  Used internally by council-to-superpowers workflow.
---

# LLM Council Protocol

5 advisors analisam a solicitação de ângulos diferentes, seguidos de peer review anônimo e síntese do chairman.

## Advisors

1. **The Contrarian** — busca o que vai falhar, pontos cegos, riscos ignorados
2. **First Principles Thinker** — questiona premissas, volta aos fundamentos
3. **The Expansionist** — enxerga oportunidades, escala, efeitos colaterais positivos
4. **The Outsider** — olho fresco, sem viés de domínio, pergunta o "óbvio"
5. **The Executor** — foca no "como fazer", viabilidade, esforço, riscos de implementação

## Formato

Cada advisor produz:
```markdown
### Advisor: <nome>
**Análise:** <2-3 parágrafos>
**Veredito:** <Faça / Não faça / Reformule>
```

## Peer Review

Cada advisor recebe as análises dos outros 4 anonimamente e pode:
- Reforçar pontos concordantes
- Questionar premissas
- Ajustar seu veredito

## Extended Thinking (Deep Analysis)

Para decisões complexas ou de alto risco, invoque **Extended Thinking** antes da
síntese do chairman. O chairman avalia se algum advisor se beneficiaria de
raciocínio estendido — tipicamente quando:

- O tema envolve trade-offs não óbvios entre 3+ variáveis interdependentes
- O problema cruza múltiplos domínios (ex: backend + financeiro + regulatório)
- A recomendação tem alto custo de implementação (>1 sprint)
- Há dados conflitantes ou incompletos que exigem análise mais profunda

### Gatilhos para Extended Thinking

| Gatilho | Quando aplicar |
|---------|----------------|
| Trade-off complexo | Decisão entre 3+ opções com critérios conflitantes |
| Alto investimento | Feature que consome >30% do sprint ou envolve refactor arquitetural |
| Dados insuficientes | Conselho baseado em suposições não validadas |
| Risco de regressão | Mudança em área crítica (saldos, autenticação, dados financeiros) |

### Formato

```markdown
### Extended Thinking: <advisor>

**Análise Estendida:** <3-5 parágrafos com raciocínio detalhado, cenários, riscos>
**Novas Descobertas:** <o que o raciocínio adicional revelou>
**Impacto no Veredito:** <manteve, ajustou ou reverteu>
```

O chairman incorpora as análises estendidas na síntese final.

## Chairman Synthesis

O chairman (Executor) sintetiza:
```markdown
## Síntese do Chairman

**Consenso:** <resumo>
**Veredito Final:** <Faça / Não faça / Reformule>
**Próximos Passos:** <se Faça, encaminha para Superpowers>
**Extended Thinking Usado:** <sim/não — quais advisors>
```
