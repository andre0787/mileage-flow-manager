# Veredito — Council: Último registro no card + Alertas por conta

> **Data:** 2026-08-07
> **Sessão:** feature — (1) último registro de entrada/venda no card das contas; (2) alerta personalizado por conta (data + observação + lido/não lido)
> **Topico:** 2 itens — UI no card de conta + nova entidade com migration

---

## Solicitação

1. **Último registro de entrada e último registro de venda** no card das contas aplicáveis (`src/pages/Contas.tsx`)
2. **Alerta personalizado por conta** — inclusão de data + observação + marcação lido/não lido. **Teste manual via Playwright em servidor local antes do PRD** (exigência explícita do usuário)

## Evidências coletadas (evidência antes de opinião)

| Item | Evidência |
|------|-----------|
| Card da conta | `src/pages/Contas.tsx` (355 linhas): grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, Card com header (nome, programa, badges tipo/status) + CardContent (Saldo, Custo/Milha, Valor Investido, Saldo registrado se divergir, Dono) + botões (Ativar/Desativar, Editar, Recalcular, Excluir) |
| Dados disponíveis | `useData()` já expõe `entries` (PointEntry[]) e `sales` (Sale[]) na página; `computedBalances` já deriva de entries/sales por accountId (exclui `entryStatus === "aguardando"` e `status === "cancelado"`) — mesmo filtro deve valer para "último registro" |
| Campos de data | `PointEntry.date: string` (linha 103 types) e `Sale.date: string` (linha 171) — comparação lexicográfica de ISO suficiente |
| Types | `Account` (id, name, ownerId, programId, type, balance, ...) — sem campo de alertas; types em `src/types/index.ts` |
| Padrão de migration | `20260711000000_add_feedback_table.sql`: `CREATE TABLE IF NOT EXISTS`, `ENABLE ROW LEVEL SECURITY`, policies por `auth.uid()`; hooks em `src/hooks/useDatabase/` split por entidade, `useUserId()` |
| Regra #31/#32 | Toda lib em `src/lib/` e todo componente customizado tem teste unitário |
| Regra #25 | Feature que cria/alterar dados DEVE ter teste E2E; usuário pediu teste manual local via Playwright antes do PRD |
| E2E local | Suíte e2e roda contra `http://localhost:8080` (Vite dev), `CI=true`; retries=2, workers CI?2 — suíte completa leva ~8min; teste dirigido roda em segundos |

## Advisors

### Advisor: The Contrarian
**Análise:** O item 1 parece inofensivo, mas o diabo está nos detalhes: "último registro" precisa definir o que é um registro válido — entradas `aguardando` (recorrência) e vendas `cancelado` poluem o card se contadas; o card já tem 5 linhas de metadados + 4 botões — adicionar 2 linhas pode estourar o layout do grid (alturas desiguais, hover translate). Item 2 é o risco real: **nova tabela + RLS** — uma policy errada expõe alertas de outro usuário (dados potencialmente sensíveis: observações sobre negociações). Migration em produção exige cuidado com `IF NOT EXISTS` + idempotência. O teste manual via Playwright que o usuário pediu não pode ser só "abrir a página": precisa validar criação → listagem → marcação lido → persistência.
**Veredito:** Faça, com ressalvas: (a) último registro deve filtrar `aguardando`/`cancelado` (consistente com `computedBalances`); (b) RLS estrito por `auth.uid()`; (c) Playwright local cobrindo o fluxo completo de alerta antes do PR.

