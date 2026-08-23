-- Admin role support (rule-22 Architect Gate compliant)
-- Adds is_admin flag to profiles and updates RLS so admins see all data.

-- 1. Add is_admin column (default false — existing users are regular users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Helper: check if current user is admin (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

-- 3. Mark andreluiz0787@gmail.com as admin
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'andreluiz0787@gmail.com'
);

-- 4. Drop existing user-isolation policies and recreate with admin bypass
-- Owners
DROP POLICY IF EXISTS "Owners user isolation" ON public.owners;
CREATE POLICY "Owners user isolation"
  ON public.owners FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Programs
DROP POLICY IF EXISTS "Programs user isolation" ON public.programs;
CREATE POLICY "Programs user isolation"
  ON public.programs FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Origem Types
DROP POLICY IF EXISTS "Origem types user isolation" ON public.origem_types;
CREATE POLICY "Origem types user isolation"
  ON public.origem_types FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Accounts
DROP POLICY IF EXISTS "Accounts user isolation" ON public.accounts;
CREATE POLICY "Accounts user isolation"
  ON public.accounts FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Entries
DROP POLICY IF EXISTS "Entries user isolation" ON public.entries;
CREATE POLICY "Entries user isolation"
  ON public.entries FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Clients
DROP POLICY IF EXISTS "Clients user isolation" ON public.clients;
CREATE POLICY "Clients user isolation"
  ON public.clients FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Sales
DROP POLICY IF EXISTS "Sales user isolation" ON public.sales;
CREATE POLICY "Sales user isolation"
  ON public.sales FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- 5. Profiles: admin can read all profiles (for user management)
DROP POLICY IF EXISTS "Profiles select own" ON public.profiles;
CREATE POLICY "Profiles select own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- Keep insert/update policies scoped to own profile
-- (admin can't impersonate other users, only read)

-- 6. Account Alerts: admin can see all alerts
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios alertas" ON public.account_alerts;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios alertas" ON public.account_alerts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios alertas" ON public.account_alerts;

CREATE POLICY "Usuários podem inserir seus próprios alertas"
  ON public.account_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Usuários podem ver seus próprios alertas"
  ON public.account_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Usuários podem atualizar seus próprios alertas"
  ON public.account_alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 7. AI Telemetry: admin can see all telemetry
DROP POLICY IF EXISTS "Usuários podem ver sua própria telemetria" ON public.ai_telemetry;
CREATE POLICY "Usuários podem ver sua própria telemetria"
  ON public.ai_telemetry FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

-- 8. Feedback: admin can see all feedback
DROP POLICY IF EXISTS "Usuários podem ver seus próprios feedbacks" ON public.feedback;
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
