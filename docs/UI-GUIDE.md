# 🎨 Guia de UI — MilesControl

> Redesign inspirado nas **Apple Human Interface Guidelines** (skill `apple-design`):
> paleta neutra estilo iOS system grouped, accent system blue, tipografia system
> (SF-like), sombras suaves e cantos arredondados.

## Design System (CSS vars HSL)

Definido em `src/index.css`. Camadas de profundidade (light mode, estilo iOS):

- **Fundo**: `hsl(220 15% 96%)` — systemGroupedBackground (≈ #F2F2F7)
- **Cards**: `hsl(0 0% 100%)` — secondarySystemGroupedBackground (branco)
- **Bordas**: `hsl(220 10% 86%)` — separators suaves

### Cores

| Variável | Valor (light) | Valor (dark) | Uso |
|----------|---------------|--------------|-----|
| `--primary` | `211 100% 45%` | `211 100% 60%` | **System blue** (Apple), cor principal |
| `--gold` | `36 90% 42%` | `36 90% 58%` | Destaques, metas |
| `--teal` | `188 60% 42%` | `188 60% 55%` | Aba Pontos |
| `--success` | `142 65% 36%` | `142 65% 50%` | Verde positivo |
| `--warning` | `32 90% 48%` | `32 90% 58%` | Âmbar |
| `--destructive` | `0 72% 50%` | `0 72% 55%` | Vermelho |

Dark mode: fundo preto puro (`0 0% 0%`), cards `0 0% 11%` (≈ #1C1C1E), como iOS.

### Sombras (iOS-style, suaves)

| Classe | Uso |
|--------|-----|
| `shadow-sm` / `shadow-card` | Cards padrão (1-2px, opacidade baixa) |
| `shadow-md` | Hover de cards |
| `shadow-lg` | Modais |
| `shadow-elegant` | Glow primary sutil |
| `shadow-glow` / `shadow-glow-gold` | Destaques (sem glow exagerado) |

### Gradientes (sóbrios)

| Classe | Onde usar |
|--------|-----------|
| `bg-gradient-primary` | Botões primários (blue vertical) |
| `bg-gradient-gold` | Destaques |
| `bg-gradient-hero` | Hero do Dashboard (tint sutil) |
| `bg-gradient-hero-teal` | Hero da aba Pontos |

> HIG: cor é usada com moderação; acentos são sólidos (MetricCard usa barra
> superior sólida, não gradiente).

## Tipografia (SF-like)

- **Font stack system**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial` — sem Google Fonts (mais rápido, visual nativo)
- **Mono**: `ui-monospace, "SF Mono", Menlo, Monaco, Consolas`
- **Sentence case** nos labels (sem ALLCAPS) — `uppercase` removido
- Títulos usam `tracking-tight` (letter-spacing -0.02em) + `tabular-nums` em números

## Grid Responsivo

### Regra de ouro: máximo 2 colunas

```tsx
{/* ✅ Padrão — 1 col mobile, 2 col desktop */}
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
  <MetricCard /> <MetricCard />
</div>

{/* ❌ Evitar — mais de 2 col */}
<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
```

| Contexto | Grid | Motivo |
|----------|------|--------|
| Mini-métricas (hero) | `grid-cols-2` | Cards compactos |
| MetricCards / Summary | `grid-cols-1 sm:grid-cols-2` | 1 no celular, 2 desktop |
| Content cards | `grid-cols-1 md:grid-cols-2` | Só 2 em desktop+tablet |
| Gráficos | `md:grid-cols-2` | 2 só quando há espaço |

## Componentes

| Componente | Arquivo | Propósito |
|-----------|---------|-----------|
| `Button` | `ui/button.tsx` | **rounded-full** (pill), h-11 (44px touch target), active:scale-[0.97] |
| `Input` | `ui/input.tsx` | **rounded-xl**, fundo `bg-secondary/60` (filled style iOS), h-11 |
| `Card` | `ui/card.tsx` | **rounded-2xl**, borda sutil, hover shadow |
| `MetricCard` | `components/MetricCard.tsx` | Barra sólida no topo (cor da variante) |
| `AltitudeBar` | `components/AltitudeBar.tsx` | Barra sólida primary (ou cor custom) |
| `EmptyState` | `components/EmptyState.tsx` | Estado vazio com CTA |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | 4 variantes de loading |
| `DeleteEntryDialog` | `components/DeleteEntryDialog.tsx` | Confirmação de exclusão |
| `FlowMap` | `components/FlowMap.tsx` | Fluxo visual de 4 nodes |

## Navegação

- **Desktop**: `AppSidebar` — item ativo com `bg-primary/10 text-primary` (pill, sem border-left)
- **Mobile**: `BottomTabBar` — tab bar translúcida (`backdrop-blur-xl`), item ativo em pill `bg-primary/10`

## Animações

- View Transitions API: fade-out 200ms + fade-in 350ms
- **`prefers-reduced-motion: reduce`** desliga TODAS as animações/transições (HIG accessibility)
- MetricCard hover: `hover:-translate-y-0.5 hover:shadow-elegant transition-card`
- Confetti: 40-60 particles, cores [primary, gold, green]
- `animate-drift` / `pulse-glow` / `gradient-shift` só no hero (decorativos)

## Features de UI por Página

- **Dashboard**: abas Milhas/Pontos, hero com AltitudeBar, FlowMap, gráficos, filtro por dono
- **Entradas**: busca + form em drawer
- **Vendas**: busca + filtro de status, simulador em modal
- **Relatorios**: export CSV com BOM UTF-8 (compatível Excel)
- **Mobile**: BottomTabBar, haptic feedback (navigator.vibrate)
