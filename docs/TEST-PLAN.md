# 🧪 Plano de Testes — MilesControl

> Plano completo baseado no Mapa de Experiências do Usuário.
> Última atualização: 2026-07-10

---

## 📊 Visão Geral

| Métrica | Valor |
|---------|-------|
| **Total de fluxos** | 43 |
| **Cenários de teste** | 85+ |
| **Testes E2E existentes** | 8 arquivos |
| **Prioridade crítica** | 24 testes |
| **Cobertura atual** | ~40% |

---

## 🎯 Estratégia de Testes

### Níveis de Teste

1. **Unitários (Vitest)** — Lógica de negócio isolada
2. **E2E (Playwright)** — Fluxos completos do usuário
3. **Smoke Tests** — Prevenção de tela preta

### Ordem de Prioridade

1. 🔴 **Crítico** — Integridade financeira, autenticação, CRUD destrutivo
2. 🟡 **Alto** — UX, feedback, navegação
3. 🟢 **Médio** — Responsividade, edge cases

---

## 🔐 Autenticação

### TC-AUTH-001: Cadastro de Usuário
- **Prioridade:** 🔴 Crítico
- **Arquivo:** `tests/auth.spec.ts` (novo)
- **Fluxo:**
  1. Acessar `/login`
  2. Clicar em "Cadastre-se"
  3. Preencher nome, email, senha
  4. Submeter
  5. Verificar redirecionamento para `/`
- **Assertivas:**
  - [ ] Formulário de cadastro aparece
  - [ ] Validação de campos obrigatórios
  - [ ] Redirecionamento após sucesso
  - [ ] Toast de sucesso

### TC-AUTH-002: Login com Credenciais Válidas
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Acessar `/login`
  2. Preencher email e senha
  3. Clicar em "Entrar"
  4. Verificar redirecionamento para `/`
- **Assertivas:**
  - [ ] Redirecionamento para dashboard
  - [ ] Usuário autenticado (token no localStorage)

### TC-AUTH-003: Login com Senha Errada
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Acessar `/login`
  2. Preencher email correto e senha errada
  3. Clicar em "Entrar"
- **Assertivas:**
  - [ ] Toast "Credenciais inválidas" aparece
  - [ ] Usuário permanece na página de login

### TC-AUTH-004: Acesso a Rota Protegida sem Login
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Limpar localStorage
  2. Acessar `/` diretamente
- **Assertivas:**
  - [ ] Redirecionamento para `/login`

### TC-AUTH-005: Recuperação de Senha
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Acessar `/forgot-password`
  2. Inserir email
  3. Clicar em "Enviar link"
- **Assertivas:**
  - [ ] Toast de confirmação
  - [ ] Mensagem genérica (não revela se email existe)

---

## 📊 Dashboard

### TC-DASH-001: Dashboard com Dados
- **Prioridade:** 🟡 Alto
- **Pré-condição:** Usuário tem entradas e vendas
- **Fluxo:**
  1. Login
  2. Acessar `/`
- **Assertivas:**
  - [ ] Cards de métricas visíveis
  - [ ] Gráficos renderizados
  - [ ] Abas Milhas/Pontos funcionam

### TC-DASH-002: Dashboard Sem Dados
- **Prioridade:** 🟡 Alto
- **Pré-condição:** Usuário novo sem dados
- **Fluxo:**
  1. Login
  2. Acessar `/`
- **Assertivas:**
  - [ ] Empty state exibido
  - [ ] Métricas em zero

---

## 📥 Entradas

### TC-ENT-001: Criar Entrada
- **Prioridade:** 🔴 Crítico
- **Arquivo:** `tests/entradas.spec.ts` (existente)
- **Fluxo:**
  1. Acessar `/entradas`
  2. Clicar em "Nova Entrada"
  3. Preencher formulário
  4. Salvar
- **Assertivas:**
  - [ ] Drawer abre
  - [ ] Toast.success após salvar
  - [ ] Entrada aparece na lista
  - [ ] Saldo da conta atualizado

### TC-ENT-002: Editar Entrada
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Clicar em "Editar" na tabela
  2. Alterar valor
  3. Salvar
- **Assertivas:**
  - [ ] Drawer abre com dados preenchidos
  - [ ] Dados atualizados na lista
  - [ ] Saldo recalculado

### TC-ENT-003: Excluir Entrada
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Clicar em "Excluir"
  2. Confirmar no AlertDialog
