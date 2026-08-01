# Especificação de Design — Router declarativo de modelos LLM

**Data:** 2026-08-01  
**Status:** proposta de design; implementação não iniciada  
**Categoria:** feature de workflow  
**Council:** `docs/council/2026-08-01-llm-model-router-veredito.md`

## 1. Resumo

Adicionar ao workflow um router declarativo que escolha o modelo dos subagentes conforme a tarefa, mantendo o agente principal em um modelo fixo durante a sessão.

A decisão combina a categoria do workflow com a capacidade específica da tarefa. Task-cards fornecem metadados explícitos; quando eles não existirem, o orquestrador pode inferir uma capacidade permitida, mas a resolução final continua determinística. O router retorna um modelo principal e fallbacks para o dispatcher chamar o `subagent_gate`.

## 2. Problema e objetivo

Hoje o modelo usado por uma tarefa delegada depende da decisão manual do agente. Isso dificulta equilibrar qualidade, custo e latência, além de tornar o comportamento pouco auditável.

O objetivo é tornar explícito e reproduzível:

- qual perfil de modelo uma tarefa exige;
- qual modelo foi escolhido e quais fallbacks existem;
- por que a rota foi escolhida;
- o que acontece quando um provider falha;
- como medir a qualidade das decisões antes de sofisticar o sistema.

## 3. Decisões aprovadas

1. **Orquestrador fixo:** a sessão principal não troca `PI_MODEL` nem executa `/model` automaticamente.
2. **Subagentes roteados:** somente a delegação recebe uma decisão de modelo.
3. **Configuração declarativa:** regras e aliases ficam versionados no repositório, separados de credenciais.
4. **Roteamento híbrido:** a categoria fornece o default; a capacidade/fase sobrescreve quando conhecida.
5. **Metadados primeiro:** o task-card é a fonte preferencial; inferência é fallback e deve ser registrada.
6. **Política equilibrada:** tarefas de raciocínio, debugging e revisão podem usar perfis fortes; tarefas rotineiras podem usar perfis eficientes.
7. **Fallback explícito:** cada rota tem candidatos declarados; não há fallback silencioso para um modelo não configurado.
8. **Retry seguro:** tarefas read-only podem usar retry limitado; tarefas com efeitos colaterais mantêm `retrySafety=may-write`.
9. **Observabilidade desde o início:** toda resolução e todo fallback produzem evento sem armazenar segredos ou prompts completos.

## 4. Fora do escopo inicial

- Trocar o modelo do orquestrador no meio da sessão.
- Um meta-router baseado em outra chamada LLM.
- Scoring dinâmico por preço, latência ou disponibilidade.
- Alterações no schema do Supabase ou na interface do MilesControl.
- Armazenar chaves, tokens ou credenciais no repositório.
- A/B testing ou ajuste automático de rotas sem métricas de base.
- Captura de browser e análise multimodal no MVP.

## 5. Arquitetura

```text
Orquestrador fixo
  └─ cria TaskContext a partir do pedido/task-card
       └─ Router declarativo resolve RouteDecision
            └─ Dispatcher chama subagent_gate(model, fallbackModels)
                 └─ Subagente executa a tarefa
                      └─ resultado e eventos retornam ao orquestrador
```

### Responsabilidades

- **Orquestrador:** interpreta o pedido, cria o contexto, delega e integra o resultado. Não contém a tabela de modelos inline.
- **TaskContext:** representa a tarefa normalizada.
- **Router:** valida a configuração e calcula a rota sem fazer uma chamada LLM.
- **Dispatcher:** transporta a decisão para `subagent_gate`; não escolhe outro modelo por conta própria.
- **Configuração:** define aliases, perfis, defaults e regras.
- **Auditoria:** registra decisão, tentativa, fallback e resultado no mecanismo de tracking existente.

Uma configuração inválida deve impedir a delegação antes de criar um subagente.

## 6. Contrato de tarefa

O contexto normalizado deve conter, no mínimo:

```text
TaskContext {
  taskId: string
  category: feature | bugfix | docs | refactor | chore
  capability?: analysis | planning | implementation | debugging | testing | review | documentation | visual-inspection
  phase?: string
  modelProfileOverride?: string
  retrySafety: read-only | may-write
  source: task-card | orchestrator-inference | manual
}
```

