-- Edição da DATA de adiantamentos no extrato de Saldo do cliente.
--
-- O ledger continua com saldo SEMPRE derivado (SUM earn − SUM spend) e sem
-- DELETE: esta policy libera apenas UPDATE de linhas próprias, e o endpoint
-- da aplicação trava o escopo (só 'earn' com sale_id NULL) antes de atualizar.
-- Valor/kind/sale_id de adiantamento nunca são alterados por esta edição
-- (só created_at), e spend/reversal/earn com venda seguem sem edição na UI.
DROP POLICY IF EXISTS "Usuários podem atualizar a data dos próprios movimentos de crédito"
  ON public.client_credit_movements;
CREATE POLICY "Usuários podem atualizar a data dos próprios movimentos de crédito"
  ON public.client_credit_movements FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trava no banco: a edição muda SÓ created_at. Qualquer tentativa de alterar
-- id/user_id/client_id/sale_id/kind/reversal_of/amount/note via UPDATE direto
-- é abortada (o endpoint da aplicação já trava o escopo antes).
CREATE OR REPLACE FUNCTION public.check_client_credit_date_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
    OR NEW.sale_id IS DISTINCT FROM OLD.sale_id
    OR NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.reversal_of IS DISTINCT FROM OLD.reversal_of
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.note IS DISTINCT FROM OLD.note THEN
    RAISE EXCEPTION 'Só a data (created_at) de adiantamentos pode ser editada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_credit_date_update ON public.client_credit_movements;
CREATE TRIGGER trg_client_credit_date_update
  BEFORE UPDATE ON public.client_credit_movements
  FOR EACH ROW EXECUTE FUNCTION public.check_client_credit_date_update();