- **Assertivas:**
  - [ ] AlertDialog aparece
  - [ ] Toast.success após exclusão
  - [ ] Entrada removida da lista
  - [ ] Saldo da conta revertido

### TC-ENT-004: Criar Transferência
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Selecionar tipo "Transferência"
  2. Preencher origem, destino, valor
  3. Salvar
- **Assertivas:**
  - [ ] Custo calculado automaticamente
  - [ ] Entrada de saída criada na origem
  - [ ] Entrada de entrada criada no destino
  - [ ] Saldos atualizados corretamente

### TC-ENT-005: Paginação
- **Prioridade:** 🟡 Alto
- **Pré-condição:** 25+ entradas
- **Fluxo:**
  1. Acessar `/entradas`
  2. Verificar paginação
  3. Navegar entre páginas
- **Assertivas:**
  - [ ] "Mostrando 1-20 de X"
  - [ ] Navegação entre páginas funciona

---

## 💰 Vendas

### TC-VEND-001: Criar Venda
- **Prioridade:** 🔴 Crítico
- **Arquivo:** `tests/fluxo-completo.spec.ts` (existente)
- **Fluxo:**
  1. Acessar `/vendas`
  2. Clicar em "Nova Venda"
  3. Preencher formulário
  4. Salvar
- **Assertivas:**
  - [ ] Venda criada
  - [ ] Estoque da conta diminuiu
  - [ ] Métricas atualizadas

### TC-VEND-002: Cancelar Venda
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Clicar em "Cancelar" na tabela
  2. Confirmar no AlertDialog
- **Assertivas:**
  - [ ] Status muda para "cancelado"
  - [ ] Estoque restaurado

### TC-VEND-003: Simulador de Vendas
- **Prioridade:** 🟢 Médio
- **Fluxo:**
  1. Acessar aba "Simulador"
  2. Selecionar conta
  3. Inserir valores
- **Assertivas:**
  - [ ] Cálculos corretos
  - [ ] Resultados exibidos

### TC-VEND-004: Exportar CSV
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Clicar em "Exportar CSV"
- **Assertivas:**
  - [ ] Download iniciado
  - [ ] Arquivo com dados corretos

---

## 🏦 Contas

### TC-CONT-001: Criar Conta
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Acessar `/contas`
  2. Clicar em "Nova Conta"
  3. Preencher formulário
  4. Salvar
- **Assertivas:**
  - [ ] Conta criada
  - [ ] Aparece na lista

### TC-CONT-002: Excluir Conta
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Clicar em "Excluir"
  2. Confirmar
- **Assertivas:**
  - [ ] Conta removida
  - [ ] Entradas vinculadas removidas (cascade)

---

## 👥 Clientes

### TC-CLI-001: Criar Cliente
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Acessar `/clientes`
  2. Clicar em "Novo Cliente"
  3. Preencher formulário
  4. Salvar
- **Assertivas:**
  - [ ] Cliente criado
  - [ ] Aparece na lista

### TC-CLI-002: Excluir Cliente com Vendas
- **Prioridade:** 🟡 Alto
- **Pré-condição:** Cliente tem vendas vinculadas
- **Fluxo:**
  1. Tentar excluir cliente
- **Assertivas:**
  - [ ] Botão desabilitado ou AlertDialog de bloqueio
  - [ ] Mensagem explicativa

---

## ⚙️ Configurações

### TC-CONF-001: Limpar Cache
- **Prioridade:** 🟢 Médio
- **Fluxo:**
  1. Acessar `/configuracoes`
  2. Clicar em "Limpar Cache"
- **Assertivas:**
  - [ ] Cache limpo
  - [ ] Dados recarregados

### TC-CONF-002: Limpar Conta
- **Prioridade:** 🔴 Crítico
- **Fluxo:**
  1. Acessar `/configuracoes`
  2. Clicar em "Limpar Conta"
  3. Confirmar no Dialog
- **Assertivas:**
  - [ ] Todos os dados removidos
  - [ ] Tipo "Transferência" preservado

### TC-CONF-003: Excluir Dono com Contas
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Acessar aba "Donos"
  2. Tentar excluir dono com contas
- **Assertivas:**
  - [ ] Aviso de cascade delete
  - [ ] Contas vinculadas serão excluídas

### TC-CONF-004: Excluir Programa com Contas
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Acessar aba "Programas"
  2. Tentar excluir programa com contas
- **Assertivas:**
  - [ ] Botão desabilitado
  - [ ] Mensagem explicativa

