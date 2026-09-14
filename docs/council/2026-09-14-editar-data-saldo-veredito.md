# Council — editar data do extrato de Saldo do cliente (veredito)

Data: 2026-09-14 · Roster: análise direta sobre código + questionário com o dono · Passes: 1 (sem disputa material)
Branch: `feat/clientes-editar-data-saldo`

## Pergunta e escopo

Habilitar edição das datas exibidas no extrato de Saldo da página Clientes
(`ClientCreditInfo` em `src/pages/Clientes.tsx`, coluna Saldo → Extrato).
Hoje a data vem de `client_credit_movements.created_at` (tabela append-only:
só policies INSERT/SELECT, sem UPDATE) e a ordenação é por `created_at` asc.
Respostas do dono no questionário: desenho A, escopo só-adiantamentos,
reordenar pela data editada.

## Recomendação

1. Desenho A — editar `created_at` via nova policy UPDATE (adiantamento já grava
   a data funcional em `created_at` como `${date}T12:00:00-03:00`; sem coluna nova).
2. Escopo estrito: só movimentos `earn` com `sale_id IS NULL` (adiantamentos).
   `spend`/`reversal` e `earn` vinculados a venda ficam read-only (risco de
   quebrar estorno espelhado e conciliação de recebimentos).
3. Ordenação: nenhuma mudança de código — a query já ordena por `created_at`
   asc, então o extrato reordena sozinho após o refetch.
4. UI: botão lápis ao lado da data só nas linhas de adiantamento, dialog com
   `<input type="date">` (default = `createdAt.slice(0,10)`, validado com
   `isValidISODate`), save via nova mutation RTK com toast Sonner pt-BR.
5. Migration nova (imutável: nunca editar as existentes): só `CREATE POLICY`
   de UPDATE próprio (`USING`/`WITH CHECK` com `auth.uid() = user_id`).

## Feedback aceito (com motivo)

- Coluna nova `occurred_at` preservaria auditoria, mas dobra a migração
  (backfill + mapper + ordenação) para um ganho que o dono não pediu.
- "Editar" via reversal + reinserção manteria append-only puro, mas confunde
  o extrato (duas linhas por correção) e complica o saldo derivado.
- Spend/reversal editáveis: rejeitado — estorno espelhado depende das linhas
  originais; data de spend deve seguir a venda, não edição manual.

## Feedback rejeitado (com motivo)

- Liberar UPDATE irrestrito (qualquer coluna/kind): quebra o invariante do
  ledger (saldo derivado de earn/spend); a mutation deve travar escopo no
  servidor (checar `kind` + `sale_id` antes do update).
- Editar `created_at` de `earn` de sobra de recebimento (sale_id não nulo):
  fora do escopo pedido; a data ali reflete o recebimento da venda.

## Decisões do dono

- Desenho A + escopo `earn-avulso` + reordenar (questionário, 2026-09-14).
- Classe: **complex** (migration + API + UI, cruza DB/API/UI, toca ledger
  financeiro) — execução segue os gates do projeto (coding + review por
  subagente, pre-pr, relatório HTML); quórum 2+2 do contrato portátil fica
  dispensado pela política ativa do repo (manifesto é autoritativo).
- Sem Pass 2: sem disputa material.

## Confiança

Alta para o desenho; o que mudaria: descobrir em prod que há `earn` com
`sale_id` nulo que não é adiantamento manual (aí o filtro de escopo precisa
de marcador adicional, ex. `note`).
