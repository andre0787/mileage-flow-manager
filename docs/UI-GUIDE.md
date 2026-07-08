# 🎨 Guia de UI — MilesControl

## Design System (CSS vars HSL)

Definido em `index.css`. 3 camadas de profundidade (light mode):
- **Fundo**: `hsl(0 0% 92%)` — nenhum elemento usa `#fff`
- **Cards**: `hsl(0 0% 96%)` — off-white
- **Bordas**: `hsl(0 0% 80%)`

### Cores

| Variável | Valor | Uso |
|----------|-------|-----|
| `--primary` | `222 70% 45%` | Navy, cor principal |
| `--gold` | `38 85% 50%` | Destaques, ouro |
| `--teal` | `170 65% 36%` | Aba Pontos |
| `--success` | `152 60% 33%` | Verde positivo |
| `--warning` | `38 90% 48%` | Âmbar |
| `--destructive` | `0 75% 55%` | Vermelho |

Dark mode: valores ajustados (ex: `--primary: 222 70% 58%`).

### Sombras

| Classe | Uso |
|--------|-----|
| `shadow-sm` | Cards padrão |
| `shadow-md` | Hover de cards |
| `shadow-lg` | Modais |
| `shadow-elegant` | Glow primary |
| `shadow-card` | Padrão cards |

### Gradientes

| Classe | Onde usar |
|--------|-----------|
| `bg-gradient-primary` | Primary → primary-light |
| `bg-gradient-gold` | Gold → gold-light |
| `bg-gradient-hero` | Hero do Dashboard (animado) |
| `bg-gradient-hero-teal` | Hero da aba Pontos |
| `bg-gradient-hero-glow` | Radial glow no hero |

## Tipografia

- **Display**: `Plus Jakarta Sans` (Google Fonts) — usado em todo app, inclusive números do hero
- **Mono**: `JetBrains Mono` (Google Fonts) — código
- Classe `.font-display` para títulos, `.font-body` para texto corrido

## Grid Responsivo

### Regra de ouro: máximo 2 colunas

```tsx
{/* ✅ Padrão — 1 col mobile, 2 col desktop */}
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
  <MetricCard /> <MetricCard />
</div>

{/* ✅ Mini-métricas do hero — sempre 2 col */}
<div className="grid grid-cols-2 gap-2">
  <Box /> <Box />
</div>

{/* ❌ Evitar — mais de 2 col */}
<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
```

### Quando usar cada grid

| Contexto | Grid | Motivo |
|----------|------|--------|
| Mini-métricas (hero) | `grid-cols-2` | Cards compactos |
| MetricCards / Summary | `grid-cols-1 sm:grid-cols-2` | 1 no celular, 2 desktop |
| Content cards | `grid-cols-1 md:grid-cols-2` | Só 2 em desktop+tablet |
| Gráficos | `md:grid-cols-2` | 2 só quando há espaço |

## Componentes Próprios

| Componente | Arquivo | Propósito |
|-----------|---------|-----------|
| `AltitudeBar` | `components/AltitudeBar.tsx` | Barra horizontal animada no hero (meta 500K milhas / 300K pontos, gradiente primary→gold ou teal→gold) |
| `EmptyState` | `components/EmptyState.tsx` | Estado vazio com CTA (icon, title, description, action) |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Captura de erros com "Tentar novamente" |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | 4 variantes: SkeletonPage, SkeletonMetricCard, SkeletonTable, SkeletonHero |
| `DeleteEntryDialog` | `components/DeleteEntryDialog.tsx` | Confirmação de exclusão com cascata |
| `MetricCard` | `components/MetricCard.tsx` | Card com barra gradiente no topo + glass icon, animate sempre true |
| `FlowMap` | `components/FlowMap.tsx` | Fluxo visual de 4 nodes + setas |

## Animações

- View Transitions API: fade-out 200ms + fade-in 350ms (respeita prefers-reduced-motion)
- MetricCard hover: `hover:-translate-y-0.5 hover:shadow-elegant transition-card`
- Confetti: 40-60 particles, spread 60-70, cores [primary, gold, green]
- `animate-ping` no indicador verde
- `animate-appear` + `animate-delay-NNN` para entradas sequenciais

## Features de UI por Página

- **Dashboard**: abas Milhas/Pontos, hero com AltitudeBar, FlowMap, gráficos (PieChart, BarChart), filtro por dono
- **Entradas**: busca por nome da conta/origem/data, form em drawer
- **Vendas**: busca + filtro de status (todos/pendente/pago/concluído/cancelado), simulador de venda em modal
- **Relatorios**: export CSV com BOM UTF-8 (compatível Excel)
- **Mobile**: BottomTabBar, haptic feedback (navigator.vibrate)
