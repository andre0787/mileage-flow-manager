alter table public.sales drop constraint sales_status_check;
alter table public.sales add constraint sales_status_check check (status in ('pendente', 'pago', 'concluido', 'cancelado'));
