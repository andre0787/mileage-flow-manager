# Design — Estabilidade de formulários no iPhone

Data: 2026-07-16
Status: aprovado

## Objetivo

Impedir que formulários em iPhone “subam demais”, sumam ou fiquem instáveis durante digitação, especialmente ao preencher campos numéricos em entradas/vendas.

## Causa provável

O app combina, no mobile:

- `FormDrawer` baseado em Vaul/bottom sheet com `position: fixed` no rodapé.
- Alturas em `dvh`, que mudam quando o teclado do iOS abre.
- Scroll externo do drawer e scroll interno em cada formulário.
- `scroll-margin-bottom: 40dvh` global em campos, empurrando o foco agressivamente.

Essa mistura deixa o Safari decidir entre mover viewport, mover elemento fixo e rolar containers aninhados.

## Abordagem escolhida

Corrigir no ponto único, sem migração de stack:

1. `FormDrawer` mobile vira um painel estável quase full-screen.
2. O drawer de formulário não escala background e não depende de arrasto para ser utilizável.
3. O wrapper do drawer passa a ser o único scroll container vertical.
4. Remover scroll interno redundante dos formulários usados dentro de `FormDrawer`.
5. Reduzir o `scroll-margin-bottom` global para um valor fixo seguro.

## Arquivos previstos

- `src/components/FormDrawer.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/EntryForm.tsx`
- `src/components/SaleForm.tsx`
- `src/components/TransferForm.tsx`
- `src/index.css`
- teste Playwright mobile, preferencialmente em `tests/responsivo.spec.ts` ou arquivo novo focado.

## Critérios de aceite

- Abrir formulário no viewport iPhone SE/iPhone 16 mantém o painel visível.
- Focar campo baixo do formulário não faz o dialog/drawer desaparecer.
- Existe apenas um scroll principal no conteúdo do formulário mobile.
- Desktop mantém comportamento atual de dialog.
- Sem nova dependência e sem troca de frontend.

## Fora de escopo

- Reescrever formulários.
- Migrar para Next/React Native/Ionic.
- Criar detecção customizada de teclado via `visualViewport`, salvo se a correção CSS/layout falhar.
