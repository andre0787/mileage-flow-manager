# Veredito do Council — KPIs de Processo, Router LLM e Sanitização

> **Data:** 2026-08-03
> **Categoria:** feature de workflow com frentes de chore/refactor
> **Solicitação:** investigar violações de KPIs de processo e criar guardrails; medir ativação/execução do router LLM, fallback e atribuição de skills; auditar duplicidade, redundância, órfãos e sujeira e sanitizar com segurança até produção.

## Limitação operacional do Council

Foram tentadas duas execuções via `subagent_gate`: primeiro o quórum de cinco advisors com rótulos específicos e depois uma tentativa com o agente genérico suportado. Ambas falharam em **pré-lançamento**, com `0/5` e `0/1` sucessos, porque o ambiente atual não expôs um responder do `pi-subagents`. Nenhuma análise independente foi recebida. As cinco rotas foram registradas como `llm.route.resolved` e suas conclusões como `llm.route.completed` com `status: failed` e `failureKind: subagent_prelaunch`; não são apresentadas como consenso de subagentes.

O documento abaixo é a síntese estruturada do orquestrador, baseada no código, nos testes, nos logs e nas regras atuais. Essa limitação deve ser tratada como dado do próprio KPI do router.

## Evidências de baseline

- `public/kpi-data.json` mostra, em agosto de 2026, 74 execuções de pre-pr: 50 pass, 24 fail e taxa de 67,6%.
- As violações históricas mais frequentes são `rule-10-clean` (14), `rule-26-session-started` (7) e `rule-27-council-veredict` (3).
- O log possui 177 eventos `pre-pr`, 24 `rule:fail`, somente 2 ativações de gate e, antes desta análise, não possuía conclusões do router para as cinco rotas recém-resolvidas.
- As regras 14, 15, 16, 18, 23, 31 e 32 passam no estado atual; isso prova que os checks existentes não encontram sujeira nesses recortes, não que a auditoria total esteja concluída.
- O baseline funcional observado foi: 326 testes unitários passando, typecheck sem erros, lint sem erros mas com 10 warnings, format check passando, verify-docs estrito passando, outcome grader 100%.
- `npm audit --omit=dev` reporta duas vulnerabilidades high em `react-router` transitivo; a correção sugerida pelo npm é breaking (`react-router-dom@7.11.0`) e não deve ser aplicada cegamente nesta sanitização.
- O evento atual `llm.route.resolved` registra a decisão planejada; `llm.route.completed` registra apenas modelo/tentativa/status/duração/falha e não registra `skills`, nem diferencia explicitamente modelo solicitado de modelo efetivo.

## Advisors

### Advisor: The Contrarian (síntese)

O maior risco é transformar “sanitização total” em deleção em massa. Logs históricos, relatórios, arquivos gerados e documentos arquivados têm funções diferentes; apagar por nome, tamanho ou baixa frequência pode destruir evidência necessária para medir as violações que motivaram o pedido. A limpeza deve começar por inventário somente leitura, produzir uma lista de candidatos e só remover algo quando uma análise de referências demonstrar que não é entry point, fonte histórica ou artefato de CI.

Também é perigoso chamar `llm.route.resolved` de ativação efetiva. Uma rota pode falhar antes do subagente iniciar, como aconteceu nesta sessão, ou pode usar um fallback. O KPI precisa separar resolução, tentativa, conclusão, falha de pré-lançamento e fallback real; caso contrário a dashboard premiará um workflow que apenas planeja chamadas.

**Veredito:** Reformule e faça em fases.

**Recomendações:** falhar fechado em guardrails críticos; não armazenar prompts, respostas, tokens ou credenciais; preservar histórico; bloquear limpeza destrutiva sem relatório e teste de referência.

### Advisor: First Principles Thinker (síntese)

Um KPI só é confiável quando sua definição, fonte e cálculo são verificáveis. Para violações, a unidade canônica deve ser uma execução de regra com identificador estável, status e contexto de branch/commit. Para o router, a unidade canônica deve ser uma tarefa: uma resolução planejada, zero ou mais tentativas e uma conclusão. O modelo efetivamente usado é o modelo da conclusão; fallback é a diferença entre o modelo primário resolvido e o modelo efetivo, ou uma tentativa posterior em um candidato declarado.

A atribuição skill→LLM não pode ser inferida de texto livre. O dispatcher deve fornecer uma lista normalizada de skills na resolução/conclusão e a validação deve rejeitar campos desconhecidos, vazios, duplicados ou potencialmente sensíveis. A ausência de conclusão não é sucesso nem fallback: é “não observado”, e deve aparecer no KPI para revelar gaps do workflow.

**Veredito:** Faça, mas com contrato de eventos primeiro.

**Recomendações:** estender o schema do router e os testes; manter `resolved`, `attempt` e `completed` correlacionáveis por `taskId`; gerar agregados determinísticos no Node; exibir `N/A` quando não medido.

### Advisor: The Expansionist (síntese)

