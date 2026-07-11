# 🗺️ Mapa do Projeto — MilesControl

> Leia este arquivo primeiro. Ele orienta qual doc ler para cada situação.

## Docs de Código

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` | Setup inicial, comandos, dependências | Stack, npm scripts, env vars |
| `ARCHITECTURE.md` | Antes de criar/modificar arquivos | Estrutura de pastas, fluxo de dados, roteamento |
| `CONVENTIONS.md` | Antes de escrever código | Padrões de código, nomenclatura, DRY, imports |
| `UI-GUIDE.md` | Antes de criar/modificar UI | Design system, grid, cores, tipografia, componentes |

## Docs de Processo

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `WORKFLOW.md` | Antes de iniciar qualquer feature | Workflow council-to-superpowers + LLM Council |
| `AGENDA.md` | Início de toda sessão | Sprint atual, tarefas em andamento, próximas, backlog |
| `GIT-WORKFLOW.md` | Antes de commitar/criar PR | Branches, commits, PR, deploy |
| `TESTING.md` | Antes de rodar testes | Playwright, bateria obrigatória, helpers |
| `TEST-PLAN.md` | Planejamento de testes | 32 casos organizados em 3 fases, prioridades |
| `MAPA-EXPERIENCIAS-USUARIO.md` | Contexto UX | 43 fluxos de usuário, 85+ cenários de teste, edge cases |

## Docs do Ecossistema

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` (seção Agente) | Quando precisar de ferramentas do agente | pi, opencode, MCPs, plugins, skills |
| `MEMORY.md` | Contexto de sessões anteriores | Histórico de decisões, sprints, post-mortems |
| `docs/IDEIAS.md` | Caixa de entrada de ideias | Ideias humanas pendentes, lidas no início da sessão |
| `docs/council/` | Vereditos de decisões | Recomendações do LLM Council (feature planning) |

## Docs Arquivados

Artefatos de sprints/features concluídos foram movidos para `docs/archive/`:

| Diretório | Conteúdo |
|-----------|----------|
| `docs/archive/specs/` | 19 specs de features já implementadas |
| `docs/archive/plans/` | 9 planos de features já implementadas |
| `docs/archive/council/` | 10 vereditos de decisões concluídas |
| `docs/archive/` raiz | 5 artefatos obsoletos (SPRINT5-QUICKSTART, mobile-ios-notes, progress.md, task_plan.md, AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md) |

## Regra de Ouro

**Sempre leia `AGENDA.md` + `WORKFLOW.md` + `ARCHITECTURE.md` + `CONVENTIONS.md` antes de começar qualquer tarefa.**
