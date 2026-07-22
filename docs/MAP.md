# 🗺️ Mapa do Projeto — MilesControl

> Leia este arquivo primeiro. Ele orienta qual doc ler para cada situação.

## Docs de Código

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` | Setup inicial, comandos, dependências | Stack, npm scripts, env vars |
| `ARCHITECTURE.md` | Antes de criar/modificar arquivos | Estrutura de pastas, fluxo de dados, roteamento |
| `CONVENTIONS.md` | Antes de escrever código | Padrões de código, nomenclatura, DRY, imports |
| `UI-GUIDE.md` | Antes de criar/modificar UI | Design system, grid, cores, tipografia, componentes |
| `DEBUG.md` | Quando precisar debugar | Logger, breakpoints, launch.json, console.log rules |

## Docs de Processo

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `WORKFLOW-MANIFEST.md` | **Sempre primeiro** | Fonte canônica: categorias, estados, comandos obrigatórios, alvo de PR, política de bypass |
| `WORKFLOW.md` | Antes de iniciar qualquer feature | Workflow council-to-superpowers + LLM Council + **navegação Serena-First** (detalhamento do manifesto) |
| `AGENDA.md` | Obsoleto/arquivado | Stub que aponta para `docs/archive/AGENDA-2026.md`; use `docs/tasks/ROADMAP.md` e GitHub Issues |
| `GIT-WORKFLOW.md` | Antes de commitar/criar PR | Branches, commits, PR, deploy |
| `TESTING.md` | Antes de rodar testes | Playwright, bateria obrigatória, helpers |
| `TEST-PLAN.md` | Planejamento de testes | 32 casos organizados em 3 fases, prioridades |
| `MAPA-EXPERIENCIAS-USUARIO.md` | Contexto UX | 43 fluxos de usuário, 85+ cenários de teste, edge cases |
| `docs/handoff.md` | Início/fim de sessão | Contexto entre sessões, branch atual, PRs, próximos passos |
| `docs/CI-PROCESS.md` | Melhoria contínua | Ciclo de melhoria: coletar → priorizar → executar → revisar → retrospectiva |

## Docs de Roadmap / Task-cards

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| [`docs/tasks/ROADMAP.md`](tasks/ROADMAP.md) | Antes de planejar trabalho de workflow/agente | Índice em 4 ondas (P0/P1/P2/P3) de 25 task-cards |
| `docs/tasks/_TEMPLATE.md` | Ao criar novo task-card | Estrutura canônica do card (objetivo, arquivos permitidos, critérios de aceite, testes, evidência) |

> **Coleção de task-cards** (`docs/tasks/`): 25 cards granulares em 4 ondas (P0/P1/P2/P3).
> O índice navegável está em `docs/tasks/ROADMAP.md`. Cards P3 de housekeeping:
> `P3-23-delete-archive-debris.md`, `P3-24-retire-changelog.md`, `P3-25-clean-thoughts.md`.

## Docs do Ecossistema

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` (seção Agente) | Quando precisar de ferramentas do agente | pi, opencode, MCPs, plugins, skills, subagentes |
| `docs/memory.md` | Contexto de sessões anteriores | Histórico de decisões, sprints, post-mortems |
| `docs/IDEIAS.md` | Caixa de entrada de ideias | Ideias humanas pendentes, lidas no início da sessão |
| `docs/FLUXO.md` | Diagramas do ecossistema | Flowcharts Mermaid: visão geral, fluxo de dados, rotas |
| `docs/council/` | Vereditos de decisões | Recomendações do LLM Council (feature planning). Atuais: `2026-07-16-ios-form-stability-veredito.md`, `2026-07-16-auto-refresh-after-mutations-veredito.md`, `2026-07-16-recorrencia-automatica-veredito.md`, `2026-07-19-p0-5-workflow-hardening-veredito.md` |
| `docs/superpowers/specs/` | Especificações técnicas | Specs de features avaliadas pelo council. Atual: `2026-07-16-ios-form-stability-design.md` |
| `docs/superpowers/plans/` | Planos de execução | Planos detalhados de implementação. Atual: `2026-07-16-ios-form-stability.md` |
| `docs/reports/` | Relatórios HTML | Relatórios obrigatórios antes de cada PR |
| `.githooks/` | Git hooks | Pre-commit que bloqueia commits na main |
| `.pi/skills/subagent-driven-development/SKILL.md` | Execução delegada com subagentes | Plano → subagente por tarefa → task review → final review |
| `.pi/skills/dispatching-parallel-agents/SKILL.md` | Investigação paralela | 1 subagente por domínio de problema independente |
| `.pi/skills/using-git-worktrees/SKILL.md` | Worktrees isolados | Branches separadas para trabalho concorrente sem conflito |
| `scripts/check-feedback.mjs` | Verificação de feedback | Consulta feedbacks de usuários no Supabase |
| `scripts/check-deploy.mjs` | Saúde do deploy | Verifica status do último deploy via GitHub API |
| `scripts/retro.mjs` | Retrospectiva | Gera relatório de retrospectiva do período |
| `scripts/rules/rule-22-pr-naming.mjs` | Validação de PR | Valida nomenclatura de PRs no pre-pr |
| `CLAUDE.md` | Cross-harness (Claude Code) | Instruções resumidas para Claude Code |
| `QUALITY.md` | Qualidade do código | Métricas e padrões de qualidade |

## Docs Arquivados

Artefatos de sprints/features concluídos foram movidos para `docs/archive/`:

| Diretório | Conteúdo |
|-----------|----------|
| `docs/archive/specs/` | 19 specs de features já implementadas |
| `docs/archive/plans/` | 9 planos de features já implementadas |
| `docs/archive/council/` | 10 vereditos de decisões concluídas |
| `docs/archive/` raiz | 5 artefatos obsoletos (SPRINT5-QUICKSTART, mobile-ios-notes, progress.md, task_plan.md, AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md) |

## Regra de Ouro

**Sempre leia `WORKFLOW-MANIFEST.md` + docs da categoria em `AGENTS.md`; não carregue `AGENDA.md` em sessões normais.**

## Navegação Rápida
- [`WORKFLOW-MANIFEST.md`](WORKFLOW-MANIFEST.md) — **Workflow canônico** (categorias, estados, comandos, alvo de PR, bypass)
