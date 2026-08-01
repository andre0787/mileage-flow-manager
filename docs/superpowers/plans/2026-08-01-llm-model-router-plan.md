# Router declarativo de modelos LLM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um resolver declarativo, determinístico e auditável que escolha o modelo dos subagentes e seus fallbacks sem trocar o modelo do orquestrador.

**Architecture:** Um módulo puro valida a configuração e resolve `TaskContext` em `RouteDecision`. Uma CLI carrega configuração/task-card, normaliza categorias e expõe a decisão em JSON; o orquestrador usa esse resultado ao chamar `subagent_gate`. Eventos de resolução e conclusão são registrados sem prompts, respostas ou credenciais.

**Tech Stack:** Node.js 22 + módulos ESM nativos, JSON, Vitest, scripts npm existentes, `subagent_gate` com `model`, `fallbackModels` e `retrySafety`.

## Global Constraints

- O modelo do orquestrador permanece fixo durante a sessão; apenas subagentes recebem rota.
- A precedência é `override manual → override do task-card → category + capability → category default → global default`.
- A mesma configuração e o mesmo `TaskContext` normalizado devem produzir a mesma `RouteDecision`.
- Configuração inválida, alias desconhecido e rota sem perfil devem falhar fechado antes do dispatch.
- Fallbacks são explícitos; o dispatcher não inventa outro modelo.
- `retrySafety=may-write` nunca recebe retry automático pós-lançamento; o valor deve ser encaminhado ao `subagent_gate`.
- Não adicionar dependências de runtime; a validação de referências cruzadas será feita em módulo nativo.
- Eventos nunca armazenam API keys, tokens, prompts completos ou respostas integrais.
- `visual-inspection` e `vision-observer` ficam aceitos pelo contrato, mas não serão ativados nem integrarão browser/modelo multimodal neste plano.
- IDs de providers somente entram na configuração quando estiverem confirmados; a configuração inicial usa o modelo já confirmado `deepseek-v4-flash-free`.

---

## Mapa de arquivos e responsabilidades

- **Criar `config/llm-router.schema.json`:** contrato estrutural da configuração.
- **Criar `config/llm-router.json`:** configuração versionada ativa, conservadora e sem rota visual ativa.
- **Criar scripts/lib/llm-router.mjs:** constantes, validação, normalização, resolver puro e construtores de eventos.
- **Criar scripts/llm-route.mjs:** CLI de `validate`, `resolve` e `complete`; único script de entrada com atalho npm.
- **Modificar `package.json`:** atalhos `llm:route` e `llm:route:validate`.
- **Modificar `scripts/event-log.mjs`:** aceitar os dois tipos de evento do router.
- **Modificar `docs/task-card.schema.json` e `docs/tasks/_TEMPLATE.md`:** documentar metadados opcionais de capacidade, fase, override e retry.
- **Criar tests/unit/llm-router.test.ts:** testes do módulo puro e das invariantes de configuração.
- **Criar tests/unit/scripts-llm-route.test.ts:** testes da CLI, task-card e saída JSON.
- **Modificar `AGENTS.md`, `.pi/skills/small-model-execution/SKILL.md` e `docs/WORKFLOW.md`:** tornar a resolução obrigatória antes de `subagent_gate`.
- **Criar docs / LLM-ROUTER.md:** contrato operacional e exemplos para o orquestrador.
- **Modificar `docs/MAP.md` e `.prompts-manifest.json`:** indexar a documentação e atualizar hashes de prompts modificados.

---

### Task 1: Definir contrato, schema e configuração ativa

**Files:**
- Create: `config/llm-router.schema.json`
- Create: `config/llm-router.json`
- Modify: `docs/task-card.schema.json`
- Modify: `docs/tasks/_TEMPLATE.md`

**Interfaces:**
- Produces `RouterConfig` com `version`, `aliases`, `profiles`, `categoryDefaults`, `globalDefault` e `routes`.
- Produces aliases `string → string`; profiles referenciam aliases por `primary` e `fallbacks`.
- Produces metadados opcionais de task-card: `capability`, `phase`, `modelProfileOverride` e `retrySafety`.
- Later tasks consume the exact property names from this task.

