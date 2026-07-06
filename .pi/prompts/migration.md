---
description: Create a Supabase migration snippet
---
Generate a SQL migration for Supabase. Follow these rules:
- Use `CREATE OR REPLACE` when possible
- Include RLS policies if applicable
- Add `SECURITY DEFINER` for functions that access multiple tables
- Wrap in a comment block explaining the migration

Contexto do banco:
- Tables: profiles, owners, programs, origem_types, accounts, entries, clients, sales
- All tables have: id (uuid PK), user_id (uuid FK to auth.users), created_at, updated_at
- RLS: ALL policies scoped to `auth.uid() = user_id`