### TC-CONF-005: Excluir Tipo com Entradas
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Acessar aba "Tipo de Operação"
  2. Tentar excluir tipo com entradas
- **Assertivas:**
  - [ ] Botão desabilitado
  - [ ] Mensagem explicativa

---

## 🔄 Fluxos Transversais

### TC-TRANS-001: Navegação por Atalhos
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Login
  2. Pressionar cada atalho (G, E, V, C, P, S, R)
- **Assertivas:**
  - [ ] Cada atalho navega para a página correta

### TC-TRANS-002: Ajuda de Atalhos
- **Prioridade:** 🟢 Médio
- **Fluxo:**
  1. Pressionar `?`
- **Assertivas:**
  - [ ] Modal de ajuda abre
  - [ ] Lista completa de atalhos

### TC-TRANS-003: Alternar Tema
- **Prioridade:** 🟢 Médio
- **Fluxo:**
  1. Clicar no ThemeToggle
- **Assertivas:**
  - [ ] Tema alterna (claro/escuro)
  - [ ] Preferência persiste

### TC-TRANS-004: Alternar Idioma
- **Prioridade:** 🟢 Médio
- **Fluxo:**
  1. Clicar na bandeira no header
- **Assertivas:**
  - [ ] Idioma alterna (pt-BR/en-US)
  - [ ] Textos traduzidos

### TC-TRANS-005: Toast Notifications
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Realizar operação bem-sucedida
  2. Realizar operação com erro
- **Assertivas:**
  - [ ] Toast.success aparece
  - [ ] Toast.error aparece

### TC-TRANS-006: Error Boundary
- **Prioridade:** 🟡 Alto
- **Fluxo:**
  1. Forçar erro de render (difficult in E2E)
- **Assertivas:**
  - [ ] Mensagem amigável aparece
  - [ ] Botão "Tentar Novamente"

### TC-TRANS-007: Responsividade Mobile
- **Prioridade:** 🟡 Alto
- **Arquivo:** `tests/responsivo.spec.ts` (existente)
- **Fluxo:**
  1. Testar em viewport mobile (< 640px)
- **Assertivas:**
  - [ ] BottomTabBar visível
  - [ ] Layout 1 coluna
  - [ ] Sem overflow horizontal

---

## 📋 Implementação

### Arquivos de Teste a Criar

| Arquivo | Cenários | Prioridade |
|---------|----------|------------|
| `tests/auth.spec.ts` | TC-AUTH-001 a 005 | 🔴 |
| `tests/configuracoes.spec.ts` | TC-CONF-001 a 005 | 🔴🟡 |
| `tests/vendas.spec.ts` | TC-VEND-001 a 004 | 🔴🟡 |
| `tests/clientes.spec.ts` | TC-CLI-001 a 002 | 🟡 |
| `tests/transversal.spec.ts` | TC-TRANS-001 a 007 | 🟡🟢 |

### Arquivos de Teste a Atualizar

| Arquivo | Cenários Adicionais |
|---------|---------------------|
| `tests/entradas.spec.ts` | TC-ENT-005 (paginação) |
| `tests/fluxo-completo.spec.ts` | TC-VEND-002 (cancelamento) |

### Ordem de Implementação

1. **Fase 1 (Crítico):**
   - `tests/auth.spec.ts` — Autenticação completa
   - Atualizar `tests/entradas.spec.ts` — Transferência
   - Atualizar `tests/fluxo-completo.spec.ts` — Cancelamento

2. **Fase 2 (Alto):**
   - `tests/configuracoes.spec.ts` — Gerenciamento de dados
   - `tests/vendas.spec.ts` — CRUD de vendas
   - `tests/clientes.spec.ts` — CRUD de clientes

3. **Fase 3 (Médio):**
   - `tests/transversal.spec.ts` — Atalhos, tema, idioma

---

## 📊 Métricas de Cobertura

| Categoria | Fluxos | Testes | Cobertura |
|-----------|--------|--------|-----------|
| Autenticação | 3 | 5 | 100% |
| Dashboard | 2 | 2 | 100% |
| Entradas | 5 | 5 | 100% |
| Vendas | 4 | 4 | 100% |
| Contas | 3 | 2 | 67% |
| Clientes | 3 | 2 | 67% |
| Configurações | 4 | 5 | 125% |
| Transversais | 7 | 7 | 100% |
| **Total** | **31** | **32** | **103%** |

---

**Próximo passo:** Implementar Fase 1 (testes críticos)
