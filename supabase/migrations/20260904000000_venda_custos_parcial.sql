-- Migration: venda custos dinâmicos + recebimento parcial
-- additional_costs: lista JSONB [{desc text, amount numeric}]
-- amount_received: valor já recebido (parcial), pendente = sale_value - amount_received
ALTER TABLE sales ADD COLUMN IF NOT EXISTS additional_costs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_received numeric NOT NULL DEFAULT 0;
-- Compat: mantém additional_cost/additional_cost_desc como soma/legado; sem CREATE TABLE, RLS inalterado.
