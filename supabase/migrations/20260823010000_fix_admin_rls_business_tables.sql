-- Fix: Admin should see their OWN business data, not everyone's data.
-- The KPI process/workflow data comes from static JSON files (kpi-data.json,
-- workflow-data.json), not from the database, so no RLS bypass is needed
-- for business tables.
--
-- This migration reverts the RLS policies on business tables back to
-- user_id = auth.uid() only. The admin role infrastructure (is_admin column,
-- function) is kept for future use.

-- Owners: revert to user-only access
DROP POLICY IF EXISTS "Owners user isolation" ON public.owners;
CREATE POLICY "Owners user isolation"
  ON public.owners FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Programs: revert to user-only access
DROP POLICY IF EXISTS "Programs user isolation" ON public.programs;
CREATE POLICY "Programs user isolation"
  ON public.programs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Origem Types: revert to user-only access
DROP POLICY IF EXISTS "Origem types user isolation" ON public.origem_types;
CREATE POLICY "Origem types user isolation"
  ON public.origem_types FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Accounts: revert to user-only access
DROP POLICY IF EXISTS "Accounts user isolation" ON public.accounts;
CREATE POLICY "Accounts user isolation"
  ON public.accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Entries: revert to user-only access
DROP POLICY IF EXISTS "Entries user isolation" ON public.entries;
CREATE POLICY "Entries user isolation"
  ON public.entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clients: revert to user-only access
DROP POLICY IF EXISTS "Clients user isolation" ON public.clients;
CREATE POLICY "Clients user isolation"
  ON public.clients FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sales: revert to user-only access
DROP POLICY IF EXISTS "Sales user isolation" ON public.sales;
CREATE POLICY "Sales user isolation"
  ON public.sales FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Account Alerts: revert to user-only access
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios alertas" ON public.account_alerts;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas" ON public.account_alerts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas" ON public.account_alerts;

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON public.account_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON public.account_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON public.account_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles: keep admin can read all (for user management display)
-- This is safe - profiles only contain name, no sensitive business data
DROP POLICY IF EXISTS "Profiles select own" ON public.profiles;
CREATE POLICY "Profiles select own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- AI Telemetry: keep admin access (for KPI cost data - comes from DB, not JSON)
DROP POLICY IF EXISTS "Usuários podem ver sua própria telemetria" ON public.ai_telemetry;
CREATE POLICY "Usuários podem ver sua própria telemetria"
  ON public.ai_telemetry FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

-- Feedback: keep admin access (for admin to see all feedback)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios feedbacks" ON public.feedback;
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
