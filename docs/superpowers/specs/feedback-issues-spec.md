# Spec: Canal de Feedback (Bugs/Sugestões)

> Council Verdict: 2026-07-11 — Fazer em 2 fases

## Problema
Usuários não têm um canal para reportar bugs ou sugerir melhorias dentro do app.

## Solução

### Fase 1 — 🧪 MVP (5 min)
- Templates de Issue no GitHub (`.github/ISSUE_TEMPLATE/`)
- Link "Reportar problema" no AppSidebar + BottomTabBar
  → Abre `https://github.com/andre0787/mileage-flow-manager/issues/new/choose`

### Fase 2 — 📋 Formulário Interno (2-3h)
- Tabela `feedback` no Supabase
- Componente `FeedbackDialog` (shadcn/ui Dialog + Form)
- Botão nos menus de navegação
- Persiste em Supabase com user_id (se logado)

## Stack
- Supabase (tabela `feedback`)
- shadcn/ui (Dialog, Button, Textarea, Input)
- Lucide icons (Bug, Lightbulb)
- React Hook Form (já no projeto)

## Tabela `feedback`
```sql
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion')),
  message TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'triaged', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Componentes
- `FeedbackDialog.tsx` — Modal com formulário
- `FeedbackButton.tsx` — Botão reutilizável (opcional, pode ser inline)

## Prioridade
1. Templates de Issue + link (5 min)
2. Tabela feedback no Supabase
3. Componente FeedbackDialog
4. Botão na sidebar e bottom tab

## Métricas
- Nenhuma issue criada manualmente = canal não usado
- Issues duplicadas = template precisa melhorar
