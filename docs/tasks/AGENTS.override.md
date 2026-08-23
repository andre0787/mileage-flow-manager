# AGENTS.override.md — docs/tasks

> Substitui o `AGENTS.md` da raiz **apenas dentro deste diretório** (feature do
> pi ≥ 0.84). Contexto de diretórios-pai continua empilhando normalmente.
> Objetivo: contexto enxuto para modelos pequenos executarem task-cards.

## Missão

Executar task-cards (`docs/tasks/P?-NN-*.md`) com o fluxo mínimo do projeto.
Apontar para comandos versionados — não duplicar documentação.

## Fluxo obrigatório (nesta ordem)

1. `npm run session:start` — sempre antes de qualquer trabalho
2. `npm run context:pack -- --task <ID>` — pacote de contexto seletivo
3. Ler o card: `arquivosPermitidos`, `testesObrigatórios`, `evidênciaDePronto`
4. `npm run task:state <ID> implementing` — registra início
5. Implementar — alterar **apenas** `arquivosPermitidos` do card
7. `npm run task:validate` — valida cards contra o schema
8. `npm run pre-pr` — build + testes + rules + relatório
9. `npm run task:state <ID> verified` — registra verificação
10. Criar PR → `npm run task:state <ID> review`

## Regras absolutas

- **NUNCA na main** — branch obrigatória (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/`)
- **git status ZERO** antes de PR — sem arquivos uncommitted
- **Sanitizar metadados** — registrar `llm.route.completed` sem prompt nem resposta integral
- **Sem dependências novas** — zero libs adicionadas
- **Verificação por observação** — rode o comando e confirme o output antes de alegar sucesso

## Referências (leia sob demanda)

| Assunto | Onde |
|---------|------|
| Estados de task-card | `docs/WORKFLOW-MANIFEST.md` §2 (resumo: pending → planned → implementing → verified → review → done) |
| Fluxo completo p/ modelo pequeno | `.pi/skills/small-model-execution/SKILL.md` |
