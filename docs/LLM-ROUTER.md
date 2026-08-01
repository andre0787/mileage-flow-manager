# Router declarativo de modelos LLM

O router escolhe modelos apenas para subagentes. O modelo do orquestrador permanece fixo durante a sessão.

## Resolver uma tarefa

```bash
npm run llm:route -- resolve --task P1-09
```

O resultado contém `profile`, `model`, `fallbackModels`, `source` e `retrySafety`. Para uma tarefa roteada, copie exatamente `model`, `fallbackModels` e `retrySafety` para `subagent_gate`; não escolha outro modelo inline.

## Resolver contexto inferido pelo orquestrador

```bash
npm run llm:route -- resolve --context '{"taskId":"x","category":"feature","capability":"review","retrySafety":"read-only","source":"orchestrator-inference"}'
```

A categoria é obrigatória. A precedência é override manual, override do task-card, rota de categoria + capability, default da categoria e default global. A ausência de capability usa o default visível da categoria.

## Validar configuração

```bash
npm run llm:route:validate
```

A configuração versionada fica em `config/llm-router.json`; aliases apontam para IDs concretos e profiles declaram fallbacks explícitos. Uma referência inválida falha antes do dispatch.

## Overrides, retry e auditoria

`--profile` aplica um override manual e o evento registra `source: "manual"`. Overrides vindos de task-cards usam `source: "task-card"`. Fallbacks nunca são inventados pelo dispatcher.

Preserve `retrySafety` na chamada ao gate: `read-only` pode participar de retries limitados definidos pelo dispatcher, enquanto `may-write` não deve receber retry automático após o lançamento.

Resoluções produzem `llm.route.resolved`; conclusões podem ser registradas com:

```bash
npm run llm:route -- complete --event '{"taskId":"P1-09","model":"deepseek-v4-flash-free","provider":"opencode","attempt":1,"status":"completed","durationMs":42}'
```

Eventos aceitam somente metadados estruturados. Não inclua prompts, respostas integrais, tokens, API keys ou credenciais. Use `--no-log` em dry-runs e testes.

## Capacidades futuras

`visual-inspection` é aceito pelo contrato para evolução futura, assim como o perfil conceitual `vision-observer`, mas nenhum browser runner, captura de screenshot ou provider multimodal é ativado no MVP. A captura visual futura deverá pertencer ao runtime controlado; o provider apenas analisará evidências já capturadas.
