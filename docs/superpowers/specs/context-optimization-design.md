# Spec: Otimização de Contexto para Agentes (Lazy Loading + Hub Compacto)

> Design: 2026-07-15
> Status: Draft — aguardando review do usuário

## Problema

O agente inicia cada sessão carregando ~79KB / ~2.000 linhas de documentação (AGENTS.md + handoff.md + AGENDA.md + WORKFLOW.md + ARCHITECTURE.md + CONVENTIONS.md). Isso consome ~20K tokens do contexto **antes de qualquer trabalho real**, causando:

1. **Lost in the middle** — o modelo perde informações relevantes no meio de tanto texto
2. **Erros de interpretação** — regras importantes são ignoradas ou mal interpretadas
3. **Cansaço do modelo** — janela grande degrada qualidade de raciocínio em modelos menores
4. **Ruído desnecessário** — AGENDA.md (14.6KB) contém histórico de sprints concluídos sem relevância para o trabalho atual

## Abordagem Escolhida

**AGENTS.md como Hub Compacto + Lazy Loading por Categoria de Tarefa**

> Decidido em sessão de brainstorming (2026-07-15) após análise de 3 abordagens:
> 1. Mapa Mínimo (Project Atlas)
> 2. Lazy Loading Inteligente (Roteador de Docs)
> 3. **Handoff como Hub** → evoluiu para a abordagem final abaixo

## Solução em 4 Fases

### Fase 1 — Fundação: Scripts de Validação

| # | Script | Valida |
|---|--------|--------|
| rule-02 | `scripts/rules/rule-02-category-loading.mjs` | Agente carrega APENAS docs da categoria declarada |
| rule-03 | `scripts/rules/rule-03-handoff-completeness.mjs` | handoff.md tem todos os campos obrigatórios |
| rule-20 | `scripts/rules/rule-20-no-agenda-load.mjs` | AGENDA.md não é carregado em sessões normais |

### Fase 2 — Scripts Novos

| # | Script | Função |
|---|--------|--------|
| handoff-snapshot | `scripts/handoff-snapshot.mjs` | Gera snapshot do projeto (stack, estrutura, regras, workflow) para o topo do handoff.md |
| migrate-bugs | `scripts/migrate-bugs.mjs` | Migra bugs da AGENDA.md para GitHub Issues |

### Fase 3 — Restruturação dos Docs

| # | Mudança | Antes | Depois |
|---|---------|-------|--------|
| AGENTS.md | Hub compacto | 8.9KB / 104 linhas | ~3-4KB / ~55 linhas |
| handoff.md | Novo formato c/ snapshot | 48 linhas, só estado | ~60 linhas c/ snapshot do projeto |
| AGENDA.md | Arquivado | 14.6KB em docs/ | `docs/archive/AGENDA-2026.md` |
| Bugs | Migrar p/ GitHub Issues | Lista em AGENDA.md | Issues com label `bug` |
| session-start.mjs | Novo fluxo | Lê handoff + AGENDA | Lê handoff + pergunta categoria |
| session-end.mjs | + snapshot | Só commit + push | Commit + handoff:snapshot + push |

### Fase 4 — Testes & Documentação

- Testes unitários para todos os novos scripts
- Testes de integração do fluxo completo
- Atualizar CONVENTIONS.md com regras #02, #03, #20
- Atualizar WORKFLOW.md com novo fluxo
- Criar `docs/CONTEXT-MANAGEMENT.md`

## O que NÃO muda

- Docs originais (STACK.md, ARCHITECTURE.md, CONVENTIONS.md, WORKFLOW.md, UI-GUIDE.md, DEBUG.md) — intactos
- Regras imutáveis que já existem — intactas
- Workflow base (pre-pr, relatório, PR) — intacto
- Apenas **quando** os docs são lidos muda

## Impacto

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Leitura inicial | ~79 KB / ~2.000 linhas | ~12 KB / ~200 linhas | **85% menos** |
| Tokens consumidos | ~20K | ~3K | **17K tokens livres** |
| Docs carregados no início | 7 | 2 (AGENTS + handoff) | **5 a menos** |
| AGENDA.md em contexto | 14.6KB | 0KB (arquivado) | **eliminado** |
| Validações automáticas | 20 regras | 22 regras + 2 scripts | **+3 validações** |

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Agente esquece de carregar doc certo | rule-02 valida docs carregados vs categoria |
| Snapshot do projeto desatualizado | handoff:snapshot roda no session-end (obrigatório) |
| Categoria errada escolhida | handoff registra categoria; rule-03 valida |
| Modelos menores não seguem lazy loading | Scripts de validação + pre-commit hook bloqueiam |
| AGENDA.md referenciado em algum lugar | rule-20 bloqueia qualquer leitura de AGENDA.md em sessão normal |

## Definição de Pronto (DoD)

- [ ] Todos os scripts de validação criados e testados
- [ ] AGENTS.md reescrito e aprovado
- [ ] handoff.md com snapshot funcional
- [ ] AGENDA.md arquivado + bugs migrados para GitHub Issues
- [ ] session-start.mjs atualizado (sem AGENDA, com categoria)
- [ ] session-end.mjs + handoff:snapshot funcionando
- [ ] `npm run pre-pr` passa 100%
- [ ] Testes unitários para cada mudança
- [ ] CONVENTIONS.md + WORKFLOW.md atualizados
- [ ] `docs/CONTEXT-MANAGEMENT.md` criado
- [ ] Relatório HTML gerado antes do PR
