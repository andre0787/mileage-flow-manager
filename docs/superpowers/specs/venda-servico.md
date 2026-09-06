# Spec — Venda standalone de serviço (PR1)

> Veredito do council: `docs/council/2026-09-06-produtos-veredito.md` (Faça-condicionado).
> Proposta A (receita adicional na mesma venda) **arquivada**. Escopo aqui = Proposta B.
> Decisões já tomadas com o usuário (questionários): sem conta de milhas,
> com observações, natureza **receita pura** (sem repasse), fatiado (relatório = PR2).
> Adaptação do skill brainstorming: o diálogo interativo foi substituído pelas
> decisões registradas acima (sessão delegada, sem canal interativo).

## Objetivo

Permitir vender um serviço/produto sem milhas (ex: consultoria, taxa de embarque
paga pelo cliente) como venda standalone, reaproveitando recebimento, crédito do
cliente, extrato, estorno e listagens existentes. Lucro = 100% do valor (receita pura).

## Fora de escopo (PR2 ou futuro)

- Proposta A (produtos/receita adicional dentro da venda de milhas) — arquivada.
- Relatório de cobrança / repaginação de Relatórios — PR2.
- Repasse com custo espelhado (receita + custo) — não implementado; se surgir,
  vira extensão com `service_nature` por produto.

## Modelo de dados (migration NOVA, nunca editar existente — rule-43)

Migration `supabase/migrations/20260906000000_venda_servico.sql`
(verificar colisão de timestamp antes de criar):

```sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_kind text NOT NULL DEFAULT 'milhas';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS service_type text NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS observations text NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_kind_check') THEN
    ALTER TABLE sales ADD CONSTRAINT sales_kind_check
      CHECK (sale_kind IN ('milhas', 'servico'));
  END IF;
END $$;
```

Sem tabela nova → sem RLS nova (rule-43 exige RLS só em `CREATE TABLE`).
Backfill: linhas existentes ganham `sale_kind='milhas'` via DEFAULT.

## Tipos (`src/types/index.ts` + `src/features/vendas/shared.ts`)

```ts
export type SaleKind = "milhas" | "servico";
export type ServiceType = "consultoria" | "taxa" | "outro";

export interface Sale {
  // ...existentes...
  kind: SaleKind;                 // default 'milhas' no mapper p/ linhas antigas
  serviceType?: ServiceType;      // só quando kind === 'servico'
  observations?: string;          // só quando kind === 'servico', livre, trim
}
```

Mapper (`src/hooks/useDatabase/mappers.ts`): mapear `sale_kind → kind`
(default `'milhas'` quando NULL), `service_type → serviceType`,
`observations → observations`.

## Regras de validação (server-side, anti-forgery como o lucro atual)

Helper puro em `src/lib/` (ex: `validateSaleKind` em arquivo novo
`src/lib/saleKind.ts` — ponto único, testável sem Supabase):

- `kind === 'milhas'`: `milesUsed > 0` obrigatório; `accountId` segue regra atual
  (opcional — sem mudança de comportamento); `serviceType`/`observations` devem
  ser NULL/vazio (rejeitar se preenchidos).
- `kind === 'servico'`: `milesUsed` deve ser `0`; `accountId` deve ser NULL;
  `saleValue > 0`; `clientId` obrigatório; `serviceType` obrigatório;
  `pricePerMile` deve ser NULL; `additionalCosts` ignorados (UI não envia;
  se enviados, rejeitar).
- `kind` é **imutável** no `updateVenda` (rejeitar troca milhas↔servico —
  a troca exigiria restaurar/aplicar estoque, fora do escopo).
- Lucro server-side: `kind === 'servico'` → `profit = saleValue`,
  `profitMargin = 100`. (Equivale a `calcProfit(v, 0, 0, 0)`; usar a mesma
  função para não duplicar fórmula.)

Aplicar em `addVenda.ts` (antes do insert) e `updateVenda.ts` (antes do update,
comparando `data.kind ?? oldSale.sale_kind`).

## Fluxos reaproveitados (sem mudança)

- `addVenda`: com `accountId` NULL pula o débito em conta (código atual já faz
  `if (sale.accountId)`); recebimento inicial via `planReceipt` funciona igual.
- `receiveVenda` / `refundToCredit`: operam sobre `amount_received` — agnósticos a kind.
- `cancelVenda`: reversões do ledger via `planCancelReversals`; restore de conta
  pulado quando `account_id` é NULL (código atual já faz `if (sale.account_id)`).
- `deleteVenda`: bloqueio com crédito vinculado mantido (CASCADE protegido).

## Isolamento dos KPIs de milhagem (unanimidade do council)

`computeDashboardMetrics` e `computeMetricHistory` (`src/lib/metrics.ts`):
filtrar `kind === 'milhas'` antes de agregar `totalSoldMiles`, `totalRevenue`,
`totalProfit`, `avgCostPerMile`, `avgProfitMargin`, `monthlyMilesIn`.
Nova função pura `totalServiceRevenue(sales)` = soma de `saleValue` das vendas
`servico` não-canceladas (para a UI exibir a linha de serviço separada).
Vendas-serviço **nunca** entram em `salesOfAccountType(..., 'milhas')` nem em
`monthlyMilesIn`.

## UI (`SaleForm.tsx` + `Vendas.tsx`)

- Toggle no topo do dialog: **Milhas | Serviço**.
- Modo Serviço esconde: dono, conta/programa, milhas, valor por milha, custos
  adicionais, passageiros, localizador. Mostra: cliente (+ novo), tipo de serviço
  (Consultoria | Taxa de embarque | Outro), valor (R$), observações (textarea),
  data. Preview de lucro: `Lucro R$ X (100%)`.
- Listagem: badge `Serviço` na linha (mesmo padrão do badge `Crédito`);
  coluna de programa exibe o tipo de serviço; sem "1 pax".
- CSV de exportação: incluir colunas Tipo e Observações.

## Critérios de aceite

1. Criar venda-serviço com cliente + valor + observações, sem conta, `miles=0`.
2. `profit === saleValue`, margem 100; `price_per_mile` NULL no banco.
3. Nenhum débito em conta; KPIs de milhagem inalterados; linha de receita de
   serviço separada.
4. Receber (dinheiro/crédito), devolver ao crédito, cancelar (com estorno) e
   excluir (sem crédito vinculado) funcionam igual às vendas de milhas.
5. `updateVenda` rejeita troca de kind; `addVenda` rejeita servico com miles>0
   ou accountId preenchido.
6. pre-pr 0 errors; review por subagente approved.

## Riscos residuais

- `receiveWithCredit` segue sem transação server-side (risco pré-existente,
  coberto pelos testes de corrida/estorno como gate).
- `updateVenda`/`deleteVenda` têm falhas silenciosas em `accounts.update`
  (scout #18) — fora do escopo, mas os testes novos não devem depender desse caminho.
