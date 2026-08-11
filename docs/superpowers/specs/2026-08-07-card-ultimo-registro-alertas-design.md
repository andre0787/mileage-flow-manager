# Spec — Último registro no card + Alertas por conta

> **Data:** 2026-08-07
> **Sessão:** feature — (1) último registro de entrada/venda no card das contas; (2) alerta personalizado por conta
> **Council:** `docs/council/2026-08-07-card-ultimo-registro-alertas-veredito.md` (veredito: FAÇA)
> **Aprovação do usuário:** "manda bala" (design aprovado)

---

## 1. Objetivo

1. Exibir no card de cada conta (`src/pages/Contas.tsx`) o **último registro de entrada** e o **último registro de venda**.
2. Permitir **alertas personalizados por conta**: data + observação + marcação lido/não lido, acessíveis pelo card da conta.

Requisito do usuário: teste manual via Playwright em servidor local antes do PR/merge para prod.

## 2. Item 1 — Último registro no card

### Helper (ponto único)

Novo `src/lib/accountActivity.ts`:

```ts
export interface AccountActivity {
  lastEntry?: PointEntry;
  lastSale?: Sale;
}

export function getLastAccountActivity(
  entries: PointEntry[],
  sales: Sale[],
  accountId: string,
): AccountActivity;
```

- Filtro de "registro válido" **idêntico** ao `computedBalances` de `Contas.tsx`:
  - Entradas: exclui `entryStatus === "aguardando"` (recorrências futuras)
  - Vendas: exclui `status === "cancelado"`
- Último = maior `date` (ISO string, comparação lexicográfica)
- Sem dependência de React/Supabase (função pura — regra de organização `src/lib/`)

### Card

Em `CardContent` de `Contas.tsx`, após a linha "Dono:":

```
Última entrada:  <data pt-BR ou "—">
Última venda:    <data pt-BR ou "—">
```

- Formato: `dd/mm/aaaa` (mesmo formatador usado no app — verificar `formatDate` em `src/lib/utils.ts`; se inexistente, `toLocaleDateString("pt-BR")`)
- Sem registro → "—" (decisão do usuário: linhas sempre visíveis, grid uniforme)

### Testes

`tests/unit/accountActivity.test.ts` (regra #31):
- entrada mais recente retornada
- entrada `aguardando` ignorada
- venda `cancelado` ignorada
- conta sem registros → `lastEntry`/`lastSale` undefined
- múltiplas contas → só a da conta filtrada

## 3. Item 2 — Alertas por conta

### Migration

`supabase/migrations/20260807000000_add_account_alerts.sql` (padrão do feedback table):

```sql
CREATE TABLE IF NOT EXISTS account_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  observation TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE account_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON account_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON account_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON account_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Types (`src/types/index.ts`)

```ts
export interface AccountAlert {
  id: string;
  accountId: string;
  userId: string;
  date: string; // YYYY-MM-DD (DATE do Postgres)
  observation: string;
  read: boolean;
  createdAt: string;
}
```

### Hooks do domínio alerts (migrado em P3-32 para src/features/alerts/)

- `useAccountAlerts()` — `useQuery(["account_alerts", userId], ...)`, enabled com userId
- `useAddAccountAlertMutation()` — insert `{ account_id, user_id, date, observation, read: false }` + `invalidateQueries(["account_alerts"], { refetchType: 'all' })`
- `useToggleAccountAlertMutation()` — update `{ read }` por id + invalidate (regra #19)

Exportar no barrel `src/hooks/useDatabase/index.ts`.

### Componente `src/components/AccountAlertsDialog.tsx`

- Props: `{ account: Account; open: boolean; onOpenChange: (open: boolean) => void }`
- Lista de alertas da conta ordenada por `date` desc:
  - Cada item: data formatada + observação + badge "Não lido"/"Lida" + switch/checkbox para marcar lido
  - Vazio → EmptyState curto ("Nenhum alerta para esta conta")
- Form no topo (ou rodapé): `input type="date"` (obrigatório) + `textarea` observação (obrigatória) + botão "Adicionar alerta"
- Marcar lido usa `useToggleAccountAlertMutation`; criar usa `useAddAccountAlertMutation`
- Reset do form após adicionar
- pt-BR na interface

### Card (`src/pages/Contas.tsx`)

- Ícone **Bell** (lucide) no header do card (área dos badges, lado direito)
- Badge de contagem de alertas **não lidos** (só quando > 0), junto ao Bell
- Clique abre `AccountAlertsDialog` com a conta
- Estado local `alertsOpenFor: Account | null`

### Testes

- Unit (regra #32): `src/components/tests/AccountAlertsDialog.test.tsx` — renderiza lista, adiciona alerta (mock de mutation), toggle lido (mock)
- E2E `tests/alerts.spec.ts`:
  1. Cria conta e2e (usuário efêmero)
  2. Abre dialog pelo Bell
  3. Cria alerta (data + observação)
  4. Badge "1" de não lido no card
  5. Marca como lida
  6. Badge some
  7. Recarrega página → alerta persiste com badge de lida

## 4. Teste manual local (exigência do usuário)

1. Rodar `tests/alerts.spec.ts` dirigido no servidor local (Vite dev em 8080)
2. Rodar suíte e2e completa local (`npx playwright test`) — 62 testes
3. Só então `npm run pre-pr` → PR → merge → deploy

## 5. Fora de escopo (YAGNI)

- Editar/deletar alerta individual (só criar + marcar lido)
- Notificações push ou lembretes automáticos
- Alertas globais (não vinculados a conta)
- Mudanças no `computedBalances` existente (helper novo apenas consome o mesmo filtro)
