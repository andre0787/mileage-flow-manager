# KPI de Ativação do Router LLM — Especificação de Design

> **Data:** 2026-08-03  
> **Status:** implementado (LLMRouterKPISection, RouterMonthlyKPI, llmRouter aggregation)  
> **Categoria:** feature de workflow  
> **Council:** `docs/council/2026-08-03-process-kpis-router-sanitizacao-veredito.md`

## Objetivo

Medir honestamente o funcionamento do router declarativo: quantas rotas foram resolvidas, quantas tentativas terminaram, qual modelo foi efetivamente usado, quantos fallbacks ocorreram, quais tarefas ficaram sem conclusão e quais skills foram executadas por cada modelo.

## Princípios

- O modelo do orquestrador permanece fixo; somente subagentes são roteados.
- `resolved` é decisão planejada, não execução.
- `completed` representa tentativa observada; `model` no evento de conclusão é o modelo efetivo.
- Fallback só conta quando o modelo efetivo é candidato fallback declarado ou quando `fallbackUsed: true` foi informado pelo dispatcher.
- Ausência de conclusão é `unobserved`, nunca sucesso.
- Eventos contêm metadados operacionais, nunca conteúdo de prompt/resposta, tokens ou credenciais.
- A lista de skills é normalizada, deduplicada e formada por identificadores simples, por exemplo `brainstorming` ou `test-driven-development`.

## Contrato de eventos

### `llm.route.resolved`

Mantém os campos existentes e adiciona `skills` opcional:

```json
{
  "type": "llm.route.resolved",
  "taskId": "process-guardrails-task-1",
  "category": "feature",
  "capability": "implementation",
  "profile": "coding",
  "model": "openai-codex/gpt-5.4-mini",
  "fallbackModels": ["opencode/deepseek-v4-flash-free"],
  "source": "category-default",
  "retrySafety": "may-write",
  "configVersion": 1,
  "skills": ["test-driven-development"]
}
```

`model` continua sendo o primário resolvido. `fallbackModels` é a cadeia declarada, não uma prova de uso.

### `llm.route.completed`

Mantém `taskId`, `model`, `provider`, `attempt`, `status`, `durationMs` e `failureKind`, adicionando:

```json
{
  "type": "llm.route.completed",
  "taskId": "process-guardrails-task-1",
  "model": "opencode/deepseek-v4-flash-free",
  "resolvedModel": "openai-codex/gpt-5.4-mini",
  "provider": "opencode",
  "attempt": 2,
  "status": "completed",
  "durationMs": 1830,
  "fallbackUsed": true,
  "skills": ["test-driven-development"]
}
```

`status` aceita `completed`, `failed`, `cancelled` ou `blocked`. `fallbackUsed` deve ser booleano; quando verdadeiro, `model` deve ser diferente de `resolvedModel`. O validador não aceita campos sensíveis ou skills vazias/duplicadas.

Para compatibilidade com conclusões legadas sem `resolvedModel`/`fallbackUsed`, o agregador tenta correlacionar `taskId` com a resolução. Se não conseguir provar a correlação, marca o resultado como não classificável e não inventa fallback.

## Agregação mensal

Adicionar ao objeto de cada mês o bloco `llmRouter`:

```ts
interface RouterMonthlyKPI {
  resolved: number;
  completed: number;
  failed: number;
  unobserved: number;
  fallbackUsed: number;
  completionRate: number | null;
  fallbackRate: number | null;
  models: Array<{
    model: string;
    completed: number;
    failed: number;
    fallbackUsed: number;
  }>;
  skillsByModel: Array<{
    skill: string;
    model: string;
    completed: number;
    failed: number;
  }>;
}
```

Fórmulas:

