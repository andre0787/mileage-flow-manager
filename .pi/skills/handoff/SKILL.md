---
name: handoff
description: Gerencia o arquivo docs/handoff.md para preservar contexto entre sessões. Use no início de cada sessão para restaurar contexto, e antes de /new para salvar o estado atual sem perder precisão.
---

# Handoff — Passagem entre Sessões

## Formato

O arquivo `docs/handoff.md` segue a mesma estrutura do
compaction summary do pi: Goal, Progress, Key Decisions, Next Steps,
Critical Context.

## Uso

### Ler handoff (início de sessão)

```markdown
/skill:handoff
```

Lê `docs/handoff.md` e restaura o contexto da sessão anterior.
Use **sempre** no início de cada sessão, antes de qualquer trabalho.

### Salvar handoff (antes de /new)

```markdown
/skill:handoff --save
```

1. **Verificar `git status`** — garantir ZERO arquivos uncommitted (exceto .gitignore)
2. Se houver arquivos pendentes → `git add .` + `git commit` antes de prosseguir
3. Analisa o estado atual da conversa
4. Atualiza `docs/handoff.md` com:
   - Goal atual
   - Progress (Done, In Progress, Blocked)
   - Key Decisions tomadas
   - Next Steps
   - Critical Context (branch, commits, arquivos modificados, PRs abertos)
5. Sugere `/new` para começar sessão limpa

### Salvar e começar nova sessão

```markdown
/skill:handoff --new
```

Faz --save e já executa `/new` (ou instrui o usuário a fazer).

## Quando salvar

- A cada **12-15 turns significativos** de trabalho
- **Antes de qualquer `/new`** (obrigatório)
- Quando o modelo começar a ficar lento (indício de janela cheia)
- Ao finalizar uma tarefa grande

## Comportamento detalhado do --save

1. Executar `git status --short` — **bloquear se houver arquivos uncommitted**
2. Executar `git branch --show-current` para saber a branch atual
3. Executar `git log --oneline -1` para último commit
4. Revisar o Progress da conversa atual
5. Consolidar em `docs/handoff.md` no formato estruturado
6. Informar que o handoff foi salvo e sugerir `/new`

## Integração com outras ferramentas

Este skill segue o [Agent Skills standard](https://agentskills.io/specification).
Funciona em pi, Claude Code e OpenCode.

- **pi**: descobre automático em `.pi/skills/handoff/`
- **Claude Code**: adicionar `"skills": ["../.pi/skills/handoff"]` em `.claude/settings.local.json`
- **OpenCode**: adicionar `"skills": ["../.pi/skills/handoff"]` em `.opencode/settings.json`
