-- Telemetria de eficiência da IA (Blueprint v9.0 — rule-48)
-- Coluna `area` extraída para o KPI "Custo por Funcionalidade" (Contas, Vendas, Milhas...)
CREATE TABLE IF NOT EXISTS ai_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  area TEXT,
  tokens_used INTEGER,
  prompt_tokens_saved_by_pruning INTEGER DEFAULT 0,
  total_execution_time_ms INTEGER,
  cost_estimate DECIMAL(10, 5),
  success_rate DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem inserir sua própria telemetria"
  ON public.ai_telemetry FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver sua própria telemetria"
  ON public.ai_telemetry FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
