-- Venda: flag para considerar ou não no cálculo de ROI dos relatórios.
-- Default true preserva o comportamento das linhas existentes.
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS include_in_roi boolean NOT NULL DEFAULT true;
