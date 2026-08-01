# Veredito do Council — Router declarativo de modelos LLM

**Data:** 2026-08-01  
**Escopo:** estratégia de roteamento de modelos para o workflow do MilesControl; nenhuma implementação nesta etapa.  
**Pergunta:** devemos manter um orquestrador LLM fixo e selecionar automaticamente modelos diferentes para subagentes conforme a tarefa?

## Contexto observado

- O workflow já possui categorias `feature`, `bugfix`, `docs`, `refactor` e `chore`.
- O `subagent_gate` aceita `model` e `fallbackModels` por tarefa.
- Existe um skill para execução de task-cards por modelos menores.
- O modelo do agente principal é definido no início da sessão; trocá-lo no meio do fluxo adicionaria perda de contexto e acoplamento ao harness.
- A necessidade principal é equilibrar qualidade, custo e latência sem tornar o workflow não determinístico.

> **Nota operacional:** foram tentadas execuções do council via `subagent_gate` (quórum de cinco advisors e uma tentativa de diagnóstico), mas todas falharam em pré-lançamento porque o ambiente atual não expôs um responder do `pi-subagents`. As análises abaixo são a revisão estruturada desta sessão e não devem ser interpretadas como respostas independentes de subagentes.

## Advisors

## Advisor: The Contrarian

**Análise:** Um router pode virar apenas mais uma camada de configuração que o agente precisa entender. Se a taxonomia de tarefas crescer sem controle, uma alteração simples passará por categoria, capacidade, alias, fallback e política de retry antes de executar. O risco maior não é escolher o modelo “errado”, mas o workflow deixar de ser legível e falhar silenciosamente para um modelo padrão.

A primeira versão precisa ser fail-closed: aliases resolvidos, precedência única, fallback explícito e registro da decisão. O router não deve inferir um modelo novo, trocar o orquestrador ou repetir tarefas com efeitos colaterais. Sem esses limites, a economia de custo pode ser anulada por retrabalho e diagnósticos difíceis.

**Veredito:** Reformule — faça apenas um router declarativo, pequeno e auditável.

## Advisor: First Principles Thinker

**Análise:** O problema mínimo é separar duas responsabilidades: o orquestrador preserva contexto e coordena; o executor recebe uma tarefa delimitada e precisa do modelo adequado. Não é necessário um sistema inteligente para resolver a rota. Um `TaskContext` normalizado, uma tabela de regras e uma cadeia de candidatos já resolvem a seleção de forma reproduzível.

A categoria sozinha é ampla demais, e o prompt sozinho é instável demais. A fonte principal deve ser metadado explícito no task-card; a inferência do orquestrador serve somente para preencher uma capacidade ausente, retornando ao default da categoria quando houver incerteza. O critério de sucesso é a mesma entrada produzir a mesma decisão e a falha de uma rota não ser confundida com sucesso da tarefa.

**Veredito:** Faça — com resolução determinística e contrato estruturado.

## Advisor: The Expansionist

**Análise:** A tabela inicial pode evoluir para um catálogo de capacidades sem exigir uma reescrita. Aliases desacoplam regras de IDs de providers, enquanto eventos de roteamento permitem medir qualidade, custo, latência, taxa de fallback e retrabalho por tipo de tarefa. Isso pode apoiar budgets, health checks, scoring e experimentos controlados no futuro.

A expansão deve ser orientada por evidência. Primeiro registrar decisões e resultados; depois adicionar seleção por disponibilidade/capacidade; só então considerar um classificador dedicado ou feedback automático. O router não deve coletar prompts nem credenciais para obter métricas.

**Veredito:** Faça em fases — MVP declarativo com pontos de extensão claros.

## Advisor: The Outsider

**Análise:** Um colaborador precisa conseguir responder três perguntas sem conhecer a implementação: qual tarefa está sendo executada, por que determinado modelo foi escolhido e o que acontece se ele estiver indisponível. A configuração deve estar versionada, os aliases devem ser legíveis e um override humano deve ser possível e rastreável.

Também é importante não prometer “automático” quando a tarefa não traz metadados. O sistema deve indicar que usou o default ou a inferência, em vez de esconder a decisão. Configuração inválida, alias ausente e todos os fallbacks indisponíveis devem interromper a delegação com uma mensagem acionável.

**Veredito:** Faça — desde que a decisão seja visível e os defaults sejam seguros.

## Advisor: The Executor

**Análise:** A implementação é viável sem dependência nova. Um resolver puro pode validar a configuração, aplicar a precedência `override → categoria/capacidade → categoria → global`, devolver modelo e fallbacks e ser integrado ao ponto que já chama `subagent_gate`. O orquestrador continua fixo; o dispatcher não decide política.

Os testes devem cobrir precedência, aliases, configuração incompleta, fallback transitório e a diferença entre tarefas read-only e tarefas com efeitos colaterais. A primeira entrega pode incluir modo de previsão/log antes de ativar o roteamento automático, reduzindo o risco de bloquear o workflow.

**Veredito:** Faça — em fatias pequenas, começando pelo contrato e pelos testes do resolver.

## Peer review anônimo

- A rota não pode depender apenas de classificação livre; o task-card deve ser a fonte de verdade quando existir.
- Fallback não pode mascarar erro de configuração. Provider indisponível e alias inexistente são problemas diferentes.
- `retrySafety=read-only` precisa ser preservado, pois repetir uma tarefa de escrita pode duplicar efeitos.
- Logs devem registrar a decisão e o resultado, mas nunca prompts completos, tokens ou credenciais.
- O MVP não deve introduzir troca de modelo do orquestrador, scoring dinâmico ou um segundo LLM para decidir a rota.

## Addendum pós-revisão

Após o council, foi identificada uma extensão útil para tarefas de validação de UI: um perfil multimodal dedicado pode analisar screenshots capturadas pelo runtime/browser e devolver evidência textual ao agente de código. A extensão foi registrada na spec como `visual-inspection`/`vision-observer`, mas permanece fora do MVP. A recomendação é controlar a captura com Playwright ou ferramenta equivalente e manter o provider multimodal intercambiável.

## Síntese do Chairman

**Consenso:** a separação entre orquestrador fixo e executores roteados resolve o problema com menos risco que a troca de modelo da sessão. O roteamento deve ser híbrido na entrada, mas determinístico na resolução: metadados explícitos primeiro, categoria como default e inferência apenas como fallback.

**Veredito final:** **Faça em fases.** Comece com um router declarativo versionado, aliases de modelos, fallbacks explícitos, política de retry segura, auditoria e testes puros. Adie scoring dinâmico e meta-router LLM até haver métricas que justifiquem a complexidade.

**Próximos passos:** aprovar a spec de design; depois criar um plano de implementação para contrato/configuração, resolver, integração com `subagent_gate`, observabilidade e testes.

**Extended Thinking Usado:** não foi executado; a infraestrutura de subagentes falhou antes do lançamento.
