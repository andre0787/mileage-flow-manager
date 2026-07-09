# 🗺️ Mapa de Experiências do Usuário — MilesControl

> Documento que mapeia todas as experiências possíveis do usuário no aplicativo.
> Útil para: planejamento de sprint, identificação de gaps, priorização de features.

**Última atualização:** 2026-07-09

---

## 📊 Visão Geral

| Página | Rota | Autenticação | Funcionalidades |
|--------|------|--------------|-----------------|
| Login | `/login` | Pública | Cadastro, login, recuperação de senha |
| Dashboard | `/` | Protegida | Visão geral, gráficos, métricas |
| Entradas | `/entradas` | Protegida | CRUD de entradas, transferências |
| Vendas | `/vendas` | Protegida | CRUD de vendas, simulador |
| Contas | `/contas` | Protegida | Gerenciamento de contas |
| Clientes | `/clientes` | Protegida | Gerenciamento de clientes |
| Controle CPF | `/controle-cpf` | Protegida | Controle de CPFs |
| Relatórios | `/relatorios` | Protegida | Relatórios e exportação |
| Configurações | `/configuracoes` | Protegida | Configurações do app |
| Perfil | `/perfil` | Protegida | Perfil do usuário |

---

## 🔐 Autenticação

### 1. Cadastro de Usuário
**Rota:** `/login` → Modal de cadastro

**Fluxo:**
1. Usuário clica em "Cadastre-se"
2. Preenche: nome, email, senha
3. Submete formulário
4. Recebe confirmação
5. Login automático

**Campos:**
- `#name` — Nome completo
- `#email` — Email (deve ser único)
- `#password` — Senha (mínimo 6 caracteres)

**Validações:**
- Email já cadastrado → erro
- Senha fraca → erro
- Campos obrigatórios → erro

**Edge Cases:**
- Usuário tenta cadastrar com email já existente
- Usuário fecha modal antes de completar
- Conexão cai durante cadastro

---

### 2. Login
**Rota:** `/login`

**Fluxo:**
1. Usuário insere email e senha
2. Clica em "Entrar"
3. Redireciona para `/`

**Campos:**
- `#email` — Email cadastrado
- `#password` — Senha

**Validações:**
- Credenciais inválidas → erro
- Usuário não existe → erro

**Edge Cases:**
- Usuário esquece senha → link "Esqueci minha senha"
- Conta bloqueada (múltiplas tentativas)
- Token expirado

---

### 3. Recuperação de Senha
**Rota:** `/forgot-password`

**Fluxo:**
1. Usuário insere email
2. Clica em "Enviar link"
3. Recebe email com link
4. Clica no link
5. Redireciona para `/reset-password`
6. Insere nova senha
7. Confirma

**Campos:**
- `#email` — Email para recuperação
- `#newPassword` — Nova senha
- `#confirmPassword` — Confirmação da senha

**Validações:**
- Email não cadastrado → mensagem genérica (segurança)
- Senhas não coincidem → erro
- Token inválido/expirado → erro

**Edge Cases:**
- Usuário não recebe email (verificar spam)
- Token expira (24h)
- Usuário tenta usar token já utilizado

---

## 📊 Dashboard

### 4. Visão Geral
**Rota:** `/`

**Componentes:**
- Cards de métricas (saldo total, investimento, lucro, ROI)
- Gráfico de pizza (milhas por programa)
- Gráfico de barras (vendas mensais)
- Abas Milhas/Pontos

**Dados Exibidos:**
- Total de milhas/pontos
- Total investido
- Lucro total
- Margem de lucro
- ROI

**Interações:**
- Clicar em card → detalhes
- Alternar abas Milhas/Pontos
- Hover nos gráficos → tooltip

**Edge Cases:**
- Sem dados → estado vazio
- Dados carregando → skeleton
- Erro ao carregar → mensagem de erro

---

### 5. Gráficos
**Componente:** `DashboardCharts.tsx`

**Tipos de Gráficos:**
1. **Pizza** — Distribuição por programa
2. **Barras** — Vendas mensais

**Interações:**
- Hover → tooltip com valores
- Click → (não implementado)

**Dados:**
- `programData` — [{name, value, color}]
- `monthlySales` — [{month, vendas, lucro}]

**Edge Cases:**
- Sem dados → gráfico vazio
- Muitos programas → legenda compacta
- Valores zero → gráfico não renderiza

---

## 📥 Entradas

### 6. Lista de Entradas
**Rota:** `/entradas`

