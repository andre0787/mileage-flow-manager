# Spec — Revamp visual das abas de Relatórios (refactor puro)

> Vereditos base: `docs/council/2026-09-06-pipeline-veredito.md` (F1/F2),
> research R4/R5 (tabela scannable + progressive disclosure).
> Categoria: **refactor** — zero mudança de dados ou comportamento.

## Objetivo

Unificar a linguagem visual das abas de `src/pages/Relatorios.tsx`
(Pipeline → Cobrança → Donos → Programas → Insights): mesma ordem do fluxo
operacional, mesmos headers de seção, mesmos empty/loading states.

## Fora de escopo

- Qualquer mudança em cálculos, filtros, queries, CSVs ou totais.
- Troca da aba padrão (`defaultValue="cobranca"` permanece — trocar seria
  mudança de comportamento).
- Donos/Programas continuam com tabela desktop + cards mobile.

## Mudanças

1. **Ordem das abas**: Pipeline primeiro, depois Cobrança, Donos, Programas,
   Insights. Implementado reordenando só os `TabsTrigger` (conteúdos são
   chaveados por `value` — DOM inalterado = zero risco). Ordem canônica vive
   em `REPORT_TABS` (`src/components/reports/ReportChrome.tsx`) e os triggers
   são renderizados por map dessa constante (fonte única).
2. **Novo `src/components/reports/ReportChrome.tsx`** (≤ 60 linhas):
   `SectionTitle` (h3 com `border-l-4 border-primary pl-3` + ícone — DOM/classes
   idênticos aos atuais) e `ReportEmpty` (mensagem centralizada `py-8` —
   classes idênticas às atuais).
3. **Donos/Programas**: headers passam a `SectionTitle`; empty mobile usa
   `ReportEmpty` (mesmo texto); tabela desktop ganha `ReportEmpty` quando
   vazia (antes: tabela em branco — único delta visual, exigido pela
   consistência de empties).
4. **Insights**: título passa a `SectionTitle` com `Lightbulb`.
5. **PipelineTab**: ganha `SectionTitle` "Pipeline operacional" (`Workflow`).
6. **CollectionSection**: empty passa a `ReportEmpty` (mesmo texto/classes).

## Critérios de aceite

1. Triggers na ordem Pipeline, Cobrança, Donos, Programas, Insights.
2. Todos os headers de seção com mesmo DOM/classes; todos os empties iguais.
3. `tsc --noEmit` EXIT 0; prettier limpo nos tocados; testes existentes verdes.
4. Arquivos novos ≤ 150 linhas; sem duplicação (rule-15); `Relatorios.tsx`
   segue grandfathered (rule-41 warning, sem bloqueio).

## Riscos residuais

- Nenhum risco funcional (refactor visual, dados intactos).
