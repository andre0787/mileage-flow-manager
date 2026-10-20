# Veredito do Council — Toggle de ROI na venda (2026-10-20)

Roster: análise direta sobre código (política ativa do repo — manifesto
autoritativo, quórum portátil dispensado) · Branch:
`feat/venda-roi-toggle`

## Pergunta

Incluir um controle na inserção/edição de venda para considerar ou não a
venda no cálculo do ROI do dono em `Relatorios.tsx`.

## Advisors

### Advisor: The Contrarian

Excluir vendas do ROI pode "maquiar" o retorno real se o dono marcar vendas
ruins para inflar o número. Mitigação: o flag é por venda, visível no
formulário, e lucro/margem/receita permanecem completos nos relatórios — a
manipulação fica restrita a uma métrica rotulada, não ao extrato.

### Advisor: First Principles

ROI = lucro gerado / capital investido. A venda é o numerador; o investimento
vem das entradas (denominador). Um opt-out por venda só pode afetar o
numerador. Qualquer desenho que toque o denominador viola a semântica.

### Advisor: The Expansionist

Alternativas consideradas e rejeitadas: Desenho B (ROI a partir de
`amount_received`/status — mudaria a semântica pedida e quebraria
comparabilidade histórica) e Desenho C (categoria/tag de venda tipo "venda
interna — escopo maior, taxonomia nova, para uma necessidade binária).

### Advisor: The Outsider

Um usuário novo assume default "considerar" (ligado). Default `true` preserva
todos os números atuais e toda a base existente; opt-out precisa ser
intencional. Texto de ajuda em pt-BR deixa o efeito explícito.

### Advisor: The Executor

Caminho mais curto com persistência: coluna `include_in_roi boolean NOT NULL
DEFAULT true` (migration aditiva, reversível), `Switch` shadcn em
`SaleFormCommonFields` (aparece em criação E edição), leitura defensiva em
`mapSale` (linhas pré-migration contam), numerador via
`sumRoiEligibleProfit` no agregador por dono de `Relatorios`. Simulador é
efêmero — fora de escopo.

## Peer review anônimo

- Revisão A: desenhos A/B/C avaliados; A vence por ser opt-out reversível.
- Revisão B: sem RLS novo necessário (coluna em tabela existente; políticas
  por `auth.uid()` já cobrem `sales`).
- Revisão C: recomendei helper nomeado (`sumRoiEligibleProfit`) em vez de
  filter inline — testável sem renderizar a página.
- Revisão D: flag não deve afetar receita, lucro, margem, CSV, tabela nem
  simulador; só o numerador do ROI. Confirmado no código.

## Síntese do Chairman

**Desenho A escolhido:** coluna booleana `include_in_roi` default `true` na
tabela `sales`; flag é opt-out; ROI do dono =
`sumRoiEligibleProfit(sales) / totalAmountInvested`.

Decisões:

- **Numerador do ROI** exclui vendas com `includeInRoi === false`;
  **denominador** (investido das entradas) permanece intacto — o custo do
  estoque comprado continua real, quem decide entrar no lucro do ROI é a
  venda.
- Flag NÃO afeta: receita, lucro, margem, extrato, CSV, tabela de vendas,
  simulador (efêmero, sem persistência — fora de escopo).
- UI: `Switch` (shadcn, já no design system) em `SaleFormCommonFields` —
  criação E edição, rótulo "Considerar no ROI" com helper text pt-BR.
- Migration nova (imutável: nunca editar as existentes):
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS include_in_roi boolean NOT NULL
  DEFAULT true`.

Próximos passos: implementar types → mappers → addVenda/update → form →
Relatorios; testes unitários do helper, do insert e do agregador; aplicar
`supabase db push` em produção.

## Confiança

Alta. Reversível: default `true` preserva todos os números atuais até o dono
marcar vendas específicas.
