# MilesControl - Redesign Visual

## Objetivo
Redesign completo da interface do MilesControl, sistema de gestão de milhas aéreas, com foco em aparência premium, dark mode, gráficos interativos e micro-animações.

## Escopo
- Refinamento da paleta de cores e design system
- Implementação completa de dark mode
- Adição de gráficos Recharts no Dashboard
- Animações consistentes em todo o sistema
- Refinamento visual de todas as páginas existentes
- Responsividade aprimorada

## Paleta de Cores

### Light Mode (Ajustes)
```css
--background: 210 40% 98%;
--foreground: 222 47% 11%;
--card: 0 0% 100%;
--primary: 221 83% 53%;
--primary-foreground: 0 0% 100%;
--primary-light: 221 83% 65%;
--primary-dark: 221 83% 40%;
--secondary: 210 40% 96%;
--success: 142 76% 36%;
--success-light: 142 52% 96%;
--warning: 38 92% 50%;
--warning-light: 54 91% 95%;
--destructive: 0 84% 60%;
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;
--border: 214 32% 91%;
```

### Dark Mode (Ajustes)
```css
--background: 222 47% 6%;
--foreground: 210 40% 98%;
--card: 222 47% 10%;
--primary: 217 91% 60%;
--muted: 217 33% 17%;
--border: 217 33% 22%;
```

### Gradientes
- `--gradient-primary`: azul → azul claro (mantido)
- `--gradient-success`: verde → verde claro (mantido)
- `--gradient-card`: sutil fundo de card (novo)

## Dark Mode

### Implementação
- Provider: `ThemeProvider` do `next-themes` (já instalado)
- Toggle: ícone Sun/Moon no rodapé da sidebar
- Transição: `transition-colors duration-300` no body
- Persistência: localStorage via next-themes

### Componentes afetados
- Todos os cards, tabelas, formulários, diálogos, sidebar
- Gráficos Recharts (chart.tsx já suporta tema)
- Badges e alertas

## Dashboard com Gráficos

### Estrutura
1. **Linha superior**: 4 MetricCards com sparklines (tendência)
2. **Linha de gráficos** (2 colunas):
   - Esquerda: Gráfico de pizza (milhas por programa)
   - Direita: Gráfico de barras (vendas mensais)
3. **Linha inferior**: Cards existentes (Estoque por Dono, Vendas Recentes)

### Sparklines
- Mini gráficos de linha dentro dos MetricCards
- Cor primária para positivo, destrutiva para negativo
- Recharts `AreaChart` simplificado

## Animações

### Existentes (manter)
- `fade-in`: opacidade + translateY (páginas)
- `scale-in`: escala + opacidade (modais)

### Novas
- `slide-up`: para diálogos e sheets (translateY de 20px para 0)
- `hover-lift`: cards sobem 2px com shadow maior
- `pulse-soft`: badges pulsando suavemente
- `page-transition`: fade-in + slide entre rotas

### Implementação
- CSS keyframes no tailwind.config.ts
- Classes utilitárias (animate-fade-in, animate-slide-up, hover:animate-hover-lift)

## Refinamento por Página

### Dashboard
- Remover "Contas Ativas" duplicado
- Adicionar gráficos Recharts com dados mock
- Sparklines nos MetricCards

### Contas
- Card header com gradiente sutil
- Badge de programa com ícone
- Progress bar de utilização de milhas

### Clientes
- Avatar com iniciais do cliente
- Badges de uso frequente com cores
- Indicador de último contato

### Entradas
- Preview de cálculos em tempo real com destaque visual
- Badge de tipo de entrada com cor específica
- Destaque visual para custo/milha baixo

### Vendas
- Timeline visual de status (bolinhas conectadas)
- Cards de lucro/prejuízo com cor
- Badge de passageiros

### Controle CPF
- Gradiente de alerta nos cards (verde → amarelo → vermelho)
- Progress bars animados
- Indicador "Frequente" com destaque

### Relatórios
- Gráfico de performance por programa
- Cards de insight com ícones e cores temáticas
- Indicadores visuais de tendência (setas)

## Responsividade

### Breakpoints
- `< 640px` (mobile): 1 coluna, sidebar oculta, tabelas scroll
- `640-1024px` (tablet): 2 colunas, sidebar icone
- `> 1024px` (desktop): 3-4 colunas, sidebar expandida

### Tabelas
- Scroll horizontal em mobile
- Colunas essenciais visíveis, demais colapsáveis

## Cronograma Sugerido
1. Design system (cores + dark mode + animações)
2. Dashboard com gráficos
3. Refinamento página a página
4. Responsividade e ajustes finais

## Não Escopo (para versões futuras)
- Testes automatizados
- Backend e persistência
- Funcionalidades novas (apenas refinamento visual)
