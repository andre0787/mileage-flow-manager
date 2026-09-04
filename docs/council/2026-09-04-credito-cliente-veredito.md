# Veredito do Council — Saldo de crédito por cliente (ledger + atomicidade)

Data: 2026-09-04 · Branch: `feat/cliente-credito-ledger` · Spec: `docs/superpowers/specs/credito-cliente.md`

## Decisões travadas (questionário)
- Excedente de pagamento → **crédito automático** (toast avisa).
- Uso do saldo → **manual** no dialog (misto saldo + dinheiro).
- Cancelamento → **estorna** crédito automaticamente.
- Visibilidade → **dialog + tabela + ficha do cliente**.

## Síntese do Chairman

**Consenso:** excedente com destino definido elimina dinheiro "perdido"; uso manual preserva controle; estorno no cancel mantém a invariante espelhada. Saldo **derivado de ledger append-only** (posição líquida por cliente, nunca coluna editável), trilha quem/quando/de-qual-venda; migration aplicada e sondada antes do deploy (lição paga neste projeto). Visibilidade (autorização, extrato, recibo) como requisito, não objeção.

**Veredito Final: Faça condicionado** — exatamente o escopo travado, **somente** com: (1) ledger append-only como fonte da verdade, saldo sempre derivado; (2) aplicação crédito+recebimento atômica server-side; (3) regras explícitas p/ edição de venda que gerou/consumiu crédito e cancelamentos encadeados, com testes de estorno como gate; (4) migration aplicada e sondada no banco antes do merge. Sem 1–4, regride para Reformule (crédito 100% manual).

**Próximos Passos:** spec → plano canônico em 2 slices (dados/API; UI) → subagentes → E2E reais → 2 reviews → pre-pr → PR → CI → merge → aplicar/sondar migration → deploy → validar writes em prod.

**Extended Thinking Usado:** não — posições cobriram os trade-offs com profundidade suficiente.

## Advisors (5/5)
- Contrarian: Reformule (atomicidade, double-spend, estorno em cadeia, migration-apply gate).
- First Principles: Faça (posição líquida única, ledger auditável, saldo derivado).
- Expansionist: Faça (fidelização, conciliação, baixo custo incremental).
- Outsider: Faça com trava (autorização visível, extrato/recibo claro).
- Executor: Faça (2 slices, ~10–14 arquivos, testes de estorno como gate).
