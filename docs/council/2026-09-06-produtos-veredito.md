# Veredito do Council — Produtos na Venda + Relatório de Cobrança
> Data: 2026-09-06 · Chairman: Executor · Advisors: Contrarian, First Principles, Expansionist, Outsider, Executor

## Síntese do Chairman

**Consenso:** 4 vereditos **Faça** + 1 **Reformule** (Contrarian) cujas 4 travas são idênticas às condições impostas pelos outros quatro — ou seja, convergência total sob travas. Unanimidade em: **arquivar a Proposta A** (coluna de receita adicional na mesma venda — polui `sale_value`, margem e comparabilidade histórica); **Proposta B no PR1** (venda standalone `miles=0`, sem conta, com observações, reaproveitando recebimento/crédito/extrato); **Proposta C no PR2** (relatório de cobrança por cliente, SEM lucro/margem/custos); fatiamento em 2 PRs (escrita antes, leitura depois).

**Peer review (pontos reforçados):** discriminador explícito de tipo (`sale_kind: milhas|servico`) — exigido por 4 advisors; vendas-serviço fora dos KPIs de milhagem (`totalSoldMiles`, `avgCostPerMile`, `avgProfitMargin`, `price_per_mile=NULL`) — unanimidade; fórmula do líquido travada (`Σ(sale_value − amount_received, não-canceladas) − credit_balance`, mesmo `CREDIT_EPSILON`) + teste anti-dupla-subtração do `spend` — achado-chave do Contrarian, adotado; checar constraints reais (`account_name/owner_name/program` NOT NULL, `account_id` NULLable) antes de afirmar "sem migração" — Executor/First Principles; observações em coluna nova nullable (nunca gambiarra em campo legado) — Expansionist/Outsider; testes de corrida e estorno do ledger cobrindo venda-serviço como gate — Contrarian/Executor, dado que `receiveWithCredit` segue sem transação server-side.

**Premissa questionada (lacuna real):** ninguém além do Contrarian tratou a natureza da taxa — se a taxa de embarque é **repasse** (operador adianta e cliente reembolsa), o modelo correto é lançamento duplo (receita + custo espelhado, lucro neutro); se é **markup/serviço**, entra como receita pura. Somar tudo como receita sem distinguir gera lucro fantasma no caso repasse. Vira trava: a spec do PR1 deve definir a natureza por produto.

**Veredito Final:** **Faça condicionado** — B no PR1 + C no PR2, A arquivada, sob as 5 travas abaixo. Sem elas, regride para Não faça (fallback do Outsider: consultoria fora da tabela `sales`).

**Próximos Passos:** 1) Spec Superpowers com fórmula do líquido travada + natureza por produto (repasse vs. markup); 2) Migration nova e mínima (`sale_kind` default `milhas`, `observations` nullable; nunca editar migration existente — rule-43); 3) PR1: validação `miles>0 IFF kind=milhas`, `account_id=NULL` real, KPIs isolados, testes (profit=fee, sem débito em conta, recebimento/estorno com crédito); 4) PR2: seção de cobrança read-only (pendente + linhas por venda + saldo + líquido, sem lucro/margem/custos) — escopo pode expandir para repaginação total da aba Relatórios, já autorizada pelo usuário; 5) Gates: testes de estorno/corrida do ledger, pre-pr 0 errors, review por subagente.

**Extended Thinking Usado:** não — as 5 análises já convergem em profundidade e a lacuna restante (repasse vs. markup) é empírica, só o usuário resolve; o risco residual foi convertido nas travas acima.
