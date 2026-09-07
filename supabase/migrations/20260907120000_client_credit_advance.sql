-- Adiantamento do cliente (crédito recebido ANTES da emissão, sem venda).
--
-- Cenário: o cliente deposita o dinheiro antes de qualquer emissão. O ledger
-- client_credit_movements exigia sale_id NOT NULL, o que impossibilitava
-- registrar esse dinheiro. Agora: sale_id opcional + note descritiva.
-- Saldo continua SEMPRE derivado (SUM earn − SUM spend); append-only mantido.

ALTER TABLE public.client_credit_movements
  ALTER COLUMN sale_id DROP NOT NULL;

ALTER TABLE public.client_credit_movements
  ADD COLUMN IF NOT EXISTS note TEXT;

-- 'spend' (consumo) continua amarrado a uma venda; 'earn' pode ser
-- adiantamento (sale_id NULL); 'reversal' herda o original referenciado.
ALTER TABLE public.client_credit_movements DROP CONSTRAINT IF EXISTS client_credit_movements_sale_check;
ALTER TABLE public.client_credit_movements ADD CONSTRAINT client_credit_movements_sale_check
  CHECK (kind <> 'spend' OR sale_id IS NOT NULL);
