# 🤖 Workflow Obrigatório — council-to-superpowers

**Toda feature ou modificação neste projeto DEVE passar por este workflow.**

## Skills Envolvidas

| Skill | Localização | Função |
|-------|-------------|--------|
| `council-to-superpowers` | `.opencode/skills/`, `.pi/skills/` | Workflow combinado (única skill visível) |
| `llm-council` | `~/.config/opencode/skills/` | Conselho de 5 advisors (escondido, usado internamente) |
| `superpowers` (14 skills) | Pacote pi | Execução disciplinada (escondidas, lidas manualmente) |
| `caveman` | `~/.config/opencode/skills/` | Modo compacto de tokens |

## Fluxo Completo

### Fase 1 — LLM Council (Decisão)

5 advisors analisam a solicitação de ângulos diferentes:

1. **The Contrarian** — busca o que vai falhar
2. **First Principles Thinker** — questiona premissas
3. **The Expansionist** — enxerga oportunidades
4. **The Outsider** — olho fresco, sem viés de domínio
5. **The Executor** — foca no "como fazer"

Cada advisor produz análise independente → peer review anônimo → chairman sintetiza.

**Possíveis vereditos:**
- "Faça" → prossegue para Fase 2
- "Não faça" → apresenta justificativa e encerra
- "Reformule" → sugere ajustes antes de prosseguir

### Fase 2 — Superpowers (Execução)

1. **brainstorming** — explora requisitos, propõe 2-3 abordagens, salva spec em `docs/superpowers/specs/`
2. **writing-plans** — quebra em tarefas de 2-5min, salva em `docs/superpowers/plans/`
3. **using-git-worktrees** — branch isolada com setup
4. **test-driven-development** — RED → GREEN → REFACTOR
5. **subagent-driven-development** — subagent por tarefa com dois estágios de review
6. **requesting-code-review** — entre tarefas, bloqueia se critical
7. **finishing-a-development-branch** — testes verdes, merge/PR

## Gatilhos

A skill `council-to-superpowers` dispara automaticamente em:
- "council this", "war room this", "debate this", "pressure-test this"
- "council then build", "decide and execute", "full workflow"
- "should I X or Y", "which option", "validate this"
- **Qualquer menção a adicionar, modificar, criar, refatorar ou construir algo**

## Exceção

Features triviais podem usar Superpowers direto sem council ("let's build X" → brainstorming). O council decide se pula ou não a fase 2.

## Outputs

| Fase | Artefato | Localização |
|------|----------|-------------|
| Council | Veredito | `docs/council/<data>-<topico>-veredito.md` |
| Brainstorm | Spec | `docs/superpowers/specs/` |
| Planning | Plano | `docs/superpowers/plans/` |
| Execução | Código + testes | `src/` + `tests/` |
