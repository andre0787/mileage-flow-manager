-- Telemetria da IA (Blueprint v9.0 — rule-48): registros de sistema (user_id NULL,
-- inseridos via service role pelo `npm run telemetry:record`) devem ser visíveis
-- para usuários autenticados no KPI "Custo por Funcionalidade".
DROP POLICY IF EXISTS "Usuários podem ver sua própria telemetria" ON public.ai_telemetry;

CREATE POLICY "Usuários podem ver sua própria telemetria"
  ON public.ai_telemetry FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);
