# Veredito do Council — Workflow para modelos LLM menores

**Data:** 2026-07-17  
**Escopo:** análise do repositório inteiro, workflow de agentes, guardrails, CI/CD, testes, documentação e skills.  
**Pergunta:** como aumentar significativamente a qualidade de execução de novos pedidos quando o agente usa um modelo LLM de menor porte?

## Evidências da linha de base

- `npm run build`: passou.
- `npx tsc --noEmit`: passou, mas não existe atalho npm nem etapa no CI.
- `npm test`: 50/50 passou.
- E2E completo: 54 passou, 9 foram pulados; execução levou cerca de 4m20s com 1 worker.
- Smoke E2E: 3/3 passou.
- `npm run lint`: 0 erros, 9 warnings; o CI usa `continue-on-error: true`.
- `npm run format:check`: falha em 43 arquivos; não é executado no CI.
- Bundle de produção: aproximadamente 1,39 MB precacheado; há chunks minificados acima de 500 kB; não existe budget que bloqueie regressão.
- `verify-docs`: 1 link quebrado em `docs/superpowers/plans/2026-07-15-context-optimization-plan.md`.
- `pre-pr --no-report --strict`: funciona fora da `main`, mas a execução em `main` é bloqueada corretamente pelo rule-04.
- O `pre-pr` npm padrão não usa `--strict`; portanto pode terminar com saída zero mesmo com regras falhando.
- `session:start` não pergunta a categoria apesar de a documentação prometer isso; a categoria não está persistida de forma confiável no handoff atual.
- O `docs/handoff.md` observado estava desatualizado em relação ao branch/commit real, um risco direto para um modelo com pouco contexto.
- Skills Superpowers estão em symlinks absolutos para um diretório da máquina do autor; podem quebrar em outro ambiente.
- O CI não executa o `pre-pr`, não executa typecheck/format check, tolera lint e não torna os guardrails de documentação obrigatórios.
- E2E usa um Supabase remoto, cria usuários reais, contém `waitForTimeout` frequente, pula o fluxo completo no CI e depende de dados/serviço externo.

## Diagnóstico comum

O projeto já tem muitos mecanismos, mas eles são predominantemente **procedimentos escritos** e **checagens textuais**. Um modelo menor precisa de menos memória implícita, menos escolhas abertas e mais contratos verificáveis. O problema principal não é falta de documentação ou de skills; é a distância entre o que a documentação promete e o que as ferramentas realmente impõem.

A estratégia recomendada é transformar o workflow em uma máquina de estados pequena e fail-closed:

```text
preflight → task-card → plan aprovado → implementação por fatias
→ verificação focada → verificação completa → revisão → PR
```

Cada transição deve produzir um artefato curto e uma validação executável. O agente não deve precisar inferir a próxima ação lendo dezenas de arquivos.

---

## Advisor: The Contrarian

**Análise:** O maior risco é adicionar ainda mais skills, documentos e scripts ao sistema atual. Isso pode melhorar a sensação de processo e piorar a execução: um modelo menor terá mais instruções concorrentes, mais nomes para memorizar e mais oportunidades de seguir a regra errada. O repositório já demonstra drift: `AGENTS.md`, `WORKFLOW.md`, `CONVENTIONS.md`, `README.md` e `handoff.md` não são uma única fonte de verdade; o handoff observado não correspondia ao branch atual; e o CI não executa várias garantias que a documentação chama de obrigatórias.

O segundo risco é confundir “passou” com qualidade. Os testes estáticos de regras são em boa parte tautológicos, o rule-19 usa heurísticas de texto e listas fixas de arquivos, o lint passa com warnings e o CI aceita isso, enquanto o E2E remoto é lento e parcialmente pulado. Antes de criar novas camadas, é necessário fazer os gates existentes realmente falharem quando um contrato é quebrado. Não recomendo instalar novas skills agora; recomendo uma skill local curta somente depois de o contrato do workflow ser estabilizado.

