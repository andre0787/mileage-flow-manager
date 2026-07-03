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

## Para revisar depois no iPhone real
- status do teclado em formulários longos (Drawer/Sheet)
- qualquer corte em textos muito longos de cards restantes
- possíveis `text-xs`/`text-[10px]` que ainda fiquem apertados
- comportamento das novas safe areas nos dialogs/drawers
- scroll suave das tabelas com overflow-x
