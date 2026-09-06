-- F3 telemetria: vencimento da venda + historico de transicoes de status.
-- Base para calibrar WIP/lead time com dados reais (council pipeline F3).
-- Acompanha o padrao do ledger de credito: policies com auth.uid().

ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date date NULL;

CREATE TABLE IF NOT EXISTS sale_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_user_sale
  ON sale_status_history(user_id, sale_id);

ALTER TABLE sale_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem inserir seu proprio historico de status"
  ON public.sale_status_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem ver seu proprio historico de status"
  ON public.sale_status_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
