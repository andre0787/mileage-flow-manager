-- P7 Telemetry v5 (SDD §19-21): colunas do TelemetryEnvelope na ai_telemetry.
-- Additive — todas nullable, não quebram inserts existentes.
ALTER TABLE public.ai_telemetry
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS task_id TEXT,
  ADD COLUMN IF NOT EXISTS execution_id TEXT,
  ADD COLUMN IF NOT EXISTS agent_adapter TEXT,
  ADD COLUMN IF NOT EXISTS agent_role TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS tool_calls INTEGER,
  ADD COLUMN IF NOT EXISTS error_code TEXT;