**Veredito:** Reformule — primeiro reduza contradições e faça os gates existentes serem obrigatórios; não faça um “mega-framework” de agentes.

## Advisor: First Principles Thinker

**Análise:** Um LLM menor trabalha melhor quando recebe: (1) objetivo observável, (2) arquivos permitidos, (3) restrições, (4) comandos de verificação e (5) critério de pronto. Hoje esses dados estão espalhados em prosa. O fluxo deve tratar o pedido como um contrato estruturado, não como uma conversa que o agente precisa lembrar.

A unidade correta de trabalho não é “sessão longa”, mas uma tarefa pequena com estado explícito. Um `task-card` versionado ou gerado deve conter categoria, objetivo, não-objetivos, critérios de aceite, arquivos autorizados, riscos/invariantes, testes exigidos e estado. Um script deve validar o card e a correspondência do diff. O contexto deve ser produzido sob demanda por risco: uma mudança de UI não precisa carregar invariantes financeiras; uma mutation financeira precisa carregar regras de saldo, testes e hooks relacionados.

**Veredito:** Faça — crie um contrato de tarefa mínimo, um pacote de contexto seletivo e uma máquina de estados com gates determinísticos.

## Advisor: The Expansionist

**Análise:** O investimento pode beneficiar não só modelos menores, mas qualquer agente e a manutenção humana. O projeto pode oferecer uma “trilha de contexto” reproduzível: mapa de domínio, grafo de dependências, contratos de dados, histórico de bugs, testes relevantes e último resultado de qualidade, todos gerados em um pacote compacto. Isso cria uma base para agentes locais, CI e revisão assistida.

Há oportunidades de alto retorno: classificação automática de risco do diff; seleção de testes por área; contratos de invariantes financeiras; budgets de bundle; verificação de provider/route; evidência obrigatória por mudança; e dashboards de taxa de falhas, retrabalho, flakiness e tempo de CI. O projeto também pode transformar feedback real de usuários em critérios de aceite, evitando que o agente implemente apenas o texto superficial do pedido.

**Veredito:** Faça em fases — a fundação deve ser pequena, mas deve deixar pontos de extensão para contexto por risco, métricas e testes selecionados.

## Advisor: The Outsider

**Análise:** Um novo agente não sabe qual documento é autoritativo, qual branch é correta, se `develop` ainda existe como alvo ou se `main` é o alvo de PR. Ele também não sabe se deve confiar em `QUALITY.md`, no handoff ou no resultado de um script. O README ainda descreve PRs para `develop`, enquanto o workflow usa `main`. Isso é uma fonte de erro que um modelo grande pode compensar com experiência, mas um modelo menor não compensará.

Também há sinais de infraestrutura frágil para um colaborador externo: symlinks de skills apontam para caminhos absolutos locais; o rule-23 confirma existência na máquina atual, não portabilidade; o CI de docs usa `continue-on-error`; relatórios são renomeados por workflows concorrentes; e a regra de relatório depende da data atual. O primeiro produto do workflow deve ser previsibilidade para um agente recém-chegado, não mais conteúdo.

**Veredito:** Reformule — estabeleça um manifesto único de workflow, remova contradições e torne o checkout autocontido antes de expandir capacidades.

## Advisor: The Executor

**Análise:** A execução viável é incremental. Em um primeiro PR, corrigir a fonte de verdade, adicionar `typecheck`, `format:check` e `pre-pr --strict` ao CI, remover `continue-on-error` de checks críticos, corrigir o bug do diff vazio no gerador de relatório e adicionar testes de contrato para scripts. Em seguida, criar `task-card`/`context-pack` e uma regra de escopo; depois fortalecer regras semânticas e separar E2E rápido de E2E completo.

