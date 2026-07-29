# Full Fable Method Skill — Design Spec

> Adaptação do [Fable Method](https://github.com/Sahir619/fable-method) (7-step loop)
> para o MilesControl: uma skill unificada que costura categorias, gates, workflow e scripts
> existentes num único fluxo de desenvolvimento.

---

## Motivação

Atualmente o conhecimento está fragmentado em múltiplos documentos e skills:
- `AGENTS.md` define categorias e lazy loading
- `docs/WORKFLOW.md` define o processo canônico
- `docs/fable-gates.md` documenta os 3 gates isoladamente
- `.pi/skills/` contém skills especializadas (council-to-superpowers, systematic-debugging, etc.)
- `scripts/` contém validações (pre-pr-check.mjs, rule-*.mjs)

Uma skill unificada **Fable Method** costura tudo isso num único fluxo de 7 passos,
reduzindo a carga cognitiva do agente e garantindo que nenhum gate seja pulado.

## Escopo

**O que é:**

- `.pi/skills/fable-method/SKILL.md` — skill principal (~200-250 linhas)
  - 7 passos do Fable Method, cada um mapeado a ferramentas concretas do projeto
  - Referências diretas aos 3 gates (INTENT, TWINS, AUTH) com links para `docs/fable-gates.md`
  - Referências ao workflow canônico em `docs/WORKFLOW.md`
  - Caminhos para scripts de validação (`scripts/rules/rule-*.mjs`, `scripts/pre-pr-check.mjs`)
  - Tabela de navegação rápida por categoria
  - Exemplos comprimidos (como no original) adaptados ao MilesControl

**O que NÃO é:**
- Não substitui skills existentes — referência-as
- Não modifica o workflow atual — integra-se a ele
- Não cria novos scripts — usa os existentes

## Arquitetura

### Mapeamento Fable → MilesControl

| Passo Fable | Ação | Ferramentas MilesControl |
|---|---|---|
| **0. Classify** | Identificar categoria da tarefa | Sistema de categorias (feature/bugfix/docs/refactor/chore) em `AGENTS.md`; `npm run session:start` |
| **1. Define done** | Definir verificação de conclusão | Checklist de tarefa + `npm run pre-pr` como verificação Objective |
| **2. Evidence** | Coletar evidências antes de agir | Lazy loading por categoria; navegação Serena-First; council-to-superpowers (se feature) |
| **3. Decide** | Comprometer-se com 1 recomendação | Decisão do council ou análise direta; **🔐 AUTH Gate** para ações outward-facing |
| **4. Act** | Editar cirurgicamente | **🧠 INTENT Gate** antes de qualquer edição; edições precisas (edit); standing prohibitions |
| **5. Verify** | Verificar por observação | `npm run pre-pr` (build + test + rules + docs); **🔁 TWINS Check** se bug fix |
| **6. Report** | Reportar resultado primeiro | Relatório HTML do pre-pr + outcome-first + `AUTH:` / `PENDING:` lines |

### Fluxo de decisão

```
ask → 0 classify ──→ 1 define done ──→ 2 evidence ──→ 3 decide ──→ 4 act ──→ 5 verify ──→ 6 report
       categoria         pre-pr check      lazy load docs    AUTH       INTENT      pre-pr       outcome-
       + session:start   é a meta          + serena-first    Gate       Gate        + TWINS      first
```

### Integração com gates existentes

| Gate | Onde entra | Formato obrigatório |
|---|---|---|
| 🧠 INTENT | Step 4 (Act), antes de editar | `INTENT: código faz X; teste espera Y; spec diz Z` |
| 🔁 TWINS | Step 5 (Verify), após bug fix | `TWINS: searched <padrão> — found <N> locais` |
| 🔐 AUTH | Step 3 (Decide), se outward-facing | `AUTH: usuário disse "<citação>"` |

### Triviality Gate

Adaptado do Fable Method: se a tarefa for 1 arquivo, <10 linhas, sem busca necessária → fazer direto, pular Steps 2-3, verificar e reportar em 2 frases.

### Categorias e lazy loading

Mesma tabela de `AGENTS.md`:

| Tipo | Carregar |
|------|----------|
| feature | `WORKFLOW.md` + `CONVENTIONS.md` (seções relevantes) |
| bugfix | `DEBUG.md` + `CONVENTIONS.md` (seção bugs) |
| docs | (só AGENTS.md) |
| refactor | `CONVENTIONS.md` + `ARCHITECTURE.md` |
| chore | (só AGENTS.md) |

## Formato da skill

SKILL.md em `/home/andreluiz0787/repos/mileage-flow-manager/.pi/skills/fable-method/SKILL.md`

Estrutura:
1. **Frontmatter**: name, description, trigger
2. **Seção inicial**: propósito, quando usar, relação com outras skills
3. **Os 7 passos**: cada um com descrição concisa + ferramentas do projeto + gates aplicáveis
4. **Triviality Gate**: definição e atalho
5. **Tabela de categorias**: lazy loading
6. **Standing Prohibitions**: herdadas do Fable Method + específicas do projeto
7. **Exemplos comprimidos**: adaptados ao MilesControl

## Exemplos comprimidos (da skill)

**Tarefa: "Adicionar validação de email no formulário de cadastro"**
Step 0: feature (categoria). Step 1: pre-pr passa, testes do formulário verdes. Step 2: ler CONVENTIONS.md (seção UI), ler componente existente. Step 3: decisão sem council (simples). Step 4: INTENT antes de editar. Step 5: pre-pr (build + test + rules). Step 6: report.

**Bug: "Saldo aparece negativo após lançamento"**
Step 0: bugfix. Step 1: saldo nunca negativo, testes de mutação passam. Step 2: ler DEBUG.md, ler código de mutação. Step 3: decisão direta. Step 4: INTENT + editar. Step 5: pre-pr + TWINS Check (buscar padrão semelhante em outras mutações). Step 6: report com AUTH se push.

## Verificação

- Skill existe em `.pi/skills/fable-method/SKILL.md`
- `npm run pre-pr` passa (build + test + rules)
- `npm run prompt:manifest` (hashes atualizados)
- Nenhuma skill existente quebrada (todas ainda referenciáveis)

## Fora de escopo (futuro)

- Domain adapters (marketing, research, data) — só coding por enquanto
- fable-judge skill — o pre-pr já funciona como judge
- Múltiplos modos (plan, audit, report) — só o loop completo por enquanto