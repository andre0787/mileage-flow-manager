-- Alertas personalizados por conta (data + observação + lido/não lido)
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
  ON public.account_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON public.account_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON public.account_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