**Componentes:**
- Abas Milhas/Pontos
- Tabela de entradas
- Botão "Nova Entrada"
- Filtros (período, programa)

**Dados Exibidos:**
- Data
- Programa
- Quantidade
- Valor pago
- Custo médio/milha
- Status

**Interações:**
- Clicar em "Editar" → drawer de edição
- Clicar em "Excluir" → confirmação
- Alternar abas
- Aplicar filtros

**Edge Cases:**
- Sem entradas → estado vazio
- Entradas pendentes → indicador
- Erro ao carregar → mensagem

---

### 7. Criar Entrada
**Ação:** Botão "Nova Entrada"

**Fluxo:**
1. Usuário clica em "Nova Entrada"
2. Drawer abre à direita
3. Preenche formulário
4. Clica em "Salvar"
5. Entrada criada
6. Lista atualizada

**Campos:**
- `#accountId` — Conta (select)
- `#origemTypeId` — Tipo de origem (select)
- `#amount` — Quantidade
- `#amountPaid` — Valor pago (R$)
- `#conversion` — Taxa de conversão (opcional)
- `#date` — Data

**Validações:**
- Campos obrigatórios
- Valores numéricos
- Conta deve existir

**Edge Cases:**
- Usuário cancela → drawer fecha sem salvar
- Erro ao salvar → mensagem de erro
- Rede cai → retry automático

---

### 8. Editar Entrada
**Ação:** Botão "Editar" na tabela

**Fluxo:**
1. Usuário clica em "Editar"
2. Drawer abre com dados preenchidos
3. Altera campos
4. Clica em "Salvar Alterações"
5. Entrada atualizada
6. Lista atualizada

**Campos:** (mesmos da criação)
- Todos os campos preenchidos com dados atuais

**Validações:** (mesmas da criação)

**Edge Cases:**
- Entrada foi excluída por outro usuário
- Dados conflitantes

---

### 9. Excluir Entrada
**Ação:** Botão "Excluir" na tabela

**Fluxo:**
1. Usuário clica em "Excluir"
2. AlertDialog aparece confirmando
3. Usuário confirma
4. Entrada excluída
5. Lista atualizada

**Edge Cases:**
- Usuário cancela → nada acontece
- Entrada já excluída → erro
- Entrada tem dependências → aviso

---

### 10. Transferência
**Ação:** Aba "Transferências" em Entradas

**Fluxo:**
1. Usuário seleciona "Transferência"
2. Preenche: conta origem, conta destino, quantidade
3. Sistema calcula custo automaticamente
4. Cria entrada de saída na origem
5. Cria entrada de entrada no destino

**Campos:**
- `#sourceAccountId` — Conta origem
- `#accountId` — Conta destino
- `#amount` — Quantidade transferida
- `#conversion` — Taxa de conversão

**Validações:**
- Conta origem tem saldo suficiente
- Contas diferentes
- Quantidade > 0

**Edge Cases:**
- Saldo insuficiente → erro
- Mesma conta origem/destino → erro
- Transferência parcial

---

## 💰 Vendas

### 11. Lista de Vendas
**Rota:** `/vendas`

**Componentes:**
- Tabela de vendas
- Botão "Nova Venda"
- Filtros (período, programa)
- Métricas (faturamento, lucro, margem)

**Dados Exibidos:**
- Data
- Programa
- Quantidade vendida
- Valor da venda
- Lucro
- Margem

**Interações:**
- Clicar em "Editar" → drawer
- Clicar em "Excluir" → confirmação
- Aplicar filtros

**Edge Cases:**
- Sem vendas → estado vazio
- Vendas com prejuízo → indicador vermelho

---

### 12. Criar Venda
**Ação:** Botão "Nova Venda"

**Fluxo:**
1. Usuário clica em "Nova Venda"
2. Drawer abre
3. Preenche formulário
4. Clica em "Salvar"
5. Venda criada
6. Lista atualizada

**Campos:**
- `#accountId` — Conta
- `#amount` — Quantidade vendida
- `#saleValue` — Valor da venda (R$)
- `#date` — Data

**Validações:**
- Conta tem estoque suficiente
- Valores positivos

**Edge Cases:**
- Estoque insuficiente → erro
- Venda com prejuízo → aviso

---

### 13. Editar Venda
**Ação:** Botão "Editar" na tabela

**Fluxo:** (mesmo da criação, com dados preenchidos)

---

### 14. Excluir Venda
**Ação:** Botão "Excluir" na tabela

**Fluxo:** (mesmo das entradas)

---

### 15. Simulador de Vendas
**Ação:** Aba "Simulador" em Vendas

