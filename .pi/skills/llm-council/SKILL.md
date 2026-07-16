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

## Chairman Synthesis

O chairman (Executor) sintetiza:
```markdown
## Síntese do Chairman

**Consenso:** <resumo>
**Veredito Final:** <Faça / Não faça / Reformule>
**Próximos Passos:** <se Faça, encaminha para Superpowers>
```