Não é necessário adicionar dependência imediatamente. O repositório já possui TypeScript, Vitest e Playwright. O TypeScript Compiler API pode sustentar regras AST quando as heurísticas textuais não forem suficientes. Cada nova regra deve ter um teste negativo que falha com um fixture inválido e um teste positivo, não somente executar contra o estado atual. Mudanças financeiras devem continuar com testes puros e, quando possível, um teste de integração que verifica erro de Supabase e invariantes de reversal.

**Veredito:** Faça — em PRs pequenos, com ordem de risco e sem permitir que a automação se auto-declare verde.

---

## Peer review anônimo

### Revisão A

A recomendação de “mais contexto” só é segura se for seletiva. Um pacote grande recria o problema. O card deve apontar para arquivos, não copiar o repositório inteiro. O gate de escopo é mais importante que um mapa sofisticado.

### Revisão B

A prioridade correta é CI obrigatório. Enquanto `lint` pode falhar sem bloquear e `pre-pr` nem roda no CI, qualquer protocolo de agente é uma sugestão. A correção deve incluir branch protection/required checks no GitHub, não somente YAML.

### Revisão C

A qualidade dos testes precisa ser medida pela capacidade de detectar uma regressão. Os testes atuais de regras precisam de fixtures negativas. O full E2E remoto deve ser mantido como integração, mas não pode ser o único sinal de confiança nem pode mascarar skips.

### Revisão D

Skills adicionais não devem ser a primeira resposta. As skills Superpowers já estão presentes, mas os symlinks absolutos tornam o checkout não portável. Uma skill repo-local pequena e um comando `context:pack` terão mais efeito que instalar várias skills.

### Revisão E

A máquina de estados não deve bloquear trabalho exploratório legítimo. Deve haver dois modos explícitos: `explore` (somente leitura/análise) e `change` (card, plano, diff e gates). Isso evita que a rigidez seja contornada com `--no-verify`.

---

## Síntese do Chairman

**Consenso:** O projeto tem uma boa intenção de governança e muitos guardrails, mas o ganho para um modelo menor virá principalmente de **redução de ambiguidade e enforcement real**, não de mais texto. O estado atual permite que um agente menor receba um handoff desatualizado, leia fontes conflitantes, ignore uma etapa no CI e ainda obtenha um resultado “verde”.

**Veredito final:** **Reformule e faça em fases.** Não instalar mais skills agora e não criar um framework amplo. Primeiro consolidar a fonte de verdade e fechar os gaps de execução; depois adicionar um task-card/context-pack e somente então fortalecer análise semântica.

### Ordem recomendada por impacto

#### P0 — Confiança no próprio workflow

1. Criar um manifesto único de workflow (arquivo de configuração ou documento canônico), com categorias, estados, comandos obrigatórios, alvo de PR, artefatos e política de bypass.
2. Fazer `session:start` persistir categoria, objetivo e branch no handoff; falhar se categoria não for informada em modo de mudança.
3. Fazer o CI executar `npm run check` em modo estrito: typecheck, lint sem warnings críticos, format check, unit, rules, docs e build.
4. Remover `continue-on-error` de lint e verificações críticas; deixar apenas diagnósticos informativos explicitamente não bloqueantes.
5. Corrigir a detecção de diff vazio no `pre-pr` e a validação de relatório: avaliar mudanças entre base e HEAD, staged e working tree; não depender apenas da data atual.
6. Configurar required status checks e proteção de `main` no GitHub. Hooks locais são conveniência, não controle de qualidade.
7. Resolver o drift atual: handoff branch/commit, README `develop` versus `main`, link quebrado, referências/arquivamento de AGENDA e documentação que promete comandos inexistentes.

#### P1 — Contrato que um modelo menor consegue seguir

