---
name: pre-pr-triage
description: Use when npm run pre-pr fails — dispatch an agent that runs pre-pr once, extracts only rule failures as rule|file|fix in 2-3 lines, and applies mechanical fixes, instead of pulling the whole report into context
---

# Pre-PR Triage

## Overview

`npm run pre-pr` gera um relatório longo (KPIs + timeline + apêndice) que polui o contexto quando a única coisa que importa são os **erros de regra**. Um agente de triagem roda o pre-pr uma vez, filtra só o que falhou e devolve `rule | file | fix` — nunca o relatório inteiro.

**Core principle:** rode o pre-pr UMA vez, extraia só os erros, corrija os mecânicos, e retorne a lista compacta de falhas restantes.

## When to Use

- `npm run pre-pr` com `❌ N errors` — triagem padrão
- Loop de validação (rodar → corrigir → rodar) sem trazer logs gigantes
- Antes de escalar para `systematic-debugging` (falhas que exigem root cause profundo)

**Don't use** para: falha de relatório que quebra o pre-pr antes das regras (ex.: erro no gerador), ou quando o pre-pr pede ação manual explícita.

## Dispatch Template

```
Rode: npm run pre-pr 2>&1 | tee /tmp/prepr-triage.log
Depois: grep -E '❌ rule|❌|error' /tmp/prepr-triage.log | head -20
Retorne APENAS (formato tabela, máximo 10 linhas):
- rule | arquivo | causa (1 linha) | correção (1 linha) | auto-corrigível (sim/não)
NÃO inclua: relatório de KPIs, timeline, saída completa, diff, logs de teste.
```

## Fix Discipline

1. **Rode uma vez** — não re-rodem pre-pr para "ver o que mudou".
2. **Corrija os auto-corrigíveis** (formatação, handoff ausente, arquivos órfãos) no mesmo dispatch.
3. **Re-rode APENAS se corrigiu algo** — e retorne `PASS` ou a lista enxuta restante.
4. **Nunca desabilite uma regra** para fazer o pre-pr passar — regra que incomoda vira sugestão de processo, não bypass.

## Common Mistakes

| Mistake                              | Cost                      | Fix                                    |
| ------------------------------------ | ------------------------- | -------------------------------------- |
| Copiar o relatório inteiro do pre-pr | 500+ linhas no contexto   | `grep ❌` antes de responder           |
| Re-rodar pre-pr a cada tentativa     | Minutos + output repetido | 1 rodada por dispatch                  |
| Corrigir só o 1º erro e responder    | Loops longos              | Corrigir TODOS os mecânicos de uma vez |
| Reportar warnings como erros         | Ruído                     | Só `❌` conta                          |
