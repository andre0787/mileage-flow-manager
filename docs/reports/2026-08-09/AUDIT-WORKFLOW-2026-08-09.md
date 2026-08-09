# 🔍 Auditoria Completa do Workflow — MilesControl

> Data: 2026-08-09 · Branch: main · Escopo: docs, scripts, regras, eventos, CI, contexto
> Método: análise de código + dados reais de `docs/tracking/events.jsonl` (1.468 eventos, 267KB, 28/07 → 09/08)

---

## 0. Sumário Executivo

| # | Achado | Tipo | Impacto |
|---|--------|------|---------|
| 1 | `npm run pre-pr` **nunca falha** (sem `--strict`) | 🔴 Bug crítico | Gate documentado é no-op |
| 2 | Hook de pre-commit roda **pre-pr COMPLETO** (build+tests+rules+report) a cada commit | 🔴 Velocidade | ~30-40s por commit |
| 3 | **rule-10 auto-poluição**: eventos são logados durante o loop de regras, sujando a árvore que ela valida | 🔴 Bug | 118 falhas (50% de todas) |
| 4 | **Formato JSON duplo** em events.jsonl (`"type": "x"` vs `"type":"x"`) | 🔴 Bug de dados | Grep/tooling perde 62% dos eventos |
| 5 | rule-38/39 **fail-open** em branches mergeadas + evidência esparsa | 🟠 Regra não forçada | Gates de subagente não validam |
| 6 | Colisão de numeração **rule-02** (dois scripts) | 🟠 Bug | Confusão de regras |
| 7 | 17 scripts de regra **sem entrada no AGENTS.md** | 🟠 Documentação | Agentes quebram regras que não conhecem |
| 8 | `session:start` interativo **não loga evento**; `session:end` quase nunca é chamado | 🟡 Observabilidade | 808 starts vs 13 ends |
| 9 | CONTEXT-MANAGEMENT.md **desatualizado** (AGENTS.md 6.7KB, não 3KB; feature carrega 49KB, não 12KB) | 🟠 Contexto | Estimativas erradas |
| 10 | 119 relatórios HTML (1.5MB) commitados; serena MCP **não configurado** no pi | 🟡 Contexto | Lixo + mandato impossível |

**Taxa de falha do pre-pr: 129/347 = 37%.** As 3 maiores causas (rule-10 118×, rule-26 38×, rule-17 21×) somam 177 de 236 falhas de regra (75%).

---

## 1. 🔴 Bugs Confirmados

### 1.1 `npm run pre-pr` nunca falha (gate documentado é no-op)

`package.json` linha 49: `"pre-pr": "node scripts/pre-pr-check.mjs"` — **sem `--strict`**.

Em `scripts/pre-pr-check.mjs`, o único `exit(1)` por erros é condicional a `--strict`:
- Com erros e sem `--strict` → imprime erros, **sai com código 0**.
- Apenas o hook `.githooks/pre-commit` chama com `--strict`.

