# Auditoria de duplicação de cálculos

Data: 2026-08-22

## Resultado

`src/lib/transferCalc.ts` não duplica implementação financeira de `src/lib/metrics.ts`.
Ele importa e reutiliza `calcCostPerMile`, `calcCostPerThousand` e `calcMilesGenerated`; sua responsabilidade é somente compor a operação de transferência (carrinho, custo total e resultado).

Nenhuma função foi removida ou consolidada, pois a separação preserva o contrato público `computeTransferCalc` e mantém `src/lib/metrics.ts` como módulo central de fórmulas puras.
