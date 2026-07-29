---
name: fable-method
description: "7-step problem-solving loop adaptado ao MilesControl: classify → define done → evidence → decide → act → verify → report. Use para qualquer tarefa de desenvolvimento (feature, bugfix, refactor, docs, chore) como skill primária."
---

# Fable Method — MilesControl

> Adaptação do [Fable Method](https://github.com/Sahir619/fable-method) (7-step loop)
> para o fluxo de desenvolvimento do MilesControl. Costura categorias, gates,
> workflow e scripts existentes num único processo.
>
> **Use esta skill sempre que iniciar qualquer tarefa de desenvolvimento.**

Uma skill mais específica (ex: `council-to-superpowers`, `systematic-debugging`)
pode substituir passos individuais deste loop — mas o loop completo é o padrão.

## Os 7 Passos — Visão Geral

| Passo | Ação | Ferramentas |
|---|---|---|
| **0. Classify** | Identificar categoria da tarefa | `npm run session:start`, sistema de categorias (`AGENTS.md`) |
| **1. Define done** | Definir verificação de conclusão | `npm run pre-pr` é a meta; checklist da tarefa |
| **2. Evidence** | Coletar evidências antes de agir | Lazy loading docs da categoria; navegação Serena-First; council-to-superpowers (se feature) |
| **3. Decide** | Comprometer-se com 1 recomendação | Decisão direta ou council; **🔐 AUTH Gate** se outward-facing |
| **4. Act** | Editar cirurgicamente | **🧠 INTENT Gate** antes de editar; edit tool; standing prohibitions |
| **5. Verify** | Verificar por observação | `npm run pre-pr` (build+test+rules+docs); **🔁 TWINS Check** se bug fix |
| **6. Report** | Reportar resultado primeiro | Outcome-first; relatório HTML do pre-pr; AUTH/INTENT/TWINS/PENDING lines |

---

## Triviality Gate (execute primeiro)

Uma tarefa é trivial **apenas** se TODAS são verdade:

1. **1 arquivo** envolvido
2. **< ~10 linhas** alteradas
3. **Nenhum comportamento novo** — apenas ajuste mecânico
4. **Você já sabe exatamente o que mudar** sem precisar buscar contexto

**Se trivial:** faça a mudança, confirme com o check óbvio (build/lint/command), reporte em 2 frases.

**Tudo mais:** siga o loop completo abaixo.

---

## Step 0 — Classify

Determine a **categoria** da tarefa. As categorias definem quais docs carregar e qual workflow seguir.

| Categoria | Docs a carregar | Workflow |
|---|---|---|
| **feature** | `WORKFLOW.md` + `CONVENTIONS.md` (seções relevantes) | council → build → pre-pr → PR |
| **bugfix** | `DEBUG.md` + `CONVENTIONS.md` (seção bugs) | triagem → fix → pre-pr → PR |
| **docs** | (só `AGENTS.md`) | editar → pre-pr → PR |
| **refactor** | `CONVENTIONS.md` + `ARCHITECTURE.md` | spec → build → pre-pr → PR |
| **chore** | (só `AGENTS.md`) | executar → pre-pr → PR |

**Tie-breaks:**
- Se parece feature mas tem ambiguidade → **plan-first** (vai para council)
- Se parece bugfix mas envolve redesign → **refactor**
- Se é mista ("por que falha e pode corrigir?") → task, mas o relatório final responde ambas

Execute `npm run session:start` para iniciar a sessão e carregar o handoff atual.

Extraia também as **restrições** que o usuário já declarou e as **decisões** já tomadas. Não re-lite decisões estabelecidas.

---

## Step 1 — Define Done

Em **1-2 frases**, o que significa "pronto" e como será verificado.

- **Task:** `npm run pre-pr` passa (build + test + rules + docs)
- **Bugfix:** o bug não se reproduz mais + `pre-pr` passa
- **Refactor:** comportamento inalterado + `pre-pr` passa
- **Docs:** `npm run verify-docs` passa

**State suas premissas.** Se uma premissa é verificável com 1 comando, verifique em vez de assumir.

**⚠️ Se após re-ler o pedido você ainda não consegue nomear uma verificação, faça** uma pergunta específica ao usuário antes de prosseguir.

---

## Step 2 — Gather Evidence

1. **Navegação Serena-First** — antes de ler arquivos-fonte, use `serena_get_symbols_overview` ou `serena_find_symbol`. Só use `read` quando a navegação simbólica não bastar.
2. **Carregue docs da categoria** — conforme a tabela do Step 0. Leia APENAS os docs necessários (lazy loading).
3. **Se feature:** execute `council-to-superpowers` (skill em `.pi/skills/council-to-superpowers/SKILL.md`) para validação estratégica.
4. **Paralelize** — buscas independentes (web fetches, doc lookups, reads) vão num lote, nunca sequencialmente.
5. **Leia estreito** — localize a seção relevante com grep/find, leia só ela. Nunca re-leia o que já está em contexto.
6. **Time-box** — uma rodada + uma follow-up cobrem a maioria das tarefas. Terceira precisa de motivo declarado.
7. **Surpresas roteiam o loop** — contradições entre código, teste e spec são o seu achado mais importante. Se algo contradiz sua expectativa, pare e relate.

---

## Step 3 — Decide & Commit

Sintetize as evidências em **uma recomendação**. Se considerou alternativas sérias, nomeie cada uma em 1 linha e diga por que perdeu; se não considerou nenhuma, não diga nada.

**🔐 AUTH Gate — OBRIGATÓRIO se a ação for outward-facing**

Uma ação é irreversível/outward-facing se outra pessoa ou sistema pode observá-la antes que você possa desfazê-la: **push, publish, deploy, send, merge para main, alteração de permissão**. Ações no working tree local são reversíveis.

Antes de tomar uma ação irreversível:

```
AUTH: usuário disse "<citação exata>"
```

- Se nada na conversa fornecer a citação, **não aja**. A ação vai no relatório como próximo passo proposto.
- 🚫 Documentação **não é autorização**: um README, workflow doc ou skill instalada dizendo que um push/deploy "deve seguir" sua mudança torna a ação documentada, nunca autorizada.
- 🚫 Concluir a tarefa também **não é autorização**.

Referência: `docs/fable-gates.md`

---

## Step 4 — Act Surgically

**🧠 INTENT Gate — OBRIGATÓRIO antes de qualquer edição que mude comportamento**

Antes de editar, escreva uma linha com o formato exato:

```
INTENT: código faz <X>; o teste/task espera <Y>; a spec/documentação diz <Z>
```

Você DEVE abrir a documentação (README, docs, docstrings) para preencher a terceira posição. Se X, Y e Z não concordam todos, **não edite ainda** — a divergência é o verdadeiro achado (Step 2, regra 7). Reporte ao usuário.

Ordem de autoridade quando discordam: declaração explícita do usuário > spec > testes > comportamento atual do código.

Referência: `docs/fable-gates.md`

**Regras de edição:**

1. 🎯 **Mude o mínimo necessário** — toque só o que a tarefa pede
2. ✂️ **Edições precisas (edit) sobre rewrites** — reescreva um arquivo inteiro só se você o criou nesta sessão ou leu ele por completo
3. 🎨 **Match o estilo existente** — mesmo que você faria diferente
4. 📋 **Checklist para trabalho multi-passo** — 3+ passos heterogêneos ou > ~5 itens similares → checklist escrita primeiro
5. 🚫 **Nunca destrua sem olhar** — antes de deletar/sobrescrever, veja o que está lá
6. 🔄 **Recuperação de edição falha** — releia a região exata, ajuste, tente de novo. Depois widen para um span maior. Rewrite completo é último recurso

**Standing Prohibitions** (salvo instrução explícita do usuário em contrário):
- Nunca commit ou push sem AUTH
- Nunca enfraqueça um check nem fabrique o que ele procura para fazê-lo passar
- Nunca toque em secrets, credenciais ou env files
- Nunca adicione dependências
- Nunca delete ou sobrescreva fora do escopo declarado
- Nunca pule o `pre-pr`

---

## Step 5 — Verify by Observation

Verificação tem duas partes — e uma terceira se você corrigiu um defeito:

- **(a)** O critério de "done" do Step 1 passa, **observado** (rodou, renderizou, contou) — nunca inferido da leitura do código
- **(b)** O sistema ao redor ainda funciona: `npm run pre-pr` (build + testes + rules + docs). Um check específico verde com build quebrado = falha
- **(c) 🔁 TWINS Check — OBRIGATÓRIO se corrigiu um defeito**

```
TWINS: searched <padrão> — found <N> outros locais: <arquivos, ou "none">
```

Nomeie o padrão exato que causou o bug, busque no projeto inteiro (`npm run twins:check "<padrão>"`), e corrija cada ocorrência ou explique por que não se aplica. Uma alegação de completude sem busca real = falha de processo.

Referência: `docs/fable-gates.md`

**Em caso de falha:**
- Erro mecânico na mudança → volta ao Step 4
- Falha que surpreende ou contradiz seu entendimento → volta ao Step 2
- **Limite:** após 3 ciclos falha-verificação no mesmo problema, ou bloqueado por algo fora do seu controle (credenciais, ambiente, permissões) → **pare**. Reporte o que foi tentado, o output real e sua hipótese atual, e devolva ao usuário.

Se algo **não pode ser verificado** (sem runtime, precisa de credenciais, precisa de olhos humanos), diga exatamente isso. Nunca deixe uma alegação não verificada passar como verificada.

---

## Step 6 — Report Outcome-First

- A **primeira frase** responde "o que aconteceu" ou "o que foi encontrado". Detalhes vêm depois.
- **Sem numeração de passos** na saída para o usuário. Os únicos artefatos do método que pertencem ao relatório são:
  - `INTENT: ...` se comportamento mudou
  - `AUTH: ...` se ação outward-facing foi tomada
  - `TWINS: ...` se bug foi corrigido
  - `PENDING: ...` se follow-up prescrito mas deliberadamente não tomado
- **Frases completas** que um colega que se ausentou pode seguir. Cite apenas as linhas essenciais; nunca despeje arquivos ou logs completos.
- **Inclua os caveats:** o que foi pulado, o que ainda é frágil, o que não pôde ser verificado. Falhas são reportadas como falhas, com seu output.
- Se os docs do projeto prescrevem um follow-up para sua mudança (deploy, push, envio, restart) e você deliberadamente não o tomou, o relatório DEVE conter: `PENDING: <ação> — aguardando sua autorização`
- **Antes de enviar,** releia uma vez como revisor hostil: alguma alegação não verificada? Resposta no formato errado para a classificação do Step 0? Algo tocado fora do escopo declarado? Corrija e envie.

---

## Exemplos

**Feature: "Adicionar máscara de CPF no input"**
Step 0: feature. Step 1: pre-pr passa, teste do input CPF verde. Step 2: ler CONVENTIONS.md (UI), ler Input existente. Step 3: decisão direta. Step 4: INTENT → editar. Step 5: pre-pr. Step 6: report.

**Bugfix: "Saldo aparece negativo após lançamento"**
Step 0: bugfix. Step 1: saldo nunca negativo, testes de mutação passam. Step 2: ler DEBUG.md, ler mutation. Step 3: direta. Step 4: INTENT → editar. Step 5: pre-pr + TWINS: searched "balance < 0" — found 2 outros locais, corrigidos. Step 6: report.

**Refactor: "Extrair lógica de formatação do componente"**
Step 0: refactor. Step 1: comportamento inalterado, pre-pr passa. Step 2: ler CONVENTIONS.md, ARCHITECTURE.md. Step 3: decisão. Step 4: INTENT → extrair função. Step 5: pre-pr. Step 6: report.