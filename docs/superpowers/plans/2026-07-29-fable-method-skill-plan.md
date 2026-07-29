# Full Fable Method Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar `.pi/skills/fable-method/SKILL.md` — skill unificada que costura os 7 passos do Fable Method com as categorias, gates, workflow e scripts existentes do MilesControl.

**Architecture:** Skill única em `.pi/skills/fable-method/SKILL.md` (~200-250 linhas). Cada passo referencia ferramentas concretas do projeto (scripts, docs, skills). A nova skill referência skills existentes sem substituí-las.

**Tech Stack:** Markdown (SKILL.md), Node.js (scripts de validação)

## Global Constraints

- O skill DEVE referenciar os 3 gates (INTENT, TWINS, AUTH) com links para `docs/fable-gates.md`
- O skill DEVE mapear cada um dos 7 passos a ferramentas concretas do projeto
- O skill NÃO DEVE duplicar conteúdo de skills existentes — apenas referenciá-las
- O skill DEVE incluir a tabela de categorias com lazy loading (idêntica à de AGENTS.md)
- O skill DEVE ter os exemplos comprimidos adaptados ao MilesControl
- `npm run prompt:manifest` DEVE passar após criação (hashes atualizados)
- `docs/MAP.md` DEVE referenciar a nova skill

---

### Task 1: Criar `.pi/skills/fable-method/SKILL.md`

**Files:**
- Create: `.pi/skills/fable-method/SKILL.md`

**Interfaces:**
- Consumes: `docs/fable-gates.md` (gates), `AGENTS.md` (categorias), `docs/WORKFLOW.md` (workflow), `.pi/skills/` (skills existentes), `scripts/` (scripts de validação)
- Produces: Skill completa referenciável por `superpowers:fable-method` e pelo workflow

**Steps:**

- [ ] **Step 1: Criar SKILL.md com frontmatter + seção de propósito**

O skill começa com frontmatter YAML e uma seção clara de quando usar:

```yaml
---
name: fable-method
description: "7-step problem-solving loop adaptado ao MilesControl: classify → define done → evidence → decide → act → verify → report. Use para qualquer tarefa de desenvolvimento (feature, bugfix, refactor, docs, chore) como skill primária."
---
```

- [ ] **Step 2: Escrever seção "Os 7 Passos" com tabela de visão geral**

Tabela mapeando cada passo Fable → ação concreta no MilesControl:

```markdown
| Passo | Ação | Ferramentas |
|---|---|---|
| **0. Classify** | Identificar categoria | `npm run session:start`, sistema de categorias (AGENTS.md) |
| **1. Define done** | Definir verificação | `npm run pre-pr` é a meta; checklist da tarefa |
| **2. Evidence** | Coletar evidências | Lazy loading docs da categoria; navegação Serena-First; council-to-superpowers (se feature) |
| **3. Decide** | Comprometer-se | Decisão direta ou council; **🔐 AUTH Gate** se outward-facing |
| **4. Act** | Editar cirurgicamente | **🧠 INTENT Gate** antes de editar; edit tool; standing prohibitions |
| **5. Verify** | Verificar por observação | `npm run pre-pr` (build+test+rules+docs); **🔁 TWINS Check** se bug fix |
| **6. Report** | Reportar resultado | Outcome-first; relatório HTML do pre-pr; AUTH/TWINS/INTENT lines |
```

- [ ] **Step 3: Escrever detalhamento de cada passo**

Para cada passo, incluir:
- **Descrição** (1-2 frases)
- **Ferramentas do projeto** (scripts, docs, skills)
- **Gates aplicáveis** com link para `docs/fable-gates.md`
- **Regras de desempate** quando aplicável

Passo 0 — Classify:
```
## Step 0 — Classify

Determine a categoria da tarefa (feature, bugfix, refactor, docs, chore).
Execute `npm run session:start` para iniciar a sessão e carregar o handoff.

| Categoria | Docs a carregar | Workflow |
|---|---|---|
| feature | WORKFLOW.md + CONVENTIONS.md (seções relevantes) | council → build → pre-pr → PR |
| bugfix | DEBUG.md + CONVENTIONS.md (seção bugs) | triagem → fix → pre-pr → PR |
| docs | (só AGENTS.md) | editar → pre-pr → PR |
| refactor | CONVENTIONS.md + ARCHITECTURE.md | spec → build → pre-pr → PR |
| chore | (só AGENTS.md) | executar → pre-pr → PR |

Tie-breaks:
- Se parecer feature mas tem ambiguidade → plan-first (vai para council)
- Se parecer bugfix mas envolve redesign → refactor
```

Passo 1 — Define Done:
```
## Step 1 — Define Done

Em 1-2 frases, o que significa "pronto" e como será verificado.

- **Task:** `npm run pre-pr` passa (build + test + rules + docs)
- **Bugfix:** o bug não se reproduz + pre-pr passa
- **Refactor:** comportamento inalterado + pre-pr passa
- **Docs:** `npm run verify-docs` passa

State suas premissas. Se uma premissa é verificável com 1 comando, verifique em vez de assumir.
```

Passo 2 — Evidence:
```
## Step 2 — Gather Evidence

1. **Navegação Serena-First** — antes de ler arquivos-fonte, use `serena_get_symbols_overview` ou `serena_find_symbol`
2. **Carregar docs da categoria** — conforme tabela do Step 0
3. **Se feature:** executar `council-to-superpowers` (via `.pi/skills/council-to-superpowers/SKILL.md`)
4. **Parallelize** — buscas independentes vão num lote paralelo
5. **Leia estreito** — localize a seção relevante, não o arquivo todo
6. **Time-box** — uma rodada + uma follow-up; terceira precisa de motivo
7. **Surpresas roteiam o loop** — contradições entre código, teste e spec são o achado mais importante
```

Passo 3 — Decide:
```
## Step 3 — Decide & Commit

Sintetize as evidências em **uma recomendação**. Se considerou alternativas, nomeie cada uma em 1 linha e diga por que perdeu.

**🔐 AUTH Gate** — Se a ação é outward-facing (push, merge, deploy, publish):
1. Escreva `AUTH: usuário disse "<citação exata>"`
2. Se nada na conversa fornece a citação, não aja — a ação vai no relatório como próximo passo
3. Documentação não é autorização
4. Referência: [`docs/fable-gates.md`](../docs/fable-gates.md)

Reversibilidade: ações no working tree local são reversíveis. Push/merge/deploy são irreversíveis.
```

Passo 4 — Act:
```
## Step 4 — Act Surgically

**🧠 INTENT Gate — OBRIGATÓRIO antes de qualquer edição que mude comportamento:**

```markdown
INTENT: código faz <X>; o teste/task espera <Y>; a spec/documentação diz <Z>
```

Se X, Y, Z não concordam, não edite — a divergência é o achado. Reporte.
Autoridade: usuário > spec > testes > código atual.
Referência: [`docs/fable-gates.md`](../docs/fable-gates.md)

**Regras de edição:**
1️⃣ Mude o mínimo necessário para a tarefa
2️⃣ Edições precisas (edit tool) sobre rewrites
3️⃣ Match o estilo existente
4️⃣ 3+ passos heterogêneos → checklist escrita primeiro
5️⃣ Standing prohibitions: nunca commitar/push sem AUTH; nunca enfraquecer checks; nunca adicionar dependências; nunca tocar secrets
```

Passo 5 — Verify:
```
## Step 5 — Verify by Observation

Execute `npm run pre-pr` — ele roda build + testes + rules de validação + docs.

**🔁 TWINS Check — OBRIGATÓRIO após corrigir bug:**

```markdown
TWINS: searched <padrão> — found <N> outros locais: <arquivos, ou "none">
```

Nomeie o padrão exato que causou o bug, busque no projeto inteiro com `npm run twins:check "<padrão>"`, e corrija cada ocorrência.
Referência: [`docs/fable-gates.md`](../docs/fable-gates.md)

Se algo não pode ser verificado (sem runtime, precisa de credenciais), diga exatamente isso. Uma alegação não verificada não passa como verificada.
```

