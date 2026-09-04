# Spec — Saldo de crédito por cliente (ledger + atomicidade)

Veredito: `docs/council/2026-09-04-credito-cliente-veredito.md` · Branch: `feat/cliente-credito-ledger`

## 1. Problema
Pagamento acima do pendente não tem destino (excedente "perdido"); não há como usar um pagamento a maior para quitar outra venda do mesmo cliente, em nenhum cenário (criação, recebimento, edição, mobile).

## 2. Decisões travadas
Excedente → crédito **automático** (toast avisa); uso **manual** no dialog (misto saldo+dinheiro); cancelamento **estorna**; visível em **dialog + tabela + cliente**.

## 3. Modelo (ledger append-only, nunca coluna editável)
Tabela `client_credit_movements`: `id`, `user_id`, `client_id`, `sale_id` (origem, nullable só p/ ajuste manual futuro — nesta versão sempre preenchido), `kind` (`earn`|`spend`|`reversal`), `amount numeric > 0`, `created_at`. RLS por `auth.uid()` (padrão das demais). Índice `(user_id, client_id)`.
**Saldo derivado**: `SUM(earn) − SUM(spend)` (reversal entra como movimento contrário referenciando a venda). Nenhum update/delete no ledger — só inserts (append-only), o que elimina divergência entre visões e race em coluna mutável.

## 4. Atomicidade server-side
Cada ação (receber, criar com recebimento inicial, cancelar) executa numa **única mutation lógica**: valida tudo antes de escrever (clamps, saldo suficiente, valores ≥ 0); escreve venda + movimento(s) em sequência e, em qualquer erro, aborta sem efeito parcial (sem compensação silenciosa). Concorrência: dois recebimentos simultâneos podem somar além do limite teórico — aceito e documentado (last-write-wins com saldo derivado convergente); mitigado por revalidação de saldo no UI antes de confirmar.

## 5. Regras explícitas (edit/cancel encadeados)
- **Receber valor V com pendente P e saldo S, usando U do saldo (0≤U≤min(S,P)), dinheiro D=V−U**: `amountReceived += min(V,P)`; excedente `E=max(0,V−P)` → `earn(E, sale)`; consumo `spend(U, sale)`; pago se `amountReceived ≥ saleValue`.
- **Editar saleValue para baixo**: `amountReceived = min(amountReceived, saleValue)` (regra já vigente); movimentos de crédito da venda **não** são reescritos (ledger imutável) — excedente gerado permanece; documentado no extrato.
- **Cancelar venda**: reverte espelhado — `reversal` do `earn` gerado nela + `reversal` (estorno) do `spend` consumido nela; milhas/lucro seguem a reversão já existente.
- **Editar custos/milhas** sem mexer em valores recebidos: sem efeito no ledger.

## 6. UI (desktop + mobile, mesmos caminhos)
- `SaleReceiveDialog`: exibe saldo do cliente; campo "Usar saldo (R$)" (0 default, max=min(saldo,pendente)); aviso "excedente de R$ X vira crédito"; confirmação única.
- Linha da venda (tabela + card): badge/indicador quando há crédito envolvido; coluna Pendente inalterada.
- Ficha do cliente: saldo atual + extrato (movimentos com venda de origem).

## 7. Cenários de aceite (E2E reais, usuário efêmero)
C1 excedente gera crédito e toast avisa; C2 uso manual misto (saldo+dinheiro) quita parcial; C3 quitação total só com crédito; C4 edição após crédito não corrompe ledger; C5 cancelamento estorna earn+spend (gate: testes de estorno); C6 dialog reaberto mostra saldo atualizado.

## 8. Gates
`tsc` limpo; unit do ledger (derivação, clamps, estorno); E2E C1–C6; 2 reviews; pre-pr 0 errors; **migration aplicada e sondada (coluna/tabela existe) antes do merge** — lição da 20260904000000.
