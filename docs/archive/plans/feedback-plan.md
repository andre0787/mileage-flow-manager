# Plano: Canal de Feedback

> Baseado no spec `feedback-issues-spec.md`

## Tarefas

### 🎯 T1: Issue Templates (5 min)
- [ ] Criar `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] Criar `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] Criar `.github/ISSUE_TEMPLATE/config.yml`

### 🎯 T2: Link no AppSidebar + BottomTabBar (5 min)
- [ ] Adicionar item "Reportar problema" antes de "Sair" na sidebar
- [ ] Adicionar link no BottomTabBar ou como item extra

### 🎯 T3: Tabela feedback no Supabase (3 min)
- [ ] RODAR SQL para criar tabela `feedback`

### 🎯 T4: Componente FeedbackDialog (30 min)
- [ ] Criar `src/components/FeedbackDialog.tsx`
- [ ] Usar shadcn/ui Dialog + Form
- [ ] Supabase insert com user_id do AuthContext

### 🎯 T5: Integrar nos menus (5 min)
- [ ] Botão "Reportar" na AppSidebar abre FeedbackDialog
- [ ] Alternativa no BottomTabBar

## Ordem
T1 → T2 → T3 → T4 → T5
