-- Remove admin infrastructure completely.
-- Reverts all changes from 20260823000000_add_admin_role.sql

-- 1. Revert Profiles policy to original (must be done before dropping function)
DROP POLICY IF EXISTS "Profiles select own" ON public.profiles;
CREATE POLICY "Profiles select own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- 2. Revert AI Telemetry policy to original
DROP POLICY IF EXISTS "Usuários podem ver sua própria telemetria" ON public.ai_telemetry;
CREATE POLICY "Usuários podem ver sua própria telemetria"
  ON public.ai_telemetry FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Revert Feedback policy to original
DROP POLICY IF EXISTS "Usuários podem ver seus próprios feedbacks" ON public.feedback;
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Now drop is_admin() function (no more dependencies)
DROP FUNCTION IF EXISTS public.is_admin();

-- 5. Drop is_admin column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