- [ ] **Step 1: Escrever o schema estrutural da configuração**

Criar `config/llm-router.schema.json` com propriedades fechadas e referências cruzadas deixadas para o validador nativo. O núcleo deve ter esta forma:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mileage-flow-manager.app/llm-router.schema.json",
  "title": "LLM Router Config",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "aliases", "profiles", "categoryDefaults", "globalDefault", "routes"],
  "properties": {
    "version": { "type": "integer", "const": 1 },
    "aliases": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": { "type": "string", "minLength": 1 }
    },
    "profiles": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["primary", "fallbacks"],
        "properties": {
          "primary": { "type": "string", "minLength": 1 },
          "fallbacks": {
            "type": "array",
            "uniqueItems": true,
            "items": { "type": "string", "minLength": 1 }
          }
        }
      }
    },
    "categoryDefaults": {
      "type": "object",
      "additionalProperties": { "type": "string", "minLength": 1 }
    },
    "globalDefault": { "type": "string", "minLength": 1 },
    "routes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["category", "capability", "profile"],
        "properties": {
          "category": { "type": "string" },
          "capability": { "type": "string" },
          "profile": { "type": "string", "minLength": 1 }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Criar a configuração ativa sem IDs não confirmados**

Criar `config/llm-router.json`. Até existir um catálogo confirmado de providers, todos os perfis ativos apontam para o modelo já presente no ambiente; o resolver e os testes continuam preparados para IDs distintos.

```json
{
  "version": 1,
  "aliases": {
    "deepseek-current": "deepseek-v4-flash-free"
  },
  "profiles": {
    "strong-reasoning": { "primary": "deepseek-current", "fallbacks": [] },
    "coding": { "primary": "deepseek-current", "fallbacks": [] },
    "efficient": { "primary": "deepseek-current", "fallbacks": [] },
    "independent-review": { "primary": "deepseek-current", "fallbacks": [] }
  },
  "categoryDefaults": {
    "feature": "coding",
    "bugfix": "strong-reasoning",
    "docs": "efficient",
    "refactor": "coding",
    "chore": "efficient"
  },
  "globalDefault": "efficient",
  "routes": [
    { "category": "feature", "capability": "review", "profile": "independent-review" },
    { "category": "bugfix", "capability": "debugging", "profile": "strong-reasoning" },
    { "category": "refactor", "capability": "implementation", "profile": "coding" },
    { "category": "docs", "capability": "documentation", "profile": "efficient" }
  ]
}
```

- [ ] **Step 3: Estender o schema de task-card com campos opcionais**

Adicionar em `docs/task-card.schema.json` as propriedades abaixo sem torná-las obrigatórias, preservando todos os cards existentes:

```json
"capability": {
  "type": "string",
  "enum": ["analysis", "planning", "implementation", "debugging", "testing", "review", "documentation", "visual-inspection"]
},
"phase": { "type": "string" },
"modelProfileOverride": { "type": "string" },
"retrySafety": { "type": "string", "enum": ["read-only", "may-write"] }
```

- [ ] **Step 4: Documentar os campos no template**

Adicionar as linhas opcionais à tabela de `docs/tasks/_TEMPLATE.md`:

```markdown
| `capability` | opcional — capability do router |
| `phase` | opcional — fase operacional |
| `modelProfileOverride` | opcional — perfil/alias validado pelo router |
| `retrySafety` | opcional — `read-only` ou `may-write` |
```

- [ ] **Step 5: Executar a validação existente dos cards**

Run: `npm run task:validate`

Expected: `Todos os cards válidos!`; como os campos são opcionais, nenhum card atual deve exigir migração.

- [ ] **Step 6: Commit**

```bash
git add config/llm-router.schema.json config/llm-router.json docs/task-card.schema.json docs/tasks/_TEMPLATE.md
git commit -m "feat: definir contrato declarativo do llm router"
```

---

### Task 2: Implementar resolver puro e testes de precedência

**Files:**
- Create: scripts/lib/llm-router.mjs
- Create: tests/unit/llm-router.test.ts

**Interfaces:**

```js
export const CATEGORIES = ["feature", "bugfix", "docs", "refactor", "chore"];
export const CAPABILITIES = [
  "analysis", "planning", "implementation", "debugging",
  "testing", "review", "documentation", "visual-inspection",
];

export class RouterConfigError extends Error {
  constructor(issues) { /* issues: string[] */ }
}

export function validateRouterConfig(config) { /* returns string[] */ }
export function assertValidRouterConfig(config) { /* throws RouterConfigError */ }
export function normalizeTaskContext(input) { /* returns normalized TaskContext */ }
export function resolveRoute(context, config) { /* returns RouteDecision */ }
export function createResolvedEvent(context, decision) { /* returns JSON-safe event */ }
export function createCompletedEvent(input) { /* returns JSON-safe event */ }
```

`TaskContext` normalizado deve conter `taskId`, `category`, `capability?`, `phase?`, `modelProfileOverride?`, `retrySafety` e `source`. `source` será `manual`, `task-card` ou `orchestrator-inference`.

- [ ] **Step 1: Escrever testes que falham para a validação estrutural**

Em tests/unit/llm-router.test.ts, cobrir versão ausente, alias vazio, profile com primary inexistente, fallback desconhecido, category default apontando para profile inexistente e duas rotas repetidas para a mesma combinação:

```ts
it("rejeita fallback que não existe em aliases", () => {
  expect(() => assertValidRouterConfig({
    version: 1,
    aliases: { primary: "model/a" },
    profiles: { coding: { primary: "primary", fallbacks: ["missing"] } },
    categoryDefaults: { feature: "coding" },
    globalDefault: "coding",
    routes: [],
  })).toThrow(/fallback.*missing/i);
});
```

Run: npx vitest run tests/unit/llm-router.test.ts

Expected: FAIL porque scripts/lib/llm-router.mjs ainda não existe.

- [ ] **Step 2: Implementar validação sem dependência externa**

Implementar `validateRouterConfig` com listas de issues, verificando:

1. chaves obrigatórias e `version === 1`;
2. aliases como strings não vazias;
3. `primary` e cada fallback de profile referenciando aliases;
4. fallback sem duplicata e sem repetir o primary;
5. profiles usados por `categoryDefaults`, `globalDefault` e `routes` existindo;
6. categorias e capabilities pertencendo aos vocabulários declarados;
7. nenhuma combinação `category + capability` repetida.

`assertValidRouterConfig` deve lançar `RouterConfigError` com todas as issues agregadas, sem corrigir silenciosamente o arquivo.

- [ ] **Step 3: Implementar normalização e resolver mínimo**

A resolução deve selecionar apenas o nome do profile e depois expandir aliases:

```js
const profile = config.profiles[selectedProfile];
return {
  profile: selectedProfile,
  model: config.aliases[profile.primary],
  fallbackModels: profile.fallbacks.map((alias) => config.aliases[alias]),
  source,
  retrySafety: context.retrySafety,
};
```

Aplicar a ordem exata:

```text
override manual → override de task-card → rota category+capability
→ categoryDefaults[category] → globalDefault
```

`modelProfileOverride` com `source === "manual"` produz `source: "manual"`; o mesmo campo com `source === "task-card"` produz `source: "task-card"`. Ausência de capability não pode acionar uma rota parcial.

- [ ] **Step 4: Implementar eventos puros sem conteúdo sensível**

`createResolvedEvent(context, decision)` deve produzir somente:

```js
{
  type: "llm.route.resolved",
  taskId,
  category,
  capability,
  profile,
  model,
  fallbackModels,
  source,
  retrySafety,
  configVersion,
}
```

`createCompletedEvent` deve aceitar `taskId`, `model`, `provider`, `attempt`, `status`, `durationMs` e `failureKind`, rejeitando `prompt`, `input`, `output`, `response` e credenciais. O módulo não deve escrever arquivos nem consultar o ambiente.

- [ ] **Step 5: Completar a matriz de testes**

Adicionar testes para:

- category default;
- rota `category + capability`;
- override manual;
- override do task-card;
- global default;
- expansão de aliases e ordem de fallbacks;
- preservação de `read-only` e `may-write`;
- categoria/capability inválidas;
- igualdade de duas resoluções com o mesmo contexto/configuração;
- eventos sem prompts ou respostas.

Run: npx vitest run tests/unit/llm-router.test.ts

Expected: PASS com todos os casos do resolver.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/llm-router.mjs tests/unit/llm-router.test.ts
git commit -m "feat: implementar resolver deterministico de rotas llm"
```

---

### Task 3: Criar CLI, integração com task-card e auditoria

**Files:**
- Create: scripts/llm-route.mjs
- Create: tests/unit/scripts-llm-route.test.ts
- Modify: `package.json`
- Modify: `scripts/event-log.mjs`

**Interfaces:**
- `npm run llm:route -- validate` valida o arquivo ativo.
- `npm run llm:route:validate` é atalho equivalente para a regra #16.
- `npm run llm:route -- resolve --task P1-09 --no-log` retorna um `RouteDecision` JSON.
- `npm run llm:route -- resolve --context '<json>' --no-log` resolve contexto já normalizado.
- `npm run llm:route -- complete --event '<json>'` registra conclusão sanitizada.
- CLI errors go to stderr and exit with status 1; JSON decision goes to stdout.

- [ ] **Step 1: Escrever testes de CLI que falham**

Em tests/unit/scripts-llm-route.test.ts, usar `execFileSync` com `EVENT_LOG_DISABLED=1` e testar o contrato externo:

```ts
it("resolve um task-card sem capability usando o default da categoria", () => {
  const raw = execFileSync("node", [SCRIPT, "resolve", "--task", "P1-09", "--no-log"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, EVENT_LOG_DISABLED: "1" },
  });
  const decision = JSON.parse(raw);
  expect(decision.source).toBe("category-default");
  expect(decision.profile).toBe("coding");
  expect(decision.model).toBe("deepseek-v4-flash-free");
});
```

Adicionar casos para card inexistente, JSON inválido, `--profile` manual, `test → chore` na normalização e `validate` com configuração válida.

Run: npx vitest run tests/unit/scripts-llm-route.test.ts

Expected: FAIL porque o CLI e os atalhos ainda não existem.

- [ ] **Step 2: Implementar leitura de configuração e argumentos**

`llm-route.mjs` deve carregar por padrão `config/llm-router.json`, aceitar `--config <path>` para fixtures e aceitar somente os comandos `validate`, `resolve` e `complete`. Não usar `eval`, não executar conteúdo vindo do JSON e não aceitar prompt como metadado de evento.

- [ ] **Step 3: Implementar parser determinístico de task-card**

Reutilizar o padrão de tabela já usado por `scripts/context-pack.mjs`:

```js
const rowRe = /^\|\s*`(\w+)`\s*\|\s*(.+?)\s*\|/gm;
```

Normalizar categorias de card antes de resolver:

```js
const CARD_CATEGORY_MAP = {
  feat: "feature",
  fix: "bugfix",
  docs: "docs",
  refactor: "refactor",
  chore: "chore",
  test: "chore",
};
```

`--task P1-09` deve localizar o ID em `docs/tasks`, extrair os campos opcionais e marcar `source: "task-card"`. `--context` deve exigir `category` normalizada e preservar `source`; `--profile` da linha de comando deve marcar `source: "manual"`.

- [ ] **Step 4: Implementar comandos e saída JSON**

O comando `resolve` deve chamar `normalizeTaskContext`, `assertValidRouterConfig`, `resolveRoute` e imprimir somente a decisão serializada. O comando `validate` deve imprimir as issues, quando existirem, e sair 1. O comando `complete` deve chamar `createCompletedEvent` e registrar o evento sem incluir a resposta do subagente.

- [ ] **Step 5: Adicionar tipos de evento ao registrador**

Adicionar `llm.route.resolved` e `llm.route.completed` à lista de tipos aceitos de `scripts/event-log.mjs`. O CLI deve enviar a descrição curta e os campos estruturados por `--meta`; com `EVENT_LOG_DISABLED` ou `VITEST`, nenhum arquivo deve ser alterado.

- [ ] **Step 6: Adicionar atalhos npm e executar testes**

Em `package.json`:

```json
"llm:route": "node scripts/llm-route.mjs",
"llm:route:validate": "node scripts/llm-route.mjs validate"
```

Run: `npm run llm:route:validate`

Expected: configuração válida.

Run: npx vitest run tests/unit/llm-router.test.ts tests/unit/scripts-llm-route.test.ts

Expected: todos os testes do resolver e da CLI passam.

- [ ] **Step 7: Commit**

```bash
git add scripts/llm-route.mjs tests/unit/scripts-llm-route.test.ts package.json scripts/event-log.mjs
git commit -m "feat: expor resolucao de rotas por cli"
```

---

### Task 4: Integrar o protocolo ao workflow e documentar o uso

**Files:**
- Create: docs / LLM-ROUTER.md
- Modify: `AGENTS.md`
- Modify: `.pi/skills/small-model-execution/SKILL.md`
- Modify: `docs/WORKFLOW.md`
- Modify: `docs/MAP.md`
- Modify: `.prompts-manifest.json`

**Interfaces:**
- The orchestrator reads the route JSON before every `subagent_gate` dispatch.
- `subagent_gate` receives `model`, `fallbackModels` and `retrySafety` from `RouteDecision`; it never receives an omitted model for routed work.
- After a completed gate, the orchestrator can record `llm.route.completed` with route metadata only.

- [ ] **Step 1: Escrever o guia operacional**

Criar docs / LLM-ROUTER.md com os comandos e o contrato:

```markdown
## Resolver uma tarefa
npm run llm:route -- resolve --task P1-09

## Resolver contexto inferido pelo orquestrador
npm run llm:route -- resolve --context '{"taskId":"x","category":"feature","capability":"review","retrySafety":"read-only","source":"orchestrator-inference"}'

## Validar configuração
npm run llm:route:validate
```

O guia deve explicar que o resultado `model`, `fallbackModels` e `retrySafety` é copiado para `subagent_gate`; override manual e fallback devem ser auditáveis; `visual-inspection`/`vision-observer` são capacidades aceitas pelo contrato, mas não estão ativas nesta fase.

- [ ] **Step 2: Tornar o uso obrigatório nas instruções do agente**

Adicionar em `AGENTS.md` uma seção curta antes das regras de implementação:

```markdown
### Roteamento de subagentes
Antes de cada `subagent_gate`, resolva a tarefa com `npm run llm:route`. Use exatamente `model`, `fallbackModels` e `retrySafety` retornados; não escolha modelo inline nem omita `model` em uma tarefa roteada. Registre conclusão somente com metadados sanitizados.
```

- [ ] **Step 3: Atualizar a skill de execução de task-cards**

Em `.pi/skills/small-model-execution/SKILL.md`, inserir entre `task:state implementing` e a implementação:

```markdown
3. `npm run llm:route -- resolve --task <ID>` — obtenha `model`, `fallbackModels` e `retrySafety`.
4. Chame `subagent_gate` com esses três valores; preserve `may-write` em tarefas com efeitos externos.
5. Após o resultado, registre `llm.route.completed` sem prompt nem resposta integral.
```

Renumerar os passos seguintes sem duplicar a documentação do router; apontar para docs / LLM-ROUTER.md.

- [ ] **Step 4: Atualizar o workflow e o mapa**

Adicionar `llm:route` à tabela de scripts de `docs/WORKFLOW.md`, descrever o ponto de integração com `subagent_gate` na seção de subagentes e adicionar docs / LLM-ROUTER.md ao índice de `docs/MAP.md`.

- [ ] **Step 5: Atualizar hashes de prompts**

Run: `npm run prompt:manifest`

Expected: `.prompts-manifest.json` contém novos hashes para `AGENTS.md`, `docs/WORKFLOW.md` e `.pi/skills/small-model-execution/SKILL.md`; nenhuma entrada antiga é removida.

- [ ] **Step 6: Validar links, manifesto e instruções**

Run: `npm run prompt:check`

Expected: todos os hashes íntegros.

Run: `npm run verify-docs:strict`

Expected: zero broken links, órfãos ou referências inválidas.

- [ ] **Step 7: Commit**

```bash
DOC_GUIDE="docs/LLM-ROUTER.md"
git add "$DOC_GUIDE" AGENTS.md .pi/skills/small-model-execution/SKILL.md docs/WORKFLOW.md docs/MAP.md .prompts-manifest.json
git commit -m "docs: integrar llm router ao workflow de subagentes"
```

---

### Task 5: Verificação final, evidência e revisão

**Files:**
- Verify: `config/llm-router.json`
- Verify: scripts/lib/llm-router.mjs
- Verify: scripts/llm-route.mjs
- Verify: tests/unit/llm-router.test.ts
- Verify: tests/unit/scripts-llm-route.test.ts
- Verify: docs / LLM-ROUTER.md

**Interfaces:**
- Uses all contracts produced by Tasks 1–4.
- Produces command output and report evidence for review; no new behavior is introduced in the visual observer path.

- [ ] **Step 1: Executar a matriz de comandos do router**

```bash
npm run task:validate
npm run llm:route:validate
npm run llm:route -- resolve --task P1-09 --no-log
npm run llm:route -- resolve --context '{"taskId":"manual-1","category":"bugfix","capability":"debugging","retrySafety":"read-only","source":"orchestrator-inference"}' --no-log
```

Expected: cards válidos, configuração válida e duas decisões JSON com profiles coerentes (`coding` para P1-09 e `strong-reasoning` para debugging).

- [ ] **Step 2: Executar testes e verificações do projeto**

```bash
npm run check:fast
npm run build
npm run verify-docs:strict
npm run prompt:check
```

Expected: exit 0 em todos os comandos.

- [ ] **Step 3: Executar o gate completo**

Run: `npm run pre-pr`

Expected: relatório HTML atualizado, regras automáticas sem erros, testes unitários passando, build passando e working tree limpo depois de incluir artefatos gerados pertencentes ao workflow.

- [ ] **Step 4: Revisar requisitos contra a spec**

Confirmar manualmente:

- orquestrador continua fixo;
- precedência e normalização de categoria estão cobertas pelos testes;
- configuração inválida falha antes do dispatch;
- `subagent_gate` recebe o modelo explicitamente e preserva fallbacks/retry safety;
- eventos não contêm prompts/respostas/segredos;
- nenhuma captura de browser ou integração multimodal foi ativada;
- a configuração usa somente IDs confirmados.

- [ ] **Step 5: Commit de evidência final**

```bash
git status --short
git diff --check
git log --oneline -5
```

Expected: working tree limpo, sem erro de whitespace e histórico contendo os commits das tarefas.

---

## Self-review da cobertura

- **Spec §§1–3:** Tasks 1–4 definem e aplicam router, aliases, profiles, fallbacks e orquestrador fixo.
- **Spec §4:** Task 4 mantém meta-router, scoring, troca de sessão e multimodal fora do MVP.
- **Spec §§5–6:** Tasks 2–4 implementam `TaskContext`, normalização de task-card e fronteira CLI/dispatcher.
- **Spec §7:** Tasks 1–2 cobrem schema, aliases, profiles, defaults, routes, versão e expansão para IDs concretos.
- **Spec §§8–9:** Tasks 2–4 cobrem precedência, fail-closed, retry safety e passagem explícita ao gate.
- **Spec §10:** Task 3 cobre eventos de resolução/conclusão e sanitização.
- **Spec §11:** Tasks 2–5 cobrem precedência, schema, fallbacks, dispatch inválido, retry, auditoria e dry-run via `--no-log`/CLI.
- **Spec §12:** Task 4 documenta `visual-inspection`/`vision-observer` como contrato aceito, sem runtime visual ativo.
- **Spec §§13–14:** Task 5 impede antecipar scoring, health check, feedback loop e browser; a sequência executável está dividida em fatias.

### Checklist de consistência

- `resolveRoute` retorna `profile`, `model`, `fallbackModels`, `source` e `retrySafety`, exatamente os campos que a CLI e o `subagent_gate` consomem.
- A CLI aceita `TaskContext` normalizado ou task-card e aplica `feat → feature`, `fix → bugfix` e `test → chore` antes da resolução.
- `config/llm-router.schema.json` cobre forma; `validateRouterConfig` cobre referências cruzadas e vocabulários.
- O plano não cria integração de browser nem profile multimodal ativo.
- Não há dependência de runtime nova nem etapa com conteúdo indefinido.
