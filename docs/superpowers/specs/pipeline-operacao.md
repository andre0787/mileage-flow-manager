# Spec — Pipeline Operacional + 4-keys (F1 + F2)

> Veredito: `docs/council/2026-09-06-pipeline-veredito.md` (Faça-condicionado).
> Definições congeladas com o usuário: divergência = (canceladas + com reversal)/total;
> vencimento = `sale.date + 30d`, expedite quando `vencimento − hoje ≤ 7d`.
> F3 (migration) fora deste escopo.

## F1 — Aba Pipeline em Relatorios.tsx

Nova aba `Pipeline` (ao lado de Cobrança|Donos|Programas|Insights). Sem tocar Workflow.tsx.

### Estágios (só computáveis, sem funil literal)

| Estágio | Fonte | Regra |
|---|---|---|
| Aguardando | entries | `amount_paid < amount` |
| Comprado | entries | confirmada (`amount_paid >= amount`) |
| Vendido A Executar | sales | `status === 'pendente'` |
| A Receber | sales | `status === 'pago'` |
| Recebido | sales | `status === 'concluido'` |
| Cancelado (lateral) | sales | `status === 'cancelado'` — fora do WIP |

- Vendas `kind === 'servico'` fora do throughput de milhas (contam em linha separada ou excluídas do WIP de milhas — declarar no código).
- **WIP é só-observação** por 2–4 semanas: exibir contagens, sem limites bloqueantes, sem alertas de estouro.
- **Lane expedite**: vendas A Receber com `vencimento − hoje ≤ 7d` (vencimento = `sale.date + 30d`, via `parseDateOnly`).
- **P&L agregado só em drawer**: cards/strip do Pipeline mostram contagens e valores pendentes; lucro/margem/custos só dentro de drawer de detalhe.

### Arquivos (todos ≤ 150 linhas — rule-41)

- `src/lib/pipelineStages.ts` — classificação pura entry/sale → estágio + `isExpedite`.
- `src/lib/flowKeys.ts` — 4-keys puras (ver F2).
- `src/components/reports/PipelineTab.tsx` — aba (usa strips/cards existentes quando possível).
- `src/components/reports/FlowKeysStrip.tsx` — strip F2 (≤ 150).
- Testes: `tests/unit/pipelineStages.test.ts`, `tests/unit/flowKeys.test.ts`.

## F2 — Strip 4-keys (adaptadas, com margem + prazo anti-Goodhart)

Calculadas live de `useData` (não do JSON nightly). Toda key exibe **margem de interpretação + prazo de medição** ao lado do número.

1. **Throughput**: vendas/dia no período (contar `concluido + pago`; `cancelado` fora; declarar janela).
2. **Lead p50/p85 (dias)**: `sale.date − FIFO entry.date` por venda (FIFO por data de entrada); se `n < 20`, exibir badge `preliminar`.
3. **% Divergência**: `(canceladas + vendas com reversal) / total de vendas` no período.
4. **MTTR**: média em dias de `reversal.created_at − spend.created_at` por par reversal↔spend (mesma venda); sem par, MTTR fica `—` (nunca 0).

## Critérios de aceite

1. Aba Pipeline lista os 6 estágios com contagens corretas (teste com fixtures).
2. Expedite só com vencimento ≤ 7d; WIP sem bloqueio.
3. P&L fora do strip/tab — só em drawer.
4. 4-keys com margem+prazo visíveis; lead com badge preliminar se n<20; MTTR `—` sem pares.
5. pre-pr 0 errors; review por subagente approved.

## Riscos residuais

- FIFO entry↔sale é proxy (sem vínculo direto entrada→venda); declarado como proxy.
- `created_at` dos movements depende do banco; se ausente, MTTR fica indisponível.
- Faixas Elite/High e WIP limits exigem 2–4 semanas de medição (F3).
