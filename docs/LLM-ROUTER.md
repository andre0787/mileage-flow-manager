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

A configuração versionada fica em `config/llm-router.json`; aliases apontam para IDs fully-qualified (`provider/model`) e profiles declaram fallbacks explícitos. Uma referência inválida falha antes do dispatch.

### Matriz ativa equilibrada

| Profile | Primário | Fallback |
|---|---|---|
| `efficient` | `opencode/deepseek-v4-flash-free` | `opencode/ling-3.0-flash-free` |
| `coding` | `openai-codex/gpt-5.4-mini` | `opencode/deepseek-v4-flash-free` |
| `strong-reasoning` | `openai-codex/gpt-5.6-luna` | `opencode/deepseek-v4-flash-free` |
| `independent-review` | `openai-codex/gpt-5.6-luna` | `opencode/deepseek-v4-flash-free` |

Os quatro IDs únicos da matriz ativa responderam ao canary local. `opencode/deepseek-v4-pro` e `opencode/claude-sonnet-4-6` ficaram fora por exigirem método de pagamento no workspace OpenCode.

## Overrides, retry e auditoria

`--profile` aplica um override manual e o evento registra `source: "manual"`. Overrides vindos de task-cards usam `source: "task-card"`. Fallbacks nunca são inventados pelo dispatcher.

Preserve `retrySafety` na chamada ao gate: `read-only` pode participar de retries limitados definidos pelo dispatcher, enquanto `may-write` não deve receber retry automático após o lançamento.

Resoluções produzem `llm.route.resolved`; conclusões podem ser registradas com:

```bash
npm run llm:route -- complete --event '{"taskId":"P1-09","model":"openai-codex/gpt-5.4-mini","provider":"openai-codex","attempt":1,"status":"completed","durationMs":42}'
```

### Ordem obrigatória do dispatcher

1. **resolve** — escolhe primário e fallbacks; registra `llm.route.resolved` (decisão planejada).
2. **invoque** o subagente/modelo — primeiro o primário, depois o fallback se necessário.
3. **complete** — registra `llm.route.completed` com o **modelo efetivo** em `model`, o
   primário planejado em `resolvedModel`, `fallbackUsed: true` quando o efetivo
diverge do primário, `status` terminal (`completed|failed|cancelled|blocked`) e
`skills` normalizadas.
4. **falha pré-lançamento** — se o dispatcher não consegue nem lançar o
   subagente, registra `llm.route.completed` com `status: "failed"` e
   `failureKind: "subagent_prelaunch"`.

`resolved` sozinho **não é execução**: o KPI só conta tarefas terminadas com um
`completed` terminal. Resoluções sem conclusão ficam como `unobserved`.

Eventos aceitam somente metadados estruturados. Não inclua prompts, respostas integrais, tokens, API keys ou credenciais. Use `--no-log` em dry-runs e testes.

## Providers e sampling (pi ≥ 0.84)

### Baseten (GLM-5.2) — perfil opcional

O provider builtin `baseten` autentica via `BASETEN_API_KEY` e expõe
`zai-org/GLM-5.2` como modelo padrão. O router declara o alias
`baseten-primary` e o perfil `baseten` (fallback: `efficient-primary`), sem
alterar os defaults das categorias:

```bash
npm run llm:route -- resolve --context '{"taskId":"x","category":"chore","source":"manual"}' --profile baseten
```

Sem `BASETEN_API_KEY` no ambiente, o modelo não aparece no catálogo e o
dispatch do subagente falha — o perfil é opt-in, não default.

### samplingParams e thinking_token_budget

Desde a 0.84 o pi aceita `samplingParams` arbitrários (OpenAI-compat) em
`~/.pi/agent/models.json` (models + `modelOverrides`), extension providers e
stream options — chaves vencem os campos nomeados do pi (`temperature`,
`top_p`, `top_k`, `min_p` etc.). Exemplo de override global:

```json
{
  "providers": {
    "baseten": {
      "modelOverrides": {
        "zai-org/GLM-5.2": {
          "samplingParams": { "temperature": 0.7, "top_p": 0.9 }
        }
      }
    }
  }
}
```

`thinking_token_budget` (vLLM) reserva tokens de output para a resposta final
em servidores OpenAI-compatíveis que o suportem. `models.json` é global do
usuário (`~/.pi/agent/models.json`) — não é versionado no repo; o router do
projeto decide modelos, o pi decide sampling.

## Capacidades futuras

`visual-inspection` é aceito pelo contrato para evolução futura, assim como o perfil conceitual `vision-observer`, mas nenhum browser runner, captura de screenshot ou provider multimodal é ativado no MVP. A captura visual futura deverá pertencer ao runtime controlado; o provider apenas analisará evidências já capturadas.

## Harness de subagentes (diagnóstico P2)

A delegação via `subagent_gate` depende do pacote **`pi-subagents`** instalado no ambiente:

```bash
pi install npm:pi-subagents   # único passo; extensão carrega no startup do pi
```

**Agentes válidos (catálogo builtin, v0.39+):** `advisor`, `context-builder`, `delegate`, `oracle`, `planner`, `researcher`, `reviewer`, `scout`, `worker`. A partir da 0.39.0 o harness valida agentes no pré-lançamento (`allowedAgents`): nomes fora do catálogo falham com `failureKind: "subagent_prelaunch"` (sem child run). Nomes históricos inválidos: `general-purpose`, `council-contrarian`, `review`, `process-guardrails-*`.

**Verifique antes de delegar:**

```bash
npm run harness:check            # relatório informativo (read-only)
npm run harness:check -- --check # exit 1 se o pacote estiver ausente
```

Se o pacote estiver ausente, **não** dispare `subagent_gate` — registre a falha como `llm.route.completed` com `status: "failed"` e `failureKind: "subagent_prelaunch"` apenas quando houver intenção real de lançar (o guard evita falhas reativas no KPI). Após instalar, reinicie a sessão do pi para a extensão registrar a tool.
