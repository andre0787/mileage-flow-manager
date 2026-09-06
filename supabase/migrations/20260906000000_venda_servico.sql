-- Venda standalone de serviço (PR1 — Proposta B do council 2026-09-06).
-- Discriminador sale_kind + tipo de serviço + observações.
-- NUNCA editar migration existente (rule-43); sem criacao de tabela → sem RLS nova.
-- Linhas existentes ganham sale_kind='milhas' via DEFAULT (backfill implícito).

ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_kind text NOT NULL DEFAULT 'milhas';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS service_type text NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS observations text NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_kind_check') THEN
    ALTER TABLE sales ADD CONSTRAINT sales_kind_check
      CHECK (sale_kind IN ('milhas', 'servico'));
  END IF;
END $$;