Passo 6 — Report:
```
## Step 6 — Report Outcome-First

- A primeira frase responde "o que aconteceu"
- Detalhes vêm depois. Sem numeração de passos na saída para o usuário
- Inclua caveats: o que foi pulado, o que ainda é frágil, o que não pôde ser verificado
- Lines obrigatórias no relatório:
  - `INTENT: ...` se comportamento mudou
  - `AUTH: ...` se ação outward-facing foi tomada
  - `TWINS: ...` se bug foi corrigido
  - `PENDING: ...` se follow-up prescrito mas não tomado
- Antes de enviar, releia como revisor hostil
```

- [ ] **Step 4: Escrever seção Triviality Gate**

```markdown
## Triviality Gate

Uma tarefa é trivial APENAS se TODAS são verdade:
1. 1 arquivo
2. < ~10 linhas alteradas
3. Nenhum comportamento novo
4. Você já sabe exatamente o que mudar sem buscar

Se trivial: faça a mudança, confirme com o check óbvio (build/lint), reporte em 2 frases.
Tudo mais → loop completo.
```

- [ ] **Step 5: Escrever seção Standing Prohibitions**

```markdown
## Standing Prohibitions

Salvo instrução explícita do usuário em contrário:
- Nunca commit ou push
- Nunca enfraqueça um check nem fabrique o que ele procura para fazê-lo passar
- Nunca toque em secrets, credenciais ou env files
- Nunca adicione dependências
- Nunca delete ou sobrescreva fora do escopo declarado
- Nunca pule o pre-pr
```

- [ ] **Step 6: Escrever seção de exemplos comprimidos**

```markdown
## Exemplos

**Feature: "Adicionar máscara de CPF no input"**
Step 0: feature. Step 1: pre-pr passa, teste do input CPF verde. Step 2: ler CONVENTIONS.md (UI), ler Input existente. Step 3: decisão direta. Step 4: INTENT → editar Input.tsx. Step 5: pre-pr. Step 6: report.

**Bugfix: "Saldo aparece negativo após lançamento"**
Step 0: bugfix. Step 1: saldo nunca negativo, testes de mutação passam. Step 2: ler DEBUG.md, ler mutation. Step 3: decisão direta. Step 4: INTENT → editar. Step 5: pre-pr + TWINS: searched "balance < 0" — found 2 locais. Step 6: report.

**Refactor: "Extrair lógica de formatação do componente"**
Step 0: refactor. Step 1: comportamento inalterado, pre-pr passa. Step 2: ler CONVENTIONS.md, ARCHITECTURE.md. Step 3: decisão. Step 4: INTENT → extrair função. Step 5: pre-pr. Step 6: report.
```

- [ ] **Step 7: Verificar skill**

```bash
# Verificar que o arquivo existe e tem conteúdo
wc -l .pi/skills/fable-method/SKILL.md

# Verificar YAML frontmatter é parseável
head -5 .pi/skills/fable-method/SKILL.md | grep "^---$"
```

---

### Task 2: Atualizar docs/MAP.md + manifest

**Files:**
- Modify: `docs/MAP.md` (adicionar referência à nova skill)
- Dev: `npm run prompt:manifest` (atualizar hashes)

**Interfaces:**
- Consumes: skill criada na Task 1
- Produces: MAP.md atualizado, manifest com hashes consistentes

- [ ] **Step 1: Adicionar skill ao MAP.md**

Adicionar linha na tabela de skills:

```markdown
| `.pi/skills/fable-method/SKILL.md` | Skill primária de desenvolvimento | Loop de 7 passos Fable Method adaptado ao MilesControl — costura categorias, gates, workflow e scripts |
```

- [ ] **Step 2: Atualizar hashes no manifesto**

```bash
npm run prompt:manifest
Expected: hashes atualizados, nenhum erro

git add .pi/skills/fable-method/SKILL.md docs/MAP.md
git status
Expected: apenas os 2 arquivos
```

- [ ] **Step 3: Verificação final (pre-pr)**

```bash
npm run pre-pr
Expected: build ✅ test ✅ rules ✅ docs ✅
```