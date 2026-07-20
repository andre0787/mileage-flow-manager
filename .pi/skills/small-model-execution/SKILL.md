---
name: small-model-execution
description: >
  Fluxo mínimo para um modelo LLM pequeno executar um task-card de
  `docs/tasks/` usando os comandos versionados do projeto. Aponta para
  comandos, não duplica documentação.
---

# Small Model Execution

Use quando receber um task-card (`P?-NN`) para executar.

## Pré-requisitos

- `npm run session:start` — sempre, antes de qualquer trabalho.
- `npm run context:pack -- --task <ID>` — gera pacote de contexto seletivo
  (card + seções relevantes de CONVENTIONS.md + arquivos da área + comandos).
- Leia o card em `docs/tasks/<card-file>.md` para `arquivosPermitidos`,
  `testesObrigatórios` e `evidênciaDePronto`.

## Fluxo

```
context:pack → ler card → task:state implementing → implementar
→ task:validate → pre-pr → task:state verified → PR → task:state review
```

### Passo a passo

1. **`npm run context:pack -- --task <ID>`** — contexto seletivo (só o que importa)
2. **Ler o card** — foco em `arquivos permitidos`, `critérios de aceite`,
   `testes obrigatórios`, `evidência de pronto`
3. **`npm run task:state <ID> implementing`** — registra início
4. **Implementar** — alterar apenas arquivos em `arquivos permitidos`
5. **`npm run task:validate`** — valida todos os cards contra o schema
6. **`npm run pre-pr`** — relatório + validações completas
7. **`npm run task:state <ID> verified`** — registra verificação
8. **Criar PR** — `gh pr create` ou `npm run pre-pr` gera relatório
9. **`npm run task:state <ID> review`** — registra review

## Estados (WORKFLOW-MANIFEST.md §2)

Ver [`docs/WORKFLOW-MANIFEST.md`](../../docs/WORKFLOW-MANIFEST.md#2-estados-de-task-card)
para a máquina de estados completa.

Resumo: `pending → planned → implementing → verified → review → done`

Comando: `npm run task:state <ID> <novo-estado>`

## Comandos versionados

| Comando | O que faz |
|---------|-----------|
| `npm run task:validate` | Valida todos os cards contra `docs/task-card.schema.json` |
| `npm run task:state <ID> <estado>` | Transiciona estado do card (valida transição) |
| `npm run context:pack -- --task <ID>` | Gera pacote de contexto seletivo |
| `npm run pre-pr` | Relatório HTML + validações obrigatórias |
| `npm run session:start` | Carrega handoff + snapshot do projeto |

## Regras

- **Só altere arquivos em `arquivos permitidos`** do card.
- **Nunca pule `pre-pr`** antes de PR (exceto emergência com `--skip-pre-pr` e justificativa).
- **Nunca duplique conteúdo** de WORKFLOW-MANIFEST.md, CONVENTIONS.md ou outros docs — **aponte** com caminho relativo.
- **Dúvida fora do card?** Não deduza — pare e pergunte.

## Exemplo

```bash
# 1. Contexto
npm run context:pack -- --task P1-12

# 2. Iniciar
npm run task:state P1-12 implementing

# 3. Implementar (editar arquivos permitidos)

# 4. Validar
npm run task:validate
npm run pre-pr

# 5. Finalizar
npm run task:state P1-12 verified
# criar PR...
npm run task:state P1-12 review
```