### Advisor: First Principles Thinker
**Análise:** Item 1: o princípio é "o card conta a história da conta" — saldo diz o estado, último registro diz a atividade. Não é preciso nova query: `entries` e `sales` já estão no contexto global (React Query, staleTime 30s). Derivação client-side com `reduce`/sort é suficiente e consistente com `computedBalances`. "Contas aplicáveis" = exibir sempre, com placeholder quando não houver registro (uniformidade > omissão). Item 2: princípio "alerta = 1 registro por conta com 3 campos (data, observação, lido)". A tabela mínima: `id, account_id, user_id, date, observation, read, created_at`. Nada de status complexos — o requisito pede só lido/não lido. Inserção e toggle de leitura via mutations com `invalidateQueries` (`refetchType: 'all'` — regra #19).
**Veredito:** Faça. Derivação client-side no item 1; schema mínimo no item 2.

### Advisor: The Expansionist
**Análise:** O último registro vira um mini-rastreador de atividade: usuário consegue ver em um golpe de olho quando a conta foi movimentada por último — excelente para contas inativas (saber se "vale a pena" reativar). Os alertas destravam um fluxo de lembrete: "entrada do Clube X vence dia Y" (data futura) — a data é um campo de AGENDA, não só de registro. O badge de não lido no card dá visibilidade imediata. Oportunidade: se os alertas forem filtrados no card (badge com contagem), o valor percebido sobe. Sugiro também tooltip/aria-label nos ícones para acessibilidade.
**Veredito:** Faça. Badge de contagem de não lidos no card + suporte a data futura (agenda) sem custo extra.

### Advisor: The Outsider
**Análise:** Perguntas óbvias: (a) o que acontece quando a conta é EXCLUÍDA — os alertas dela somem (CASCADE) ou ficam órfãos? (b) cadê o botão/ícone de "novo alerta" no card — onde o usuário acha essa função? (c) lido/não lido: um clique no alerta marca como lido, ou há botão explícito? (d) o card já tem 4 botões — um quinto vai estourar a linha. Respostas propostas: (a) `ON DELETE CASCADE` em account_id — alerta de conta deletada é lixo; (b) ícone Bell no header do card + badge de contagem; (c) dialog com lista + toggle de lido explícito (clique abre/edita, checkbox marca lido); (d) Bell no header, NÃO na fileira de botões.
**Veredito:** Faça. Bell no header do card; CASCADE na FK; toggle explícito.

### Advisor: The Executor
**Análise:** Esforço estimado: item 1 ~15min (derivação + 2 linhas no card + teste unitário de helper); item 2 ~2-3h (migration + types + hooks useDatabase/accountAlerts + componente AlertDialog/AlertsDialog + badge no card + testes unitários + e2e dirigido). Caminho de implementação: migration → types → hooks (query + add + toggle read) → dialog de alertas (lista + form data/obs + toggle lido) → badge Bell no card → testes. Ordem segura: 1º item 1 (rápido, baixo risco), 2º item 2. Playwright local dirigido (`tests/alerts.spec.ts`) cobrindo: criar conta e2e → criar alerta → badge não lido → marcar lido → badge some → reload persiste. Depois suíte completa local (62 testes) antes do PR.
**Veredito:** Faça. Ordem: item 1 → item 2; testes locais dirigidos + suíte completa antes do PR; pre-pr → PR → merge → PRD.

## Peer Review

- **Contrarian** reforça: exclusão de conta sem CASCADE deixaria alertas órfãos na tabela — concordância geral com a proposta do Outsider (CASCADE).
- **First Principles** ajusta: a derivação client-side do item 1 deve reusar o mesmo filtro do `computedBalances` (fonte única — não duplicar regra de "registro válido").
- **Expansionist** concorda com o badge, mas nota: o badge não pode quebrar o layout do header (usar posição absoluta ou inline flex pequeno).
- **Outsider** mantém: Bell no header, fora da fileira de botões (4 botões já lotam a linha em mobile).
- **Executor** confirma: hook único `useAccountAlerts(userId)` + `useAddAccountAlertMutation` + `useToggleAlertReadMutation`; dialog reutilizável; e2e dirigido local (não no CI nightly — e2e-full fora da cron).

## Síntese do Chairman

**Consenso:** Faça os 2 itens. Item 1 derivado client-side (sem query nova) com filtro consistente com `computedBalances`; item 2 com schema mínimo, RLS estrito por user, CASCADE na FK, Bell + badge de não lidos no header do card, dialog com lista e toggle explícito de leitura. Teste manual via Playwright local (dirigido + suíte completa) obrigatório antes do PR — exigência do usuário.

**Veredito Final:** Faça

**Próximos Passos:** Superpowers — brainstorming → spec → plano → branch `feat/card-ultimo-registro-alertas` → TDD (helper de último registro + hook de alertas + dialog) → e2e local dirigido + suíte completa → pre-pr → PR → merge → deploy → validação em PRD

**Extended Thinking Usado:** não (decisão de escopo moderado, sem trade-off de arquitetura — 1 migration simples, sem tocar em dados financeiros existentes)