Há oportunidade de fechar o ciclo de melhoria sem criar uma plataforma nova: o mesmo JSONL pode alimentar taxas de pre-pr, violações, qualidade, rotas, falhas, fallback e matriz de skills. Os agregados úteis são taxa de conclusão do router, taxa de fallback, falhas por modelo/provider, distribuição por capability/categoria e contagem de tarefas sem conclusão. A matriz skill→modelo deve permitir descobrir que uma skill está concentrando falhas ou sendo sempre encaminhada ao perfil errado.

A evolução deve ser incremental. Primeiro tornar os eventos verdadeiros e os guardrails executáveis; depois usar os dados para ajustar perfis e convenções. Não implementar scoring automático, meta-router, custo/token ou banco externo antes de existir uma série temporal confiável. O dashboard deve mostrar a data da geração e a cobertura do dado para evitar interpretações indevidas.

**Veredito:** Faça em fatias pequenas.

**Recomendações:** adicionar agregados mensais versionados; incluir contagens e percentuais, não apenas médias; registrar a versão da configuração; manter o app desacoplado via `public/kpi-data.json`.

### Advisor: The Outsider (síntese)

Um colaborador novo não conseguiria responder, olhando apenas a dashboard, se uma rota foi escolhida, executada ou usada como fallback. Também não saberia se “0 gates” significa que ninguém declarou gates ou que o instrumento não capturou eventos. O contrato deve tornar esses estados explícitos e os comandos devem produzir uma saída curta que permita reproduzir a contagem.

A auditoria atual passa vários checks, mas isso só cobre os padrões que as regras conhecem. “Arquivo órfão” não é sinônimo de “arquivo não importado” em entry points, fixtures, migrations, scripts internos ou documentação histórica. A sanitização deve ter modo `audit` e modo `check`; o primeiro lista achados e o segundo falha somente em contratos que conseguem ser provados de forma determinística.

**Veredito:** Faça, com linguagem de cobertura e limitações explícitas.

**Recomendações:** não chamar uma varredura heurística de limpeza total; incluir fixtures e arquivos gerados na taxonomia; testar o auditor com repositórios fixture; documentar exceções permitidas.

### Advisor: The Executor (síntese)

A execução segura deve ser dividida em três subprojetos dependentes: (A) auditoria de violações e guardrails de processo; (B) contrato/telemetria do router e novos KPIs; (C) auditoria e sanitização segura. A frente B depende de um evento de conclusão extensível; a frente C deve começar e terminar com inventários e usar a suíte existente para provar que o comportamento da aplicação permaneceu inalterado.

Cada mudança de comportamento deve seguir INTENT + TDD. Cada novo script deve ter atalho npm, teste unitário e integração no pre-pr quando for um guardrail imutável. A saída precisa passar por `pre-pr`, relatório HTML, review e testes E2E locais/produção aplicáveis. O deploy deve permanecer no fluxo protegido de PR para `main`; não se deve fazer push/merge/deploy silencioso.

**Veredito:** Faça em fases, começando por evidência e contrato.

**Recomendações:** não misturar a atualização breaking de `react-router` com a sanitização sem plano próprio; tratar o problema de subagentes indisponíveis como um KPI e blocker de validação delegada, não como motivo para fabricar sucesso.

## Extended Thinking

O tema cruza observabilidade, CI, segurança de dados, UX da dashboard e limpeza estrutural, com risco de regressão e custo de implementação acima de uma tarefa isolada. O extended thinking independente dos advisors não pôde ser executado porque o harness falhou antes do lançamento. A síntese do orquestrador aplicou uma análise estendida explícita aos trade-offs: preservar evidência versus sanitizar, medir intenção versus execução e aumentar cobertura versus aumentar complexidade.

## Síntese do Chairman

**Consenso operacional:** o pedido é válido, mas não deve ser implementado como uma grande limpeza ou como mais uma camada de documentação. Primeiro é preciso estabilizar o contrato de evidência e os guardrails; em seguida medir o router de forma honesta; por fim sanitizar apenas achados comprovados. A base existente é funcional, porém há violações reais de processo e um gap de telemetria de execução/fallback/skills.

**Veredito final:** **REFORMULE E FAÇA EM FASES**.

**Recomendação única:** executar três planos revisáveis, nesta ordem:

1. **Observabilidade e guardrails:** normalizar eventos de violação, detectar pre-pr/session/council inconsistentes, adicionar regras npm que falhem de forma determinística e cobrir os casos com fixtures.
2. **Router LLM observável:** ampliar `resolved/completed` com execução efetiva, fallback e `skills`, criar KPI mensal com cobertura/ausência de conclusão e adicionar visualização no `/kpi` sem expor conteúdo sensível.
3. **Sanitização segura:** rodar auditoria read-only abrangente; corrigir apenas duplicatas/órfãos/sujeira com referência e testes; tratar vulnerabilidades de dependência em mudança separada se houver downgrade/upgrade breaking.

**Critério de avanço:** nenhuma fase altera comportamento sem teste RED observado, INTENT alinhado, review e `pre-pr` verde. A fase de produção só pode afirmar funcionamento depois de CI, smoke E2E e health check do deploy observados.

**Próximos passos:** brainstorming com aprovação do desenho; specs e planos separados por subprojeto; branch nova baseada em `origin/main`; implementação TDD; revisão por tarefa; PR para `main`; deploy protegido.
