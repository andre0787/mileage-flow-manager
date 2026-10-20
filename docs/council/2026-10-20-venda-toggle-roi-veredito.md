# Council Veredito — Toggle de ROI na venda (2026-10-20)

## Pergunta

Incluir um controle na inserção/edição de venda para considerar ou não a
venda no cálculo do ROI do dono em `Relatorios.tsx`.

## Modelos consultados (veredito consolidado pelo agente da sessão, política
ativa do repo — manifesto autoritativo, quórum portátil dispensado)

- **Desenho A (escolhido):** coluna booleana `include_in_roi` default `true`
  na tabela `sales`; flag é opt-out; ROI do owner = `sumRoiEligibleProfit` /
  total investido. Linhas antigas permanecem no ROI sem migração de dados.
- **Desenho B (rejeitado):** calcular ROI a partir de `amount_received`/status
  — mudaria semântica do que o dono pediu e quebraria comparabilidade com
  relatórios antigos.
- **Desenho C (rejeitado):** categoria/tag de venda ("venda interna") —
  escopo maior (taxonomia nova) para uma necessidade binária.

## Decisão

- **Numerator do ROI** exclui vendas com `includeInRoi === false`;
  **denominador** (investido das entradas) permanece intacto — o custo do
  estoque comprado continua real, quem decide entrar no lucro do ROI é a
  venda.
- Flag NÃO afeta: receita, lucro, margem, extrato, CSV, tabela de vendas,
  simulador (efêmero, sem persistência — fora de escopo).
- UI: `Switch` (shadcn, já no design system) ao lado de "Data da venda" em
  `SaleFormCommonFields` — aparece em criação E edição, rótulo
  "Considerar no ROI" com helper text pt-BR.
- Migration nova (imutável: nunca editar as existentes):
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS include_in_roi boolean NOT NULL
  DEFAULT true` — sem RLS novo (coluna em tabela existente; políticas por
  `auth.uid()` já cobrem a tabela).

## Confiança

Alta. Reversível: default `true` preserva todos os números atuais até o dono
marcar vendas específicas.