`category` é obrigatória. `capability` é obrigatória quando o task-card a conhece; sem ela, o orquestrador pode escolher uma capacidade do vocabulário permitido. Se não houver confiança suficiente, usa-se o default da categoria.

O task-card não deve precisar conhecer IDs concretos de providers. Um override manual de perfil/alias é permitido, mas precisa passar pela mesma validação de alias/candidato e ser registrado como `manual`. A inferência do orquestrador não cria uma chamada adicional de LLM: ela apenas preenche o campo de capacidade antes da resolução.

## 7. Configuração e resolução

A configuração proposta fica em `config/llm-router.json`. Ela terá seis blocos:

- **`aliases`:** nomes estáveis que apontam para IDs reais de modelos;
- **`profiles`:** perfis legíveis (`strong-reasoning`, `coding`, `efficient`, `independent-review`, `vision-observer`) com `primary` e `fallbacks`, ambos referenciando aliases;
- **`categoryDefaults`:** perfil padrão para cada categoria;
- **`routes`:** regras opcionais de `category + capability`;
- **`globalDefault`:** perfil usado quando não há default específico da categoria;
- **`version`:** versão do contrato de configuração.

IDs reais de modelos são dados de configuração, não regras de negócio. Credenciais continuam no mecanismo de autenticação do provider. A resolução expande aliases para devolver IDs concretos ao dispatcher.

A precedência obrigatória é:

1. override manual validado;
2. `modelProfileOverride` do task-card;
3. regra `category + capability`;
4. default da categoria;
5. default global;
6. erro explícito se nenhum perfil resolvível existir.

O `RouteDecision` deve retornar:

```text
RouteDecision {
  profile: string
  model: string
  fallbackModels: string[]
  source: manual | task-card | category-capability | category-default | global-default
  retrySafety: read-only | may-write
}
```

A configuração é carregada e validada no início da sessão. A versão carregada acompanha os eventos; alterações de configuração entram em uma nova sessão, evitando que duas tarefas da mesma sessão usem políticas incompatíveis.

## 8. Fluxo operacional

1. `session:start` identifica a categoria da sessão, mas não troca o modelo principal.
2. O orquestrador recebe um task-card ou normaliza o pedido em um `TaskContext`.
3. O router valida o contexto e resolve o perfil pela precedência definida.
4. O dispatcher chama `subagent_gate` com `model`, `fallbackModels` e `retrySafety`.
5. Em falha transitória do provider, o gate percorre a cadeia de candidatos dentro do limite configurado.
6. O resultado do subagente volta ao orquestrador junto com a rota efetiva.
7. A resolução e o resultado são registrados para análise posterior.

Nenhum passo altera o modelo da sessão principal.

## 9. Erros e segurança operacional

- **Categoria ou capacidade inválida:** falhar antes da chamada ao subagente e informar os valores aceitos.
- **Alias não resolvido ou configuração inválida:** falhar fechado; não usar o modelo padrão do harness por acidente.
- **Capacidade ausente:** usar default da categoria e registrar `category-default`.
- **Provider indisponível:** tentar apenas os fallbacks declarados e compatíveis.
- **Todos os candidatos falham:** devolver erro estruturado ao orquestrador; não declarar a tarefa concluída.
- **Tarefa com escrita/efeito externo:** não repetir automaticamente após o lançamento; preservar `may-write`.
- **Override manual:** aceitar somente em fronteira de tarefa e registrar autor/origem, modelo e motivo quando disponível.
- **Segredos:** configuração e eventos não podem conter API keys, tokens, prompts completos ou respostas integrais.

## 10. Observabilidade

Usar o tracking já existente em `docs/tracking/events.jsonl`, com eventos equivalentes a:

- `llm.route.resolved`: task ID, categoria, capacidade, perfil, modelo, fallbacks, fonte e versão da configuração;
- `llm.route.completed`: modelo efetivo, tentativa, provider, status, duração e tipo de falha/fallback.

O registro deve permitir responder: qual rota foi escolhida, quantos fallbacks ocorreram e em quais categorias as tarefas falham. Custos e tokens só entram quando o provider expuser esses dados sem exigir armazenamento de conteúdo sensível.