**Funcionalidade:**
1. Usuário seleciona conta
2. Insere quantidade a vender
3. Sistema mostra:
   - Custo médio por milha
   - Preço sugerido
   - Lucro estimado
   - Margem estimada

**Campos:**
- `#accountId` — Conta (select)
- `#amount` — Quantidade a vender

**Cálculos:**
- Custo médio = total investido / total milhas
- Lucro = (preço venda × quantidade) - (custo médio × quantidade)
- Margem = lucro / receita × 100

**Edge Cases:**
- Conta sem estoque → mensagem
- Cálculo resulta em prejuízo → aviso

---

## 🏦 Contas

### 16. Lista de Contas
**Rota:** `/contas`

**Componentes:**
- Cards de contas
- Botão "Nova Conta"
- Métricas por conta

**Dados Exibidos:**
- Nome da conta
- Programa
- Dono
- Saldo
- Investimento total
- Custo médio/milha
- Status (ativa/inativa)

**Interações:**
- Clicar em conta → detalhes
- Clicar em "Editar" → modal
- Clicar em "Excluir" → confirmação

**Edge Cases:**
- Sem contas → estado vazio
- Conta inativa → indicador

---

### 17. Criar Conta
**Ação:** Botão "Nova Conta"

**Fluxo:**
1. Usuário clica em "Nova Conta"
2. Modal abre
3. Preenche formulário
4. Clica em "Salvar"
5. Conta criada

**Campos:**
- `#name` — Nome da conta
- `#programId` — Programa (select)
- `#ownerId` — Dono (select)
- `#type` — Tipo (milhas/pontos)
- `#balance` — Saldo inicial
- `#totalInvested` — Investimento inicial

**Validações:**
- Nome único por programa
- Valores numéricos

**Edge Cases:**
- Programa não existe → erro
- Dono não existe → erro

---

### 18. Editar Conta
**Ação:** Botão "Editar" no card

**Fluxo:** (mesmo da criação, com dados preenchidos)

---

### 19. Excluir Conta
**Ação:** Botão "Excluir" no card

**Fluxo:** (mesmo das entradas)

**Edge Cases:**
- Conta tem entradas/vinculadas → aviso
- Conta é usada em transferências → aviso

---

## 👥 Clientes

### 20. Lista de Clientes
**Rota:** `/clientes`

**Componentes:**
- Tabela de clientes
- Botão "Novo Cliente"
- Busca

**Dados Exibidos:**
- Nome
- Email
- Telefone
- CPF
- Total de compras
- Última compra

**Interações:**
- Clicar em "Editar" → modal
- Clicar em "Excluir" → confirmação
- Buscar por nome/email

**Edge Cases:**
- Sem clientes → estado vazio
- Cliente sem compras → indicador

---

### 21. Criar Cliente
**Ação:** Botão "Novo Cliente"

**Fluxo:**
1. Usuário clica em "Novo Cliente"
2. Modal abre
3. Preenche formulário
4. Clica em "Salvar"
5. Cliente criado

**Campos:**
- `#name` — Nome completo
- `#email` — Email
- `#phone` — Telefone
- `#cpf` — CPF

**Validações:**
- Email único
- CPF válido (formato)
- Campos obrigatórios

**Edge Cases:**
- Email já cadastrado → erro
- CPF já cadastrado → erro

---

### 22. Editar Cliente
**Ação:** Botão "Editar" na tabela

**Fluxo:** (mesmo da criação, com dados preenchidos)

---

### 23. Excluir Cliente
**Ação:** Botão "Excluir" na tabela

**Fluxo:** (mesmo das entradas)

**Edge Cases:**
- Cliente tem vendas vinculadas → aviso

---

## 🆔 Controle CPF

### 24. Lista de CPFs
**Rota:** `/controle-cpf`

**Componentes:**
- Tabela de CPFs
- Botão "Novo CPF"
- Status de cada CPF

**Dados Exibidos:**
- CPF
- Nome do titular
- Status (disponível/usado/bloqueado)
- Último uso

**Interações:**
- Clicar em "Editar" → modal
- Clicar em "Excluir" → confirmação
- Alterar status

**Edge Cases:**
- Sem CPFs → estado vazio
- CPF bloqueado → indicador

---

### 25. Criar CPF
**Ação:** Botão "Novo CPF"

**Fluxo:**
1. Usuário clica em "Novo CPF"
2. Modal abre
3. Preenche formulário
4. Clica em "Salvar"
5. CPF criado

