# MilesControl — Instruções para Agentes

> Projeto de gestão de milhas/pontos (milhagem). Leia o **sumário executivo** abaixo e depois consulte os docs específicos em `docs/`.

## Sumário Executivo

| O quê | Onde |
|-------|------|
| Stack & comandos | `docs/STACK.md` |
| Arquitetura & pastas | `docs/ARCHITECTURE.md` |
| Convenções de código | `docs/CONVENTIONS.md` |
| Design system & UI | `docs/UI-GUIDE.md` |
| Workflow obrigatório | `docs/WORKFLOW.md` |
| Sprint & tarefas | `docs/AGENDA.md` |
| Git & deploy | `docs/GIT-WORKFLOW.md` |
| Testes | `docs/TESTING.md` |
| Mapa completo | `docs/MAP.md` |

## Regras Imutáveis

1. **Workflow obrigatório**: toda feature passa pelo `council-to-superpowers` — veja `docs/WORKFLOW.md`
2. **Grid máximo 2 colunas**: `grid-cols-1 sm:grid-cols-2` — veja `docs/UI-GUIDE.md`
3. **DRY**: regra de negócio em ponto único em `src/lib/` — veja `docs/CONVENTIONS.md`
4. **Bateria pré-deploy**: build + testes E2E — veja `docs/TESTING.md`
5. **Ponytail mode**: stdlib/nativo primeiro, sem abstrações especulativas
6. **Interface**: português (pt-BR)
7. **🔴 Relatório HTML obrigatório antes do PR**: toda branch que altera código OU docs DEVE gerar `docs/reports/<PR>-<data>-<nome>.html` antes do PR. Template: `/report`. Hook de pre-push bloqueia se esquecer.
8. **📋 HANDOFF.md obrigatório no início da sessão**: leia `HANDOFF.md` antes de qualquer trabalho. Atualize antes de `/new`, quando a sessão atingir ~12+ turns, **ou sempre que criar/merger um PR**. O estado da sessão anterior é restaurado via este arquivo.

## Começando

Ordem obrigatória no início de cada sessão:

1. **Ler `HANDOFF.md`** — restaura contexto de sessões anteriores
2. **Ler `docs/AGENDA.md`** — sprint board
3. **Ler `docs/WORKFLOW.md`** — processo obrigatório
4. **Ler `docs/ARCHITECTURE.md`** — estrutura do projeto
5. **Ler `docs/CONVENTIONS.md`** — padrões de código

Para contexto histórico de sessões anteriores, veja também `MEMORY.md`.

## Compatibilidade Cross-Harness

Este projeto é usado com pi (harness principal), Claude Code e OpenCode.
Todas as skills em `.pi/skills/` seguem o Agent Skills standard e funcionam
nos três. Para usar a skill `handoff` em outros harnesses:

- **Claude Code**: adicionar em `.claude/settings.local.json`:
  ```json
  { "skills": ["../.pi/skills/handoff"] }
  ```
- **OpenCode**: adicionar em `.opencode/settings.json`:
  ```json
  { "skills": ["../.pi/skills/handoff"] }
  ```
