# 📋 Handoff — MilesControl

> Arquivo de passagem entre sessões. Mantém contexto crítico quando a janela
> fica pesada e precisamos começar uma sessão nova sem perder precisão.
>
> **Lido obrigatoriamente no início de cada sessão.**
> **Atualizado antes de `/new` ou quando a sessão atinge ~12+ turns significativos.**

---

## Goal

Implementar sistema de handoff (HANDOFF.md + skill) e organizar Sprint #2 com
os achados da auditoria técnica.

## Progress

### Done
- [x] Auditoria técnica completa (docs/reports/2026-07-08-codebase-audit.html)
- [x] Sprint #1: 5 bugs resolvidos, docs modulares, workflow de sprint, enforce rules, relatórios
- [x] HANDOFF.md criado com template estruturado
- [x] Skill handoff criada em .pi/skills/handoff/SKILL.md
- [x] AGENTS.md atualizado com regra #8 (leitura obrigatória de HANDOFF.md)
- [x] Template /sprint atualizado com passo de handoff
- [x] Sprint #2 anotada em AGENDA.md (16 tarefas)
- [x] PR enviado e mergeado (chore/codebase-audit)

### In Progress
- [ ] Atualizar HANDOFF.md com estado atual

### Blocked
- [ ] Nada bloqueado

## Key Decisions

- **Formato do HANDOFF.md**: reusa o mesmo formato do compaction summary do pi (Goal, Progress, Key Decisions, Next Steps, Critical Context) — compatível com qualquer harness
- **Skill em .pi/skills/**: segue Agent Skills standard, funcional em pi, Claude Code e OpenCode sem modificação
- **Heurística de 35%**: substituída por contagem de turns (~12+ turns significativos = hora de salvar handoff), já que pi não expõe percentual da janela em tempo real
- **Sem extensão TypeScript**: skill é markdown puro, 0 dependência, 0 manutenção (ponytail)
- **Cross-harness via settings.json**: Claude Code e OpenCode referenciam a skill via caminho relativo

## Next Steps

1. Finalizar esta sessão salvando HANDOFF.md
2. Iniciar Sprint #2 com os itens de código (Entradas.tsx, Vendas.tsx, useDatabase.ts)
3. Cada item em branch separada, PR para develop, merge, report HTML
4. Usar `/skill:handoff --save` antes de qualquer `/new`

## Critical Context

- **Branch atual:** chore/codebase-audit (merged para develop e main)
- **Último commit:** docs: relatorio de auditoria tecnica completa do codebase
- **Arquivos modificados não commitados:** HANDOFF.md, AGENTS.md, .pi/skills/handoff/SKILL.md, .pi/prompts/sprint.md, docs/AGENDA.md
- **Issues/PRs em aberto:** Nenhum (PRs #37 e #38 merged)
- **Sessão anterior (ID/arquivo):** N/A (primeira sessão com handoff)
