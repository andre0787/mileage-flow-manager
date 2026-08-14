-- Cor customizada por dono (visualização por cor — PR #397, extensão).
-- Coluna opcional: null → a UI usa a cor derivada por hash do nome (fallback).
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS color text;
