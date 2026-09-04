-- Ledger append-only de crédito por cliente (earn/spend/reversal).
-- Saldo é sempre DERIVADO (SUM earn − SUM spend); nenhuma coluna mutável.
-- Sem UPDATE/DELETE policies: RLS nega por padrão, impondo append-only no banco.
CREATE TABLE IF NOT EXISTS client_credit_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('earn', 'spend', 'reversal')),
  reversal_of TEXT CHECK (
    (kind = 'reversal' AND reversal_of IN ('earn', 'spend'))
    OR (kind IN ('earn', 'spend') AND reversal_of IS NULL)
  ),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_movements_user_client
  ON client_credit_movements(user_id, client_id);

ALTER TABLE client_credit_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem inserir seus próprios movimentos de crédito"
  ON public.client_credit_movements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios movimentos de crédito"
  ON public.client_credit_movements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
