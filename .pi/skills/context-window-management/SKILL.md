---
name: context-window-management
description: >
  Práticas compactas para reduzir contexto carregado por agentes, evitar leitura
  preventiva e manter handoffs curtos para modelos menores.
---

# Context Window Management

Use quando uma tarefa começar a ficar cara em tokens ou quando o executor for um
modelo menor.

## Regras rápidas

1. Leia `AGENTS.md` e apenas os docs da categoria da tarefa.
2. Use `npm run nav:gate` antes de abrir arquivos-fonte grandes.
3. Prefira `npm run context:pack -- --task <ID>` quando existir task-card.
4. Retorne só fatos acionáveis: arquivo, linha, risco e próximo passo.
5. Não cole logs longos; resuma falhas e cite o comando que as produziu.

## Orçamento recomendado

- Brief de delegação: 1 a 3 frases.
- Estado de sessão: até 50 linhas.
- Arquivos grandes: ler por símbolo/trecho, não inteiro.
- Tracking: podar quando `context:audit` apontar overhead alto.

## Checklist antes de implementar

- Objetivo e não objetivos claros.
- Arquivos permitidos conhecidos.
- Testes obrigatórios listados.
- Plano em passos pequenos, executáveis por modelo eficiente.