**Campos:**
- `#cpf` — CPF (formato XXX.XXX.XXX-XX)
- `#name` — Nome do titular
- `#status` — Status (disponível/usado/bloqueado)

**Validações:**
- CPF único
- CPF válido (formato)
- Campos obrigatórios

**Edge Cases:**
- CPF já cadastrado → erro
- CPF inválido → erro

---

### 26. Editar CPF
**Ação:** Botão "Editar" na tabela

**Fluxo:** (mesmo da criação, com dados preenchidos)

---

### 27. Excluir CPF
**Ação:** Botão "Excluir" na tabela

**Fluxo:** (mesmo das entradas)

**Edge Cases:**
- CPF está sendo usado em venda → aviso

---

## 📈 Relatórios

### 28. Relatório por Dono
**Rota:** `/relatorios` → Aba "Por Dono"

**Componentes:**
- Tabela de relatórios
- Filtros (período, dono)
- Botão "Exportar CSV"

**Dados Exibidos:**
- Nome do dono
- Total de pontos adquiridos
- Investimento total
- Milhas geradas
- Faturamento
- Lucro
- Margem
- ROI

**Interações:**
- Aplicar filtros
- Exportar para CSV

**Edge Cases:**
- Sem dados → estado vazio
- Filtro sem resultados → mensagem

---

### 29. Relatório por Programa
**Rota:** `/relatorios` → Aba "Por Programa"

**Componentes:**
- Tabela de relatórios
- Filtros (período, programa)
- Botão "Exportar CSV"

**Dados Exibidos:**
- Nome do programa
- Estoque atual
- Custo médio/milha
- Milhas vendidas
- Faturamento
- Lucro

**Interações:**
- Aplicar filtros
- Exportar para CSV

**Edge Cases:**
- Sem dados → estado vazio
- Programa sem estoque → indicador

---

### 30. Exportação CSV
**Ação:** Botão "Exportar CSV"

**Fluxo:**
1. Usuário clica em "Exportar CSV"
2. Sistema gera arquivo CSV
3. Download automático
4. Mensagem de sucesso

**Formato:**
- UTF-8 com BOM
- Separador: vírgula
- Aspas para campos com vírgula

**Edge Cases:**
- Sem dados para exportar → mensagem
- Arquivo muito grande → (não tratado)

---

## ⚙️ Configurações

### 31. Configurações Gerais
**Rota:** `/configuracoes`

**Componentes:**
- Seções de configuração
- Toggle switches
- Botões de ação

**Configurações Disponíveis:**
- Notificações (toggle)
- Tema (claro/escuro)
- Idioma (pt-BR) — futuro
- Unidade (milhas/pontos)

**Interações:**
- Alterar configurações
- Salvar automaticamente

**Edge Cases:**
- Erro ao salvar → mensagem
- Configuração resetada → aviso

---

## 👤 Perfil

### 32. Perfil do Usuário
**Rota:** `/perfil`

**Componentes:**
- Informações do usuário
- Botão "Editar"
- Botão "Sair"

**Dados Exibidos:**
- Nome
- Email
- Data de criação
- Último acesso

**Interações:**
- Editar perfil
- Sair da conta

**Edge Cases:**
- Email já cadastrado → erro ao editar
- Último acesso desatualizado

---

## 🔄 Fluxos Transversais

### 33. Navegação
**Componente:** `AppSidebar.tsx`

**Itens:**
- Dashboard
- Entradas
- Vendas
- Contas
- Clientes
- Controle CPF
- Relatórios
- Configurações
- Perfil

**Interações:**
- Clicar em item → navega
- Item ativo → indicador
- Colapsar sidebar (mobile)

**Edge Cases:**
- Rota não existe → 404
- Usuário não autenticado → redireciona para login

---

### 34. Notificações
**Componente:** `Sonner` (toast)

**Tipos:**
- Sucesso (verde)
- Erro (vermelho)
- Info (azul)
- Aviso (amarelo)

**Interações:**
- Aparece por 3-5 segundos
- Pode ser fechada manualmente

**Edge Cases:**
- Muitas notificações → empilhamento
- Notificação longa → truncamento

---

### 35. Loading States
**Componentes:** `SkeletonLoader.tsx`

**Tipos:**
- Skeleton de card
- Skeleton de tabela
- Skeleton de gráfico

**Interações:**
- Aparece durante carregamento
- Desaparece quando dados chegam

**Edge Cases:**
- Loading muito longo → timeout
- Dados não chegam → erro

---

### 36. Erros
**Componente:** `ErrorBoundary.tsx`