**Consequência**: o comando obrigatório do AGENTS.md ("npm run pre-pr antes de todo PR") passa silenciosamente mesmo com erros. Agentes/usuários acreditam que o gate passou. É uma **regra imutável sem enforcement real** (viola a regra dourada #4 do próprio projeto).

**Fix**: `"pre-pr": "node scripts/pre-pr-check.mjs --strict"` (ou tornar strict o default com flag `--lenient` para casos específicos).

### 1.2 Hook de pre-commit roda o pre-pr COMPLETO (o assassino de velocidade)

O comentário do hook diz: *"Roda pre-pr (regras #14, #15, #16 + verify-docs)"*. A realidade (linha 49):

```bash
NPM_OUTPUT=$(node scripts/pre-pr-check.mjs --strict 2>&1)
```

Isso executa **tudo**: build (~6s) + testes (~18s) + 39 regras (~5.7s) + verify-docs + geração de relatório HTML + regeneração de KPIs. **Todo commit paga ~30-40s+** mesmo para mudanças de doc.

**Fix**: no hook, usar modo rápido (ex.: `PRE_PR_ONLY_RULES=1` + subset de regras + verify-docs, sem build/test/report). Build+tests devem rodar no CI (`check:pr` já existe) ou num pre-push.

### 1.3 rule-10 auto-poluição (118 falhas — 50% de todas as falhas de regra)

Fluxo do pre-pr:
1. Linha ~195: `stageGeneratedArtifacts()` — faz stage de `docs/tracking/events.jsonl`, `quality.jsonl`, `kpi-data.json`.
2. Linha ~226: **durante o loop de regras**, qualquer regra que falha faz `event-log.mjs rule:fail` → **append** em `events.jsonl` → arquivo volta a ficar "dirty".
3. rule-10 checa `git status --short` filtrando unstaged/untracked → **falha** por causa do próprio evento que ele acabou de gerar.
4. A falha loga **outro** `rule:fail` → re-trigger do problema em runs seguintes.

**Resultado**: 118 falhas rule-10 em 236 (50%), quase todas auto-infligidas. Qualquer regra que falhe antes do rule-10 na ordem alfabética (rule-02…09) garante falha do rule-10.

**Fix**: (a) logar `rule:fail` em buffer e flush **depois** do loop; (b) excluir `events.jsonl`/`quality.jsonl`/`kpi-data.json` da checagem do rule-10; (c) rodar rule-10 **antes** do loop ou stage **após** o loop.

### 1.4 Formato JSON duplo em events.jsonl (grep/tooling perde 62%)

O arquivo tem **dois formatos**:
- 913 eventos espaçados: `{"timestamp": "...", "type": "session:start", ...}`
- 555 eventos compactos: `{"timestamp":"...","type":"session:start",...}`

O switch acontece exatamente na linha 914 (28/07→01/08). Ferramentas baseadas em regex (`grep '"type":"'`) encontram só 38 `session:start` enquanto o total real é 808. Isso explica discrepâncias de contagem e quebra qualquer parser por padrão de string.

**Fix**: normalizar o arquivo (migração 1x), e alterar `event-log.mjs` para sempre escrever o mesmo formato. Regra de validação que garanta formato único.

### 1.5 rule-38/39 fail-open em branches mergeadas + evidência esparsa

- `getChangedPaths()` usa `git diff merge-base HEAD main` — quando a branch **já foi mergeada**, `merge-base = HEAD` → diff vazio → regra faz skip → **gate passa trivialmente**.
- Evidência real: apenas **5** `code-review:done` e **4** `coding:done` em 347 pre-prs. rule-38 falhou só 2×, rule-39 **0×**.
- rule-39 só foi adicionada em 08/08 (poucos runs desde então), mas o fail-open em merged branches é estrutural.

**Fix**: para branches merged, comparar com o merge-base do PR anterior ou exigir evidência por-PR; registrar evidência no evento do pre-pr/PR (não só na branch).

### 1.6 Colisão de numeração: DOIS rule-02

`scripts/rules/rule-02-category-loading.mjs` **e** `scripts/rules/rule-02-grid.mjs` — ambos número 02. Confunde rastreabilidade (evento `rule:fail rule-02` não diz qual).

**Fix**: renumerar para `rule-02a`/`rule-02b` ou 02/03 e atualizar manifestos.

### 1.7 17 scripts de regra sem entrada no AGENTS.md

`rule-13-validations.mjs` reporta (e passa!): *"Scripts sem regra correspondente em AGENTS.md: rule-9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 39"*. Ou seja, 17 regras **rodam no pre-pr mas não estão documentadas** para os agentes — incluindo rule-10 (o que mais falha!). O rule-13 valida apenas que "existe script", não que a regra é documentada.

**Fix**: criar um índice de regras (novo arquivo RULES.md na raiz de docs, ou seção no WORKFLOW-MANIFEST) listando **todas** as 39 regras com 1 linha cada; alterar rule-13 para exigir entrada documentada.

### 1.8 Observabilidade: session:start interativo não loga; session:end nunca usado

- `session-start.mjs`: apenas o modo `--set-category` loga o evento (linha 127). O caminho **interativo** (linha 175) escreve o handoff mas **não loga** `session:start`.
- `session:end`: **13 eventos vs 808 starts** (1.6%). Sessões nunca são fechadas → handoff fica com "Sessão Atual" obsoleta (contribui para as 38 falhas de rule-26).

**Fix**: logar evento no caminho interativo; fechar sessão automaticamente no início da próxima (`session:start` detecta sessão anterior aberta e loga `session:end`).

---

## 2. 🟠 Regras Não Forçadas (gap entre mandato e enforcement)

| Regra | Mandato | Evidência real | Status |
|-------|---------|----------------|--------|
| llm:route antes de todo subagent_gate | AGENTS.md | **13** `llm.route.resolved` em 14 dias | ❌ Quase nunca usado |
| rule-38 code-review por subagente | AGENTS.md | **5** eventos, 2 falhas | ⚠️ Fail-open em merged |
| rule-39 coding por subagente | AGENTS.md | **4** eventos, 0 falhas | ⚠️ Fail-open em merged |
| rule-26 session:start no início | AGENTS.md | 38 falhas | ❌ Não consistente |
| rule-17 novos docs no MAP.md | CONVENTIONS | 21 falhas | ⚠️ Autocura mascara |
| rule-10 git status ZERO | AGENTS.md #3 | 118 falhas (auto) | ❌ Auto-poluição |

---

## 3. 🐢 Velocidade / Fricção (números reais)

- **Pre-commit hook**: build 6s + tests 18s + 39 rules 5.7s + verify-docs + report + kpi ≈ **30-40s por commit** (medido: rules-only 5.7s; build/test são os maiores).
- **Taxa de falha pre-pr: 37%** (129/347) — a maior parte por rule-10 auto-infligida e rule-26.
- **119 relatórios HTML (1.5MB)** commitados em `docs/reports/` — o pre-pr gera relatório **toda vez**, mesmo sem PR aberto.
- **events.jsonl 267KB** lido integralmente por session-tracking e pelas regras 38/39 a cada run.
- **quality.jsonl 22KB** + kpi-data.json regenerados a cada pre-pr.

**Ganho estimado**: corrigir hook (1.2) + rule-10 (1.3) corta o ciclo de commit de ~35s para ~6s (rules-only) e elimina ~60% das falhas → **menos re-runs, menos tokens queimados em logs de erro**.

---

## 4. 🧠 Token / Contexto (foco principal)

### 4.1 Claims desatualizados no CONTEXT-MANAGEMENT.md

| Claim no doc | Realidade medida |
|---|---|
| AGENTS.md "reduzido de ~9KB para ~3KB" | **6.7KB** (wc -c) |
| "79KB → 12KB (85% menos)" | Feature carrega WORKFLOW.md (21KB) + CONVENTIONS.md (28KB) + AGENTS (6.7KB) + handoff (3KB) ≈ **59KB ≈ 15K tokens** |
| Lazy loading "12KB" | Só WORKFLOW+CONVENTIONS = 49KB ≈ **12.5K tokens** |

O doc foi escrito antes de WORKFLOW.md e CONVENTIONS.md crescerem. As estimativas estão erradas por ~4-5×.

### 4.2 Maiores fontes de consumo

- **Total docs**: 161KB ≈ **41K tokens** (24 arquivos .md).
- **Feature (padrão)**: ~59KB ≈ 15K tokens por sessão.
- **CONVENTIONS.md 28KB** e **WORKFLOW.md 21KB** — juntos 12.5K tokens; sobrepõem conteúdo (PR naming, checklist, CI/CD, outcome graders aparecem nos dois).
- **MAP.md 13KB**, **MAPA-EXPERIENCIAS-USUARIO.md 18KB** (não está na tabela de lazy loading — não deveria ser carregado por padrão).
- **handoff.md 3KB** com notas de bug do WebUI (pi-webui 0.8.7, externo ao projeto) — ruído.
- **119 HTML reports 1.5MB** em git (sem valor de contexto, só bloat de clone).

### 4.3 Recomendações de redução de tokens

1. **Fatiar CONVENTIONS.md (28KB)**: mover seções por categoria para `docs/conventions/<categoria>.md`; a tabela de lazy loading carrega só o slice relevante. Existe `context-pack.mjs` (npm `context:pack`) — **verificar se está no workflow** (não achei referência em AGENTS.md/WORKFLOW.md).
2. **Dedup WORKFLOW.md × WORKFLOW-MANIFEST.md**: manter o manifesto como fonte única de categorias/estados; WORKFLOW.md vira só o "como executar" enxuto.
3. **Remover MAPA-EXPERIENCIAS-USUARIO.md e MAP.md do caminho default** (carregar sob demanda via serena/rtk).
4. **handoff.md**: snapshot automático (ok) + remover notas de bug antigas/externas (seção "Sessão Atual" e "bugs" ficam, mas arquivar o resto).
5. **Arquivar relatórios HTML** > 30 dias (`docs/archive/` já ignorado por rule-17) e parar de gerar report em pre-pr sem PR aberto.
6. **serena MCP NÃO está configurado no pi** (só no VS Code mcp.json). O AGENTS.md manda "navegação Serena-First" mas a ferramenta não existe neste harness → agentes caem em read/grep (mais tokens). Duas opções: (a) configurar serena MCP no pi; (b) remover o mandato e usar `rtk`/`code-review-graph` (ambos instalados: rtk 0.45.0 ≥ 0.23 ✓, crg 2.3.7 via pipx ✓).
7. **events.jsonl**: adicionar `--tail`/`--since` no session-tracking (não ler 267KB por completo em toda sessão); regras 38/39 devem ler só eventos da branch atual.
8. **Ativar llm:route de verdade**: 13 usos em 14 dias. Se for para manter, integrar no fluxo (ex.: preflight do subagent_gate); senão, remover o mandato para não gastar tokens relendo LLM-ROUTER.md.

---

## 5. ✅ O que está bom

- `rtk` ativo (extensão versionada + binário 0.45.0) — rule-37 OK.
- `code-review-graph` 2.3.7 instalado — skill documentada.
- Autocura (healSession, healMapDocs) reduz fricção de regras menores.
- event-log com archive a 20K eventos.
- Estratégia de lazy loading existe e é o caminho certo — só precisa de números reais.

---

## 6. 🎯 Plano de Ação Priorizado

| Prioridade | Ação | Esforço | Impacto |
|---|---|---|---|
| P0 | `npm run pre-pr --strict` (fix 1.1) | 1 linha | Gate real |
| P0 | Hook rápido (fix 1.2) — rules-only + verify-docs no commit | ~30min | ~30s → ~6s por commit |
| P0 | Fix auto-poluição rule-10 (fix 1.3) | ~1h | −118 falhas |
| P1 | Normalizar events.jsonl + formato único (fix 1.4) | ~1h | Tooling confiável |
| P1 | Índice RULES.md com as 39 regras + rule-13 exige doc (fix 1.7) | ~2h | Menos surpresas |
| P1 | session:start interativo loga + auto session:end (fix 1.8) | ~30min | Observabilidade |
| P2 | Renumerar rule-02 (fix 1.6) | 15min | Rastreabilidade |
| P2 | Fatiar CONVENTIONS.md + dedup WORKFLOW (4.3.1/2) | ~4h | −40% tokens feature |
| P2 | serena MCP no pi ou remover mandato (4.3.6) | ~1h | Navegação real |
| P3 | Fail-closed rule-38/39 em merged (fix 1.5) | ~2h | Gates de verdade |
| P3 | metrics-collect: implementar ou remover | ~2h | Sem stub |

**Quick wins de 5 minutos**: fix 1.1 (1 linha), fix 1.6 (renumeração), flag `PRE_PR_ONLY_RULES` no hook, arquivar reports antigos.

---

## 7. Métricas de referência (para medir melhoria)

- Ciclo commit → hook ok: hoje ~35s → alvo <8s
- Taxa de falha pre-pr: 37% → alvo <10%
- rule:fail por semana: 236/13d ≈ 18/dia → alvo <5/dia
- Tokens de inicialização (feature): ~15K → alvo <8K
- session:end/start: 1.6% → alvo >80%
- Cobertura llm:route: 13 usos → alvo definido pelo usuário