## 11. Testes e critérios de aceitação

O plano de implementação deverá incluir:

- testes unitários do resolver para cada nível de precedência;
- validação de schema para configuração, aliases duplicados e perfis sem modelo;
- testes de fallback e distinção entre falha transitória e configuração inválida;
- teste de que nenhuma chamada ao dispatcher ocorre com rota inválida;
- teste de que `retrySafety=may-write` não gera retry automático pós-lançamento;
- teste de integração do dispatcher verificando `model` e `fallbackModels` enviados ao `subagent_gate`;
- teste de auditoria sem prompts ou credenciais nos eventos;
- modo de previsão/dry-run para verificar rotas antes da ativação automática.

A implementação só será considerada pronta quando:

1. o mesmo `TaskContext` normalizado e a mesma configuração produzirem a mesma `RouteDecision`;
2. um override explícito vencer defaults sem alterar o orquestrador;
3. uma configuração inválida falhar antes de criar subagente;
4. um provider transitório puder usar fallback declarado;
5. uma tarefa sem metadado suficiente cair em default visível, não em comportamento oculto;
6. todas as decisões e resultados relevantes forem auditáveis;
7. os testes do router e o `pre-pr` passarem.

## 12. Extensão futura: observação multimodal

Quando uma tarefa exigir validação visual, o router poderá usar a capacidade `visual-inspection` e o perfil `vision-observer`, sem trocar o modelo do orquestrador nem enviar imagens a um modelo que não suporte visão.

### Fluxo recomendado

```text
Agente de código solicita evidência visual
  → runtime/browser acessa o servidor local
  → Playwright captura screenshot e metadados determinísticos
  → modelo multimodal analisa a evidência
  → observação estruturada retorna ao agente de código
  → agente continua ou corrige a implementação
```

A captura deve pertencer ao runtime controlado do workflow, não depender de o provider “descobrir” o `localhost` sozinho. O modelo multimodal recebe a imagem, URL, viewport, passos executados e contexto mínimo da tarefa; não precisa editar código.

O resultado deve ser um artefato textual estruturado contendo:

- URL, viewport e ambiente;
- passos executados;
- comportamento esperado e observado;
- divergências visuais;
- erros relevantes de console/rede quando disponíveis;
- referências às screenshots;
- nível de confiança e limitações da observação.

A chamada visual só deve ocorrer quando o critério de aceite exigir evidência visual. Se o runtime, a sessão ou o modelo multimodal estiver indisponível, o workflow deve registrar “validação visual não executada” e parar ou solicitar validação humana; nunca declarar a validação como aprovada.

Pré-requisitos para essa fase são: browser runner com acesso ao servidor local, readiness check, autenticação/fixtures controlados, armazenamento seguro dos artefatos, redaction de dados sensíveis e limite de tempo/custo. A integração deve permanecer agnóstica ao provider; Gemini é uma opção de implementação, não um contrato do router.

## 13. Evolução futura

A primeira versão deve deixar interfaces para, mas não implementar ainda:

1. catálogo de capacidades, contexto, custo e latência por modelo;
2. seleção dinâmica por disponibilidade, orçamento e SLA;
3. health check e circuit breaker por provider;
4. classificador dedicado somente quando a inferência do orquestrador for insuficiente;
5. feedback loop usando qualidade, falhas, retrabalho e custo;
6. experimentos controlados entre perfis;
7. perfis alternativos de orquestrador, sem troca automática dentro de uma sessão até existir uma necessidade comprovada.

Essas evoluções exigem métricas do MVP e não devem ser antecipadas por abstrações sem consumidor.

## 14. Sequência de implementação proposta

A implementação futura deve ser dividida em fatias revisáveis:

1. contrato, schema e configuração declarativa;
2. resolver puro com testes de precedência e falha;
3. integração do dispatcher com `subagent_gate`;
4. eventos de resolução/execução e dry-run;
5. integração com task-cards e validação do workflow;
6. verificação completa e documentação operacional.

Esta spec descreve o comportamento desejado; não autoriza ainda alterações de código, configuração de providers ou troca do modelo principal.
