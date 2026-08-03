# Guardrails de Processo — Especificação de Design

> **Data:** 2026-08-03  
> **Status:** design aprovado pelo usuário; implementação pendente  
> **Categoria:** feature de workflow/chore  
> **Council:** `docs/council/2026-08-03-process-kpis-router-sanitizacao-veredito.md`

## Objetivo

Reduzir as violações recorrentes dos KPIs de processo sem apagar o histórico que as torna observáveis. O workflow deve falhar cedo quando a evidência é inválida, registrar a causa com schema estável e preparar os artefatos gerados antes de avaliar a regra de limpeza.

## Diagnóstico que esta spec trata

O histórico de agosto registra `rule-10-clean`, `rule-26-session-started` e `rule-27-council-veredict` como principais violações. O `pre-pr` também altera logs, quality metrics e `public/kpi-data.json` durante a própria execução; se esses arquivos chegam à regra de limpeza como unstaged, a regra acusa sujeira esperada do workflow. A validação existente cobre muitas convenções, mas não valida o schema dos eventos nem correlaciona a decisão e a conclusão de uma tarefa roteada.

## Escopo

- Definir um parser/validador puro para `docs/tracking/events.jsonl`.
- Validar eventos de sessão, pre-pr, rule failure, gate e router sem armazenar conteúdo sensível.
- Ajustar a ordem do `pre-pr` para fazer stage somente de artefatos gerados conhecidos antes das regras e novamente após a geração final.
- Criar comando read-only `npm run process:audit` e uma regra executável pelo `pre-pr` para contratos de evidência.
- Manter `rule:fail` histórico intacto para os KPIs; a correção de instrumentação não reclassifica o passado.

## Fora do escopo

- Não apagar ou reescrever eventos históricos.
- Não criar tabela Supabase ou serviço externo.
- Não substituir as regras 14/15/16/18/23/31/32 por uma segunda implementação.
- Não transformar warning de lint ou vulnerabilidade npm em um falso PASS de processo.
- Não registrar prompts, respostas, tokens, API keys, cookies ou credenciais.

## Contrato de eventos

O validador aceita o formato plano emitido por `event-log.mjs` e rejeita JSON inválido, tipo desconhecido ou campos obrigatórios ausentes.

| Tipo | Campos mínimos | Regra de integridade |
|---|---|---|
| `session:start` | `timestamp`, `branch`, `categoria` | categoria pertence a `feature`, `bugfix`, `docs`, `refactor`, `chore` |
| `session:end` | `timestamp`, `branch` | branch é string não vazia |
| `pre-pr` | `timestamp`, `branch`, `errors` | `errors` é inteiro não negativo; PASS equivale a `errors: 0` |
| `rule:fail` | `timestamp`, `branch`, `rule` | `rule` é identificador não vazio |
| `gate` | `timestamp`, `branch`, `gate` | gate é `intent`, `twins` ou `auth` |
| `llm.route.resolved` | contrato da spec do router | validado pelo módulo do router |
| `llm.route.completed` | contrato da spec do router | validado pelo módulo do router |

Campos desconhecidos permitidos em eventos legados devem ser preservados na leitura, mas o auditor reportará campos sensíveis ou campos incompatíveis com o tipo. A escrita nova deve usar apenas os campos permitidos pelo construtor correspondente.

## Arquitetura

```text
scripts/lib/process-events.mjs
  ├─ parseEventLog(raw)
  ├─ validateProcessEvent(event)
  └─ summarizeProcessEvidence(events)

scripts/process-audit.mjs
  ├─ --check: exit 1 em contrato inválido
  ├─ --json: saída estruturada para CI
  └─ padrão: relatório humano read-only

scripts/rules/rule-36-process-evidence.mjs
  └─ chama o mesmo módulo; não duplica as regras de domínio

scripts/pre-pr-check.mjs
  ├─ stage dos artefatos gerados conhecidos
  ├─ regras, build, testes e docs
  └─ stage final + eventos/KPI frescos
```

A lista de artefatos gerados que pode ser preparada automaticamente é explícita: `docs/RADAR.md`, `docs/tracking/events.jsonl`, `docs/tracking/quality.jsonl` e `public/kpi-data.json`. O pre-pr não deve executar `git add .` nem stagear código ou documentação editada pelo usuário.

## Guardrails

1. `process:audit --check` falha com linha, tipo, campo e motivo do evento inválido.
2. O `pre-pr` executa o check antes de declarar PASS; falhas são registradas como `rule:fail` com identificador estável.
3. A regra de limpeza continua exigindo que código e docs intencionais estejam staged/commitados; somente os quatro artefatos gerados conhecidos podem ser preparados pelo orquestrador.
4. O auditor informa quantidade de eventos por tipo, eventos inválidos, resoluções sem conclusão e campos sensíveis encontrados, sem imprimir valores sensíveis.
5. Ambiente de teste (`VITEST` ou `EVENT_LOG_DISABLED`) não grava eventos nem quality logs no histórico real.

## Testes

- Teste RED de JSONL inválido, tipo desconhecido, gate inválido e `pre-pr` sem `errors`.
- Teste GREEN de todos os tipos canônicos e compatibilidade com o formato plano atual.
- Fixture com uma resolução do router sem conclusão deve produzir `unobserved`, não PASS.
- Fixture com campo `prompt`, `output`, `token` ou `apiKey` deve falhar sem ecoar o valor.
- Teste de `pre-pr` verifica que somente artefatos gerados conhecidos são staged antes de `rule-10-clean`.
- Regressão: suíte unitária existente, `verify-docs:strict`, `check:pr` e `npm run process:audit -- --check`.

## Critérios de aceitação

1. Um JSONL corrompido falha antes de build/testes e informa a linha sem vazar conteúdo.
2. Um evento de processo válido é aceito e permanece compatível com os KPIs atuais.
3. Uma violação de regra continua aparecendo no histórico e no `topViolations`.
4. Uma execução normal do pre-pr não acusa `rule-10-clean` apenas por artefatos que o próprio workflow gerou.
5. Alterações não staged em `src/`, docs intencionais ou config continuam bloqueando o check.
6. O comando read-only e a regra usam a mesma função de validação; não há lógica divergente.
7. O check passa em fixture limpa e falha em cada fixture inválida observada.

## Rollout e rollback

A alteração deve entrar em branch própria. Depois do ciclo TDD e review, rodar pre-pr em uma cópia limpa do branch. Rollback é reverter a mudança de ordem/staging e remover a nova regra; os logs históricos não são reescritos.
