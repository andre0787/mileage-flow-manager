-- Pipeline real (DAG) + AI Command Center: dados automáticos a cada sessão.
--
-- 1. Registros de SISTEMA (user_id NULL, inseridos via service role pelo
--    telemetry:persist/telemetry:record no nightly) precisam ser visíveis
--    para o client do browser, que usa a anon key SEM sessão (role `anon`).
--    A policy anterior cobria apenas `authenticated` → leitura sempre vazia.
--    Usuários autenticados continuam vendo o próprio user_id (policy intacta
--    em 20260823020000_remove_admin_infrastructure.sql).
DROP POLICY IF EXISTS "Telemetria de sistema visível (anon)" ON public.ai_telemetry;
CREATE POLICY "Telemetria de sistema visível (anon)"
  ON public.ai_telemetry FOR SELECT TO anon
  USING (user_id IS NULL);

-- 2. event_id: dedupe/merge idempotente — o nightly reprocessa envelopes.jsonl
--    a cada dia; sem coluna única, cada rodada duplicaria as linhas.
--    Índice único COMPLETO (não parcial): o on_conflict=event_id do PostgREST
--    exige constraint/índice sem predicate (42P10). Múltiplos NULLs seguem
--    válidos — NULL não conflita em índice único no Postgres.
ALTER TABLE public.ai_telemetry ADD COLUMN IF NOT EXISTS event_id TEXT;
DROP INDEX IF EXISTS ai_telemetry_event_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS ai_telemetry_event_id_key
  ON public.ai_telemetry (event_id);
