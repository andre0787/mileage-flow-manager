# 📜 RULES.md — Índice de Regras do Workflow

> Índice canônico de **todas as regras** do projeto. 1 linha por regra.
> Fonte das regras numeradas: `AGENTS.md` (regras essenciais 1–8 e gates 26–39)
> e `docs/CONVENTIONS.md` (regras de código/processo 2–25).
> `rule-13-validations.mjs` exige que toda regra definida no AGENTS.md tenha
> entrada aqui (valida a primeira coluna da tabela).

| #      | Regra                                             | Script de validação                                     | Status                   |
| ------ | ------------------------------------------------- | ------------------------------------------------------- | ------------------------ |
| 1      | NUNCA direto na main (branch obrigatória)         | hook pre-commit (`rule-04-branch` cobre branch != main) | não-automatizável (hook) |
| 2      | pre-pr + relatório HTML obrigatório               | `rule-08-report.mjs`                                    | automática               |
| 3      | git status ZERO antes de PR/merge                 | `rule-10-clean.mjs`                                     | automática               |
| 4      | Toda regra imutável TEM script de validação       | `rule-13-validations.mjs`                               | automática               |
| 5      | Sem arquivos órfãos em `src/`                     | `rule-14-orphan-files.mjs`                              | automática               |
| 6      | Sem duplicatas > 75% em componentes               | `rule-15-duplicate-code.mjs`                            | automática               |
| 7      | Todo script em `scripts/` tem atalho npm          | `rule-16-orphan-scripts.mjs`                            | automática               |
| 8      | Skills do workflow e subagentes existem           | `rule-23-skill-orphans.mjs`                             | automática               |
| 9      | `docs/handoff.md` existe e tem conteúdo           | `rule-09-handoff.mjs`                                   | automática               |
| 10     | Git status limpo (working tree)                   | `rule-10-clean.mjs`                                     | automática               |
| 11     | Bugs registrados em AGENDA.md                     | `rule-11-bug-registry.mjs`                              | automática               |
| 12     | Ideias externas (IDEIAS.md)                       | —                                                       | não-automatizável        |
| 13     | Toda regra tem validação automática               | `rule-13-validations.mjs`                               | automática               |
| 14     | Sem arquivos órfãos em `src/`                     | `rule-14-orphan-files.mjs`                              | automática               |
| 15     | Sem duplicatas > 75%                              | `rule-15-duplicate-code.mjs`                            | automática               |
| 16     | Scripts têm atalho npm                            | `rule-16-orphan-scripts.mjs`                            | automática               |
| 17     | Novos `.md` válidos (órfãos/links/MAP)            | `rule-17-new-docs-valid.mjs`                            | automática               |
| 17     | Relatório com prefixo `PR<num>` quando há PR      | `rule-17-report-prefix.mjs`                             | automática               |
| 18     | Sem duplicação de arquivos raiz/docs              | `rule-18-no-duplicate-root-docs.mjs`                    | automática               |
| 19     | Estoque consistente (AST)                         | `rule-19-stock-validation.mjs`                          | automática               |
| 20     | AGENDA.md não é carregado em sessões normais      | `rule-20-no-agenda-load.mjs`                            | automática               |
| 21     | Feedback de usuários revisado                     | `rule-21-feedback-review.mjs`                           | automática               |
| 22     | Nomenclatura de PR                                | `rule-22-pr-naming.mjs`                                 | automática               |
| 23     | Skills referenciadas existem                      | `rule-23-skill-orphans.mjs`                             | automática               |
| 24     | Testes E2E usam dados reais                       | `rule-24-real-tests.mjs`                                | automática               |
| 25     | Testes contra produção                            | `rule-25-production-tests.mjs`                          | automática               |
| 26     | `npm run session:start` obrigatório               | `rule-26-session-started.mjs`                           | automática               |
| 27     | Council obrigatório no workflow feature           | `rule-27-council-veredict.mjs`                          | automática               |
| 28     | Spec técnica obrigatória no workflow refactor     | `rule-28-spec-exists.mjs`                               | automática               |
| 29     | Prompt versioning (hash no manifesto)             | `rule-29-prompt-version.mjs`                            | automática               |
| 30     | Outcome grade ≥ 80%                               | `rule-30-outcome-grade.mjs`                             | automática               |
| 31     | Toda lib em `src/lib/` tem test unitário          | `rule-31-lib-test-coverage.mjs`                         | automática               |
| 32     | Todo componente customizado tem teste             | `rule-32-component-test-coverage.mjs`                   | automática               |
| 33     | INTENT Gate                                       | `rule-33-intent-gate.mjs`                               | automática               |
| 34     | TWINS Check                                       | `rule-34-twins-check.mjs`                               | automática               |
| 35     | AUTH Gate                                         | `rule-35-auth-gate.mjs`                                 | automática               |
| 36     | Evidência de processo válida                      | `rule-36-process-evidence.mjs`                          | automática               |
| 37     | Integração RTK ativa                              | `rule-37-rtk.mjs`                                       | automática               |
| 38     | Code Review Gate (subagente)                      | `rule-38-code-review-gate.mjs`                          | automática               |
| 39     | Coding Gate (subagente)                           | `rule-39-coding-gate.mjs`                               | automática               |
| 40     | Estrutura Feature-First (barrel + RLS)            | `rule-40-architect.mjs`                                 | automática               |
| 41     | Hard limit 150 linhas (diff-scoped)               | `rule-41-optimizer.mjs`                                 | automática               |
| 42     | Cobertura de testes ≥ 75% de linhas (gate)        | `rule-42-coverage-gate.mjs`                             | automática               |
| escopo | Diff dentro de `arquivosPermitidos` do card ativo | `rule-scope.mjs`                                        | automática               |
