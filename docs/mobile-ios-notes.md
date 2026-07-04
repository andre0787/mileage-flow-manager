# Notas — mobile iPhone

## Já ajustado
- viewport com `maximum-scale=1.0` e `viewport-fit=cover`
- safe areas (top/bottom/left/right) — utilitários `safe-area-*` no CSS
- `-webkit-text-size-adjust: 100%`
- botões e selects com alvo de toque melhor (`min-h-[44px]`, `touch-manipulation`)
- headers principais empilhando no mobile
- tabs com scroll horizontal quando necessário
- hero do dashboard menor em telas muito pequenas
- **Safe area no DrawerContent** — `pb-[env(safe-area-inset-bottom)]`
- **Safe area no DialogContent** — `max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))]`
- **Safe area no FormDrawer** — usa `pb-safe`
- **Sticky hover no Safari** — `ontouchstart=""` no `<body>` evita hover persistente
- **Scroll margin em inputs** — `scroll-margin-bottom: 40dvh` para não ficar atrás do teclado
- **Overflow-x-auto em tabelas** — ControleCPF, Relatorios, Clientes, Entradas, Vendas
- **Grid responsivo em formulários** — Vendas: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`, `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`
- **Overflow de texto em cards** — `truncate` em nomes de cliente no card mobile
- **Selects com `w-full` em mobile** — ControleCPF: `w-48` → `w-full sm:w-48`

## Finalizado

### Alinhamento com Entradas (página de referência)
- ✅ Fontes: `text-[10px]` e `text-[11px]` removidos em todo o app → `text-xs`
- ✅ `font-mono` removido de valores métricos (mantido apenas para CPF, cores hex, códigos)
- ✅ Sem `tracking-[0.2em]` ou classes arbitrárias de font/tracking
- ✅ Headers: `flex-col sm:flex-row` em todas as páginas
- ✅ Títulos: `text-2xl sm:text-3xl font-bold` em todas as páginas
- ✅ Cards summary: label `text-sm font-medium text-muted-foreground`, valor `text-2xl font-bold`
- ✅ Tabelas com `overflow-x-auto` e `max-sm:text-sm`
- ✅ Cards mobile com `md:hidden space-y-3 mt-4`
- ✅ Touch targets: `min-h-[44px] min-w-[44px]` em todos botões de ação
- ✅ `overflow-x: hidden` no body
- ✅ BottomTabBar: `text-xs` com `truncate`
- ✅ Dashboard hero responsivo (Milhas + Pontos): decorações escondidas no mobile, padding reduzido, labels visíveis
- ✅ Safe areas: DrawerContent, DialogContent, FormDrawer
- ✅ Sticky hover Safari: `ontouchstart=""` no `<body>`
- ✅ Scroll margin inputs: `scroll-margin-bottom: 40dvh`
- ✅ Selects `w-full sm:w-48` em ControleCPF
- ✅ Build: sem erros, zero `text-[10px]`/`text-[11px]` no `src/`

## Para revisar depois no iPhone real
- status do teclado em formulários longos (Drawer/Sheet)
- qualquer corte em textos muito longos de cards restantes
- scroll suave das tabelas com overflow-x