- `resolved`: eventos `llm.route.resolved` do mês.
- `completed`: conclusões com `status=completed` correlacionadas a uma tarefa resolvida.
- `failed`: conclusões com `status=failed`, `cancelled` ou `blocked` correlacionadas.
- `unobserved`: resoluções sem nenhuma conclusão correspondente.
- `fallbackUsed`: conclusões classificadas como fallback.
- `completionRate`: `completed / resolved * 100`, ou `null` quando `resolved=0`.
- `fallbackRate`: `fallbackUsed / completed * 100`, ou `null` quando `completed=0`.
- `models`: conta o modelo efetivamente observado nas conclusões.
- `skillsByModel`: conta cada par skill/modelo uma vez por conclusão; skills repetidas no input são rejeitadas.

Tentativas múltiplas da mesma tarefa são preservadas para análise de fallback, mas uma tarefa só conta como concluída uma vez no indicador de `completed`; o último status terminal determina o resultado da tarefa.

## Dashboard `/kpi`

Adicionar uma seção `RouterKPISection` abaixo dos gráficos atuais, sem criar rota ou backend novos:

- Card “Ativações do Router”: `completed/resolved` e taxa de conclusão.
- Card “Uso de Fallback”: quantidade e percentual sobre conclusões.
- Tabela “Modelos efetivamente usados”: modelo, concluídas, falhas e fallbacks.
- Tabela “Skills por modelo”: skill, modelo, concluídas e falhas.
- Aviso “N rotas sem conclusão observada” quando `unobserved > 0`.
- Estado vazio explícito quando o mês não possui eventos do router.

A seção deve aceitar `llmRouter` ausente em JSON legado e mostrar “Sem dados do router neste período”, permitindo publicar o frontend antes de todos os meses históricos terem o novo campo.

## Integração operacional

O dispatcher deve executar, nesta ordem:

1. Resolver rota com `npm run llm:route -- resolve`.
2. Passar `model`, `fallbackModels`, `retrySafety` e o identificador da skill ao `subagent_gate`.
3. Depois do retorno, chamar `llm:route complete` com o modelo efetivo, status, tentativa, skills e, quando aplicável, `fallbackUsed`.
4. Em falha pré-lançamento, registrar conclusão `status=failed` e `failureKind=subagent_prelaunch`; não declarar a tarefa concluída.

O processo não depende de o provider fornecer conteúdo. O evento de conclusão é responsabilidade do dispatcher e deve ser produzido também para falhas controladas.

## Testes

- Testes unitários de validação para `skills`, `resolvedModel`, `fallbackUsed`, status e campos sensíveis.
- Testes RED/GREEN para primário concluído, fallback concluído, falha sem fallback, resolução sem conclusão e múltiplas tentativas.
- Teste do agregador com eventos fora de ordem e dois meses diferentes.
- Teste que garante que fallback não é contado quando o modelo efetivo não está na cadeia declarada.
- Teste de componente para cards, tabelas, aviso de `unobserved` e estado legado sem `llmRouter`.
- Teste da página `/kpi` preservando loading/erro/fetch existentes.
- `npm run llm:route:validate`, `npm test`, `check:pr` e smoke E2E da página protegida.

## Segurança e privacidade

O schema de conclusão rejeita `prompt`, `input`, `output`, `response`, `token`, `apiKey`, `password`, `secret` e variantes conhecidas. A lista de skills é tratada como metadado de workflow; nomes de arquivos, conteúdo de tarefa e resposta não entram no evento. O dashboard recebe somente agregados versionados em `public/kpi-data.json`.

## Critérios de aceitação

1. O KPI diferencia rota planejada de execução observada.
2. O modelo efetivo aparece por conclusão e o uso de fallback é calculável sem inferência ambígua.
3. A matriz skill→modelo é alimentada por eventos estruturados e não por parsing de prompt.
4. Falhas de subagente e rotas sem conclusão ficam visíveis.
5. Eventos inválidos ou sensíveis falham fechado antes de serem gravados.
6. JSON legado continua renderizando sem crash e sem fingir que há dados ausentes.
7. O cálculo é determinístico para a mesma sequência de eventos.
