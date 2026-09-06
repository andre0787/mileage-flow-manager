# Spec — Contas em tabela densa (refactor/contas-tabela)

> Base: research R4/R5 (`research-workflow-kpi-ux.md`) — NN/g Data Tables, M3, HIG.
> Decisão aprovada: **tabela densa + drill-down** (questionário: tabela, não híbrido).
> Categoria **refactor**: sem mudança de comportamento financeiro; rule-28 (esta spec),
> rule-14 (sem órfãos), rule-15 (sem duplicação >75% com `AccountCard`), rule-41 (≤150 linhas/arquivo).

## Objetivo

Trocar o grid de cards da aba Contas (`src/pages/Contas.tsx`) por tabela densa
scannable para uso diário, preservando 100% das ações e dados do `AccountCard`.

## Fora de escopo

- Mudança em cálculos (`computedBalances`, `recalcAccount`, `getLastAccountActivity`).
- Pipeline Kanban / 4-keys DORA (PR seguinte, já aprovado).
- "Vence em" por conta: **não existe campo-fonte no domínio** (sem due date em
  sales/entries) → coluna omitida nesta fase; reavaliar quando houver vencimento.

## Layout (R4 + R5)

1. **Topo inalterado**: título, `Recalcular tudo`, `Nova Conta`, filtros
   (tipo todas/pontos/milhas + `OwnerFilter`) — mesmos componentes e estados.
2. **Faixa-resumo compacta** (R5, substitui o `AccountsSummary` de 4 cards):
   `Contas ativas/total · Total pontos · Total milhas` — mesmos valores
   (`computedBalances`), em linha única. `AccountsSummary.tsx` é removido da
   página (arquivo mantido só se reusado; senão deletar para não virar órfão —
   checar rule-14 no pre-pr).
3. **Tabela** (`table.tsx` + `SortableHeader.tsx` do kit; `DataTable.tsx` se
   encaixar sem fork): colunas
   `Conta | Programa | Dono | Saldo | Investido | A receber | Status | Alertas | Ações`.
   - Números à direita, `tabular-nums`, `toLocaleString("pt-BR")` (igual ao card).
   - `Saldo` = `computedBalances` + flag âmbar de divergência (mesma regra
     `balanceMismatch` do card, como ícone com title — sem texto extra por linha).
   - `A receber` = soma de `(saleValue − amountReceived)` das vendas
     não-canceladas vinculadas à conta (novo `Map` em `Contas.tsx`, mesmo padrão
     do `computedBalances`; ponto único — NÃO duplicar a fórmula em outro arquivo).
   - `Status` = badges existentes (tipo + ativa/inativa, mesmos variants).
   - `Alertas` = sino com contador (mesmo botão do card, extraído para
     `AccountAlertBell` se o reuso exigir — ver § Arquivos).
   - `Ações` = `AccountActions` **reusado como está** (toggle/edit/recalc/delete).
   - Linha 32–40px, row-hover, header fixo (`sticky`) dentro de container com
     `max-h` + scroll; **rodapé fixo** com totais de Saldo/Investido/A receber
     (soma da lista filtrada, não só da página).
4. **Drill-down por linha** (R5): clique na linha (exceto em botões) expande
   abaixo (`<tr>` expansível ou `Sheet`/`Drawer`): custo/milha, última entrada,
   última venda, dono, programa — mesmos dados do card, sem duplicar markup
   (extrair `AccountDetailLines` se usado em 2 lugares).
5. **Sort + filtro persistente**: sort por Conta/Saldo/Investido/A receber
   (estado em `localStorage`, chave `mc:contas:sort`); filtros tipo/dono
   existentes passam a persistir também (`mc:contas:filters`). Paginação mantida
   (20/página, mesmo `Pagination` + contador "Mostrando X–Y de Z").
6. **Responsivo**: `<md` a tabela vira lista compacta — **reusar o próprio
   `AccountCard`** como fallback mobile (zero duplicação, rule-15 folgada);
   `≥md` tabela.

## Arquivos (todos ≤150 linhas — rule-41)

- Novo: `src/components/accounts/AccountsTable.tsx` (tabela + sort + rodapé).
- Novo: `src/components/accounts/AccountRowExpand.tsx` (drill-down) — fundir
  com o anterior se a soma ficar ≤150.
- Novo: `src/lib/accountReceivables.ts` (puro: `computeReceivablesByAccount`)
  + `tests/unit/accountReceivables.test.ts` (pendente>0, exclui canceladas,
  `amountReceived` parcial).
- Modificar: `src/pages/Contas.tsx` (trocar grid por tabela, faixa-resumo,
  sort/filter persistentes; lógica de dados inalterada).
- Reusar sem copiar: `AccountActions`, `OwnerFilter`, `Pagination`,
  `EmptyState`, `AccountDialog`, `AccountAlertsDialog`, `AccountCard`
  (fallback mobile), `formatDateBR`, `ownerColors`, `getLastAccountActivity`.
- Deletar `AccountCard.tsx` **somente se** nada mais o importar (mobile usa ele,
  então provavelmente permanece); `AccountsSummary.tsx` sai da página —
  se ficar sem importador, deletar (rule-14).

## Critérios de aceite

1. Todas as ações do card funcionam na tabela (toggle, edit, recalc, delete,
   alerts com contador, badges, flag de divergência).
2. Sort por 4 colunas numéricas/alfabética + filtros persistem após reload.
3. Rodapé soma a lista filtrada inteira; paginação inalterada (20/página).
4. Mobile `<md` renderiza `AccountCard` (sem markup duplicado).
5. `npx tsc --noEmit` EXIT 0; `npm run pre-pr` 0 errors (rules 14/15/41 verdes).
6. Nenhuma fórmula financeira nova ou alterada (diff só em `src/components/**`,
   `src/pages/Contas.tsx`, `src/lib/accountReceivables.ts`, testes).

## Riscos residuais

- rule-15: row expandida pode convergir visualmente com o card — mitigado pelo
  reuso de `AccountActions` + `AccountCard` no mobile e extração de linhas de
  detalhe compartilhadas.
- Persistência em `localStorage`: envolver em try/catch (modo privado/SSR).