**Fluxo:**
1. Erro ocorre
2. ErrorBoundary captura
3. Mostra mensagem amigável
4. Botão "Tentar novamente"

**Edge Cases:**
- Erro crítico → página de erro
- Erro recorrente → logs

---

### 37. Responsividade
**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Comportamento:**
- Mobile: sidebar colapsada, layout 1 coluna
- Tablet: sidebar visível, layout 2 colunas
- Desktop: sidebar completa, layout 2 colunas

**Edge Cases:**
- Redimensionamento → reflow suave
- Orientação landscape/portrait

---

## 📱 Mobile

### 38. Bottom Tab Bar
**Componente:** `BottomTabBar.tsx`

**Itens:**
- Dashboard
- Entradas
- Vendas
- Contas
- Mais (Configurações, Perfil)

**Interações:**
- Clicar em item → navega
- Item ativo → indicador
- Scroll → esconde/aparece

**Edge Cases:**
- Muitos itens → overflow
- Teclado aberto → esconde

---

### 39. Gestos
**Suporte:**
- Swipe para deletar (futuro)
- Pull to refresh (futuro)
- Pinch to zoom (não aplicável)

**Edge Cases:**
- Gestos conflitantes
- Dispositivo não suporta

---

## 🔒 Segurança

### 40. Autenticação
**Método:** Email + Senha (Supabase Auth)

**Proteções:**
- Senhas hasheadas (bcrypt)
- Tokens JWT
- RLS (Row Level Security)

**Edge Cases:**
- Token expirado → refresh automático
- Sessão duplicada → logout

---

### 41. Autorização
**Método:** RLS policies

**Regra:** `user_id = auth.uid()`

**Edge Cases:**
- Usuário tenta acessar dado de outro → bloqueado
- RLS desabilitado (dev) → risco

---

### 42. Validação de Dados
**Lado do Cliente:**
- Formulários com validação
- Tipagem TypeScript

**Lado do Servidor:**
- RLS policies
- Constraints no banco

**Edge Cases:**
- Dados inválidos chegam ao servidor → rejeitado
- Validação cliente falha → erro amigável

---

## 📊 Métricas de Uso

### 43. Tracking
**Não implementado atualmente**

**Futuro:**
- Páginas visitadas
- Ações realizadas
- Tempo em cada página
- Erros encontrados

---

## 🎯 Gaps Identificados

### Features Não Implementadas
1. **Notificações Push** — Usuário não é alertado sobre entrada pendente
2. **Modo Offline** — Dados perdem-se sem internet
3. **Multi-idioma** — Apenas pt-BR
4. **Exportação PDF** — Apenas CSV
5. **Busca global** — Sem busca unificada
6. **Atalhos de teclado** — Sem atalhos
7. **Dark mode toggle** — Tema fixo
8. **Histórico de ações** — Sem undo/redo
9. **Compartilhamento** — Sem compartilhamento de relatórios
10. **Integrações** — Sem integração com outros sistemas

### UX que Pode Melhorar
1. **Skeleton loaders** — Podem ser mais específicos
2. **Empty states** — Podem ter mais Call-to-Action
3. **Error messages** — Podem ser mais descritivas
4. **Toasts** — Podem ter mais ações (ex: desfazer)
5. **Formulários** — Podem ter auto-save
6. **Filtros** — Podem ser salvos como preferência
7. **Ordenação** — Tabelas podem ser ordenáveis
8. **Paginação** — Listas longas podem ter paginação
9. **Bulk actions** — Seleção múltipla para exclusão
10. **Exportação** — Mais formatos (Excel, PDF)

---

## 📋 Próximos Passos

### Sprint #5 (Sugerida)
1. **Notificações push** — Alertar sobre entrada pendente
2. **Melhorar empty states** — Adicionar CTAs
3. **Adicionar paginação** — Listas longas

### Sprint #6 (Futura)
1. **Modo offline** — PWA com service worker
2. **Exportação PDF** — Relatórios profissionais
3. **Busca global** — Pesquisa unificada

### Sprint #7 (Futura)
1. **Multi-idioma** — i18n
2. **Dark mode** — Toggle de tema
3. **Atalhos de teclado** — Produtividade

---

## 📚 Referências

- **Arquitetura:** `docs/ARCHITECTURE.md`
- **Convenções:** `docs/CONVENTIONS.md`
- **Testes:** `docs/TESTING.md`
- **Workflow:** `docs/WORKFLOW.md`

---

**Última atualização:** 2026-07-09
**Próxima revisão:** Quando houver mudanças significativas na UX
