---
name: council-to-superpowers
description: >
  Two-phase workflow: runs LLM Council for strategic decisions, then hands off to Superpowers for disciplined execution.
  MANDATORY TRIGGERS: any feature request, new feature, change request, "let's build", "quero",
  "preciso", "adicionar", "criar", "modificar", "refatorar", "precisamos", "vamos fazer".
  Also: "council then build", "decide and execute", "workflow this",
  "council-to-superpowers", "full workflow", "council this", "run the council",
  "war room this", "pressure-test this", "stress-test this", "debate this".
  STRONG TRIGGERS: "should I X or Y", "which option", "what would you do",
  "is this the right move", "validate this", "get multiple perspectives",
  "I can't decide", "I'm torn between".
  ALWAYS trigger on any request to add, change, or build functionality in this project.
  Do NOT trigger for simple yes/no questions, factual lookups, or casual chitchat.
  Always check AGENTS.md for project conventions first.
---

# Council → Superpowers Workflow

Duas fases. Council decide *o que* fazer. Superpowers executa *como*.

Antes de começar, leia `AGENTS.md` para convenções do projeto (stack, padrões, responsividade).

---

## Fase 1 — LLM Council

Execute o council completo: 5 advisors (Contrarian, First Principles, Expansionist, Outsider, Executor), peer review anônimo, chairman sintetiza.

Leia [`llm-council/SKILL.md`](../llm-council/SKILL.md) para o protocolo completo.

**Output:** veredito do council com recomendação.

**Salvar em:** `docs/council/<data>-<topico>-veredito.md`

## Fase 2 — Superpowers

Alimente o veredito do council no Superpowers. Leia cada SKILL.md manualmente — elas não disparam sozinhas.

1. **brainstorming** — "O council recomendou X. Faça o brainstorming da implementação."
   Leia `brainstorming/SKILL.md` | Salva spec em `docs/superpowers/specs/`

2. **writing-plans** — após aprovação do design
   Leia `writing-plans/SKILL.md` | Salva plano em `docs/superpowers/plans/`

3. **using-git-worktrees** — branch isolada
   Leia `using-git-worktrees/SKILL.md`

4. **test-driven-development** — RED/GREEN/REFACTOR
   Leia `test-driven-development/SKILL.md`

5. **subagent-driven-development** ou **executing-plans**
   Leia o SKILL.md correspondente
   > Com `pi-subagents` instalado, use as ferramentas `subagent`, `chain` e `parallel`
   > em vez do padrão manual de prompts. O skill `subagent-driven-development` já descreve
   > o fluxo (implementer → reviewer → fix loop → final review); as tools substituem
   > a simulação por invocações reais com progresso via TUI.

6. **requesting-code-review**
   Leia `requesting-code-review/SKILL.md`

7. **finishing-a-development-branch**
   Leia `finishing-a-development-branch/SKILL.md`

## Quando pular a Fase 2

Se o veredito do council for "não faça" ou "colete mais dados primeiro", pare. Apresente o veredito e não execute.

## Convenções do Projeto (MilesControl)

- Código em `src/`, páginas em `src/pages/`, componentes em `src/components/`
- shadcn/ui em `src/components/ui/`
- Import path: `@/` → `src/`
- React Query para dados, Supabase para backend
- pt-BR na interface
- Grid responsivo: máximo 2 colunas (`grid-cols-1 sm:grid-cols-2`)
- Veja `AGENTS.md` para a lista completa
