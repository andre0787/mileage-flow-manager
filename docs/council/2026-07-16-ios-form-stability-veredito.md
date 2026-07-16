# Council — Estabilidade de formulários no iPhone

Data: 2026-07-16
Tópico: impedir que formulários saiam do controle ao preencher campos no iPhone.

## Contexto observado

- Formulários mobile usam `FormDrawer` → `vaul` (`Drawer`) com `position: fixed` no rodapé.
- O conteúdo do drawer tem scroll próprio e os formulários também criam outro scroll interno (`max-h-[70dvh] overflow-y-auto`).
- CSS global aplica `scroll-margin-bottom: 40dvh` em inputs/selects/textareas/buttons.
- iOS Safari recalcula o viewport visual quando o teclado abre; `fixed + bottom + dvh + nested scroll` costuma gerar salto/arrasto excessivo.

## Advisors

### Contrarian
Trocar a tecnologia do frontend é desproporcional. O bug está em uma camada de layout mobile, não no React/Vite. Migrar criaria risco alto e não garantiria resolver o comportamento do Safari.

### First Principles
O usuário precisa de previsibilidade: o formulário deve continuar dentro da área visível, com apenas o conteúdo rolando. A solução deve ter um único scroll container e evitar transform/drag de bottom sheet durante digitação.

### Expansionist
A correção pode melhorar todos os formulários: entradas, vendas, clientes e cadastros auxiliares. Aproveitar o ponto único `FormDrawer` evita correções duplicadas.

### Outsider
Bottom sheet é elegante para ações curtas; formulários longos no iPhone funcionam melhor como tela/modal quase full-screen com cabeçalho fixo e área rolável.

### Executor
Corrigir em `FormDrawer`/`ui/drawer` primeiro: desativar escala/drag do Vaul para forms, usar altura estável (`100svh`/`100dvh` com fallback), remover scroll duplo dos filhos e suavizar o `scroll-margin-bottom` global.

## Veredito

**Faça**, sem trocar a stack.

Recomendação mínima:
1. Criar modo mobile estável no `FormDrawer` para formulários: drawer quase full-screen, sem background scale e com um único scroll interno.
2. Remover/neutralizar `max-h + overflow-y-auto` duplicado dos formulários que já ficam dentro do `FormDrawer`.
3. Ajustar `scroll-margin-bottom` global para não empurrar campos 40% da tela no iPhone.
4. Adicionar um teste Playwright mobile simples que abre formulário, foca campo numérico baixo e garante que o dialog continua visível.

Não recomendado agora:
- Migrar frontend.
- Trocar Vaul globalmente por outra lib.
- Criar detecção customizada pesada de teclado/VisualViewport antes de tentar o ajuste CSS/layout.
