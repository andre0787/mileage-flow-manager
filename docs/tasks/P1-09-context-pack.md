# Task Card — npm run context:pack

| Campo | Valor |
|-------|-------|
| `id` | P1-09 |
| `categoria` | feat |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | verified |
| `origem` | veredito 2026-07-17, item #9 |
| `dependeDe` | [P1-08] |

## Objetivo
Gerar um pacote de contexto curto e seletivo a partir de um task-card, para que
um modelo menor receba só o que é relevante à área afetada.

## Não objetivos
- Copiar o repositório inteiro (ver Revisão A do veredito).
- Substituir o handoff.

## Contexto
Hoje o contexto é carregado "preventivamente" por categoria (AGENTS.md regra
dourada), mas isso ainda carrega docs inteiros. O veredito quer contexto sob
demanda por risco: uma mudança de UI não precisa de invariantes financeiras.

## Arquivos permitidos
- `scripts/context-pack.*` (novo)
- `package.json` (atalho `context:pack`)

## Critérios de aceite
- [ ] `npm run context:pack -- --task P?-NN` gera pacote contendo: card,
      árvore apenas da área afetada, símbolos/exportações relevantes,
      contratos/invariantes, testes relacionados, último estado do CI e
      comandos de verificação.
- [ ] O pacote tem limite de tamanho (não copia o repo inteiro).
- [ ] Existe teste que mostra pacote mínimo para um card de UI vs um card financeiro.

## Riscos / Invariantes
- Seleção de "área afetada" deve ser determinística, não heurística frágil.

## Testes obrigatórios
- `npm test` (novo teste de script)
- rodar manualmente com 2 cards distintos.

## Evidência de pronto
- Saída de `context:pack` para dois cards (UI e financeiro) demonstrando seletividade.
