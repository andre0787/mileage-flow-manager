CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion')),
  message TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'triaged', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Permite inserção de qualquer usuário (logado ou não)
-- Anônimos podem reportar bugs sem criar conta
CREATE POLICY "Qualquer um pode inserir feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Usuários logados veem seus próprios feedbacks
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