8. Adicionar `docs/task-card.schema.json` e `npm run task:validate`. Campos mínimos: `id`, `categoria`, `objetivo`, `naoObjetivos`, `criteriosAceite`, `arquivosPermitidos`, `riscos`, `testesObrigatorios`, `estado` e `baseBranch`.
9. Adicionar `npm run context:pack -- --task <id>` para gerar um pacote curto com: card, árvore apenas da área afetada, símbolos/exportações relevantes, contratos/invariantes, testes relacionados, último estado do CI e comandos de verificação.
10. Adicionar regra de escopo: o diff não pode alterar arquivos fora de `arquivosPermitidos` sem atualizar o card; arquivos sensíveis (`src/hooks/useDatabase`, `src/lib/accounts`, workflows, RLS) exigem confirmação/revisão adicional.
11. Definir estados simples e verificáveis: `explore`, `planned`, `implementing`, `verified`, `review`, `done`. Cada estado deve ter um comando de entrada/saída e uma evidência pequena em `docs/work/` ou artefato do CI.
12. Criar uma skill repo-local curta, por exemplo `.pi/skills/small-model-execution/SKILL.md`, somente após o contrato existir. Ela deve apontar para comandos e não repetir a documentação inteira.

#### P1 — Testes e guardrails com sinal real

13. Adicionar `npm run typecheck` ao `package.json` e CI.
14. Separar `check:fast` (format, typecheck, lint, unit, regras) de `check:pr` (fast + build + smoke/fluxos críticos) e `check:nightly` (full E2E remoto, acessibilidade, bundle e docs health).
15. Transformar os testes de regras em fixtures negativas/positivas: cada regra deve provar que bloqueia uma violação, não apenas imprimir o estado atual.
16. Substituir regras de regex frágeis por AST apenas onde o risco compensa: mutations de saldo, `invalidateQueries`, providers, imports órfãos e chamadas Supabase sem tratamento de erro.
17. Para invariantes financeiras, manter funções puras, adicionar casos de limites e garantir que falha de cada operação de banco não deixe o fluxo reportado como sucesso; considerar integração transacional antes de qualquer mudança de modelo de dados.
18. E2E: eliminar `waitForTimeout` onde possível por locators/assertions, marcar skips explicitamente no relatório, estabilizar seletores, separar smoke de integração e tratar o Supabase remoto como dependência de uma suíte dedicada.

#### P2 — Feedback de qualidade mensurável

19. Adicionar budgets de bundle, tempo de testes e flakiness; falhar apenas em regressões relevantes, com baseline versionado.
20. Fazer `QUALITY.md` consumir resultados reais de CI, não apenas existência de arquivos de workflow.
21. Medir: taxa de PR verde na primeira tentativa, falhas por categoria, tempo até verificação, reabertura/retrabalho, skips E2E e bypasses `--no-verify`.
22. Usar feedback do usuário como critério de aceite estruturado: sintomas, reprodução, resultado esperado, área e teste de regressão.

### O que não fazer agora

- Não instalar várias skills novas para compensar documentação ambígua.
- Não criar agentes especializados, factories, DSL ou servidor de contexto antes de medir o ganho do `task-card` e `context-pack`.
- Não tornar todo E2E remoto obrigatório em todo commit local; isso incentiva bypass.
- Não confiar em hook local como única barreira.
- Não aceitar `continue-on-error` em um check que o workflow chama de obrigatório.
- Não fazer uma mega-PR de workflow, docs, testes e arquitetura; entregar P0, P1 e P2 separadamente.

### Critério de sucesso do programa

Um modelo menor deve conseguir, a partir de `npm run session:start` + `npm run context:pack`, responder corretamente:

1. qual é a tarefa e o que está fora dela;
2. quais arquivos pode alterar;
3. qual regra/invariante se aplica;
4. quais testes precisa rodar;
5. qual evidência prova que terminou;
6. quando deve parar e pedir esclarecimento.

Se ele ainda precisar deduzir isso lendo cinco documentos longos, o workflow não foi simplificado o bastante.

**Próximo passo recomendado:** aprovar o escopo P0 como uma sequência de PRs pequenos. A implementação deve começar pelo contrato único + CI estrito + correção do estado/handoff, antes de criar novas skills ou regras sofisticadas.
