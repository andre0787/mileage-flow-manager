# Redesign Visual — Plano de Execução

## Objetivo
Implementar as 5 mudanças aprovadas no design review:
1. Tipografia: Instrument Serif nos números grandes
2. Altímetro animado no hero do Dashboard
3. FlowMap como fluxo visual (não grid)
4. Aba Pontos com identidade teal
5. Gráficos com cores do tema (CSS vars)

## Fases

### Phase 1: Fundação Tipográfica
- Adicionar Instrument Serif no `index.html`
- Adicionar `font-display-alt` no `tailwind.config.ts`
- Classe utilitária para números grandes no `index.css`
- Status: complete

### Phase 2: Altímetro no Hero
- Componente `AltitudeBar` com barra animada e meta
- Substituir número estático no hero Milhas
- Meta de milhas configurável (padrão 500K)
- Status: complete

### Phase 3: FlowMap como Fluxo Visual
- `FlowMap.tsx` com layout de fluxo (setas entre nodes) — já era fluxo da refatoração anterior
- Gradiente animado nas conexões — já existente
- Status: complete (já estava implementado)

### Phase 4: Aba Pontos com Identidade Teal
- Hero Pontos com fundo `bg-gradient-hero-teal`
- Mini-métricas em teal
- Gradiente hero teal→gold
- Status: complete

### Phase 5: Gráficos com Cores do Tema
- `DashboardCharts.tsx`: COLORS lê CSS vars do tema
- Cores do pie chart usam primary/gold/teal/success do tema
- Status: complete

## Decisões
| ID | Decisão | Data |
|----|---------|------|
| D1 | Font: Instrument Serif (italico 300-400) para números, Plus Jakarta Sans para labels | - |
| D2 | Meta do altímetro: `MAX_MILES_GOAL = 500000` no hero, editável depois | - |
| D3 | Teal da aba Pontos: fundo `hsl(170 35% 8%)`, accent `hsl(170 65% 42%)` | - |
| D4 | COLORS no gráfico: lookup CSS vars via `getComputedStyle` ou classes Tailwind | - |

## Erros
| Phase | Erro | Tentativa | Resolução |
|-------|------|-----------|-----------|
| - | - | - | - |
