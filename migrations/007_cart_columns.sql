-- Migration 007: Adiciona colunas cart_amount e cart_cost à tabela entries
-- para a feature "Transferência com Compra no Carrinho"

ALTER TABLE entries ADD COLUMN cart_amount numeric;
ALTER TABLE entries ADD COLUMN cart_cost numeric;
