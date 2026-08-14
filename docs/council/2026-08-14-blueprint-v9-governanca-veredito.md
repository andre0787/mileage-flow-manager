# Veredito — Blueprint v9.0 (Persistent Memory & Governance)

**Tema:** Implementação do Blueprint de Execução Técnica v9.0 — persistência de sessão (AI-SESSION-STATE.md), ADRs, regras 43-48, telemetria ai_telemetry, Token Sentinel, conformidade React 19 & RTK.
**Data:** 2026-08-14
**Sessão:** feature — Blueprint v9.0

## Advisors

### Advisor: The Contrarian
**Análise:** O blueprint mistura regras imutáveis (validação obrigatória no pre-pr), telemetria com dependência de banco e refactors arquiteturais massivos (createEntityAdapter em todas as coleções + useActionState em todos os forms). Riscos reais: (1) a numeração "42-47" colide com a rule-42 (Coverage Gate) já existente — seguir o blueprint literal quebraria uma regra validada; (2) criar a tabela ai_telemetry exige RLS com auth.uid() (rule-40) e aplicar no remoto depende de token de acesso — sem token, a entrega vira só a migration; (3) o refactor completo de RTK e forms simultâneo pode estourar o limite de 150 linhas (rule-41) e gerar regressão nos 827 testes; (4) "poda de ≥20% de ruído" como hard-fail é subjetivo e inviável de validar deterministicamente — vira fricção em vez de proteção.
**Veredito:** Faça, mas por fases e com os conflitos resolvidos (renumerar 43-48, poda como diretriz não-bloqueante, migration entregue com RLS e aplicação tentada com fail-open).

### Advisor: First Principles Thinker
**Análise:** O objetivo fundamental é governança durável: estado de sessão que sobreviva entre contextos de IA, decisões registradas (ADR), regras com validadores automáticos (padrão já consolidado no projeto: "toda regra imutável TEM script de validação") e métricas de eficiência. Os meios do blueprint são sólidos, mas dois precisam de ajuste à realidade do repo: createEntityAdapter não substitui RTK Query — o projeto já normaliza via injectEndpoints; o adapter deve ser adotado como camada de normalização de cache, não como reescrita do data-fetching. E o Token Sentinel não pode medir tokens reais — deve operar como checklist de higiene de contexto (limite de 150 linhas por arquivo já existe na rule-41).
**Veredito:** Faça — respeitando os fundamentos existentes (RTK Query + features/ + rules auto-descobertas).

### Advisor: The Expansionist
**Análise:** O programa destrava ganhos colaterais: a tabela ai_telemetry habilita o "Custo por Funcionalidade" na aba KPI (diferencial de produto); o AI-SESSION-STATE.md reduz retrabalho entre sessões; os ADRs criam memória arquitetural que o projeto ainda não tinha; as regras 43-48 fecham lacunas reais (schema drift em migrations, auditoria RTK/React19, config MCP). A telemetria também alimenta o Datadog interno existente.
**Veredito:** Faça — priorizando a fundação (docs + regras + telemetria) antes dos refactors.

### Advisor: The Outsider
**Análise:** Perguntas óbvias: o projeto já tem handoff.md e session:start/end — o AI-SESSION-STATE.md é redundante? Resposta: não — o handoff é operacional (branch/estado), o AI-SESSION-STATE é o protocolo de transferência entre agentes de IA com seções de qualidade e pendências. E "MCP Bridge" sem servidor MCP externo é só documentação — o validador deve checar a config (SERENA_MCP_URL/.mcp.json), não fingir integração.
**Veredito:** Faça — com escopo honesto para MCP e sem duplicar o handoff.

### Advisor: The Executor
**Análise:** Viabilidade por fase: Fase A (fundação: council, AI-SESSION-STATE, ADR, AGENTS.md, regras 43-48, extensões, telemetria + KPI) é bem delimitada e testável — 1 PR. Fase B (createEntityAdapter como normalização de cache por feature) é refactor médio — 1 PR com testes. Fase C (forms com useActionState/use) é o mais arriscado — 1 PR com cobertura. Sequência recomendada A → B → C, cada uma com pre-pr + PR. Aplicar migration no remoto: tentar `supabase db push` (CLI 2.109.1 linkada); se faltar token, entregar a migration e reportar.
**Veredito:** Faça — em 3 PRs sequenciais.

### Peer Review (anônimo)
- **Reforço:** Consenso em renumerar as regras para 43-48 (a rule-42 Coverage Gate é intocável). Consenso em aplicar a migration com RLS e tentar o push remoto com fail-open.
- **Ajuste:** O Contrarian ponderou que "poda ≥20%" como hard-fail é inviável — o chairman converte para checklist não-bloqueante (warning) no validador do Token Sentinel, mantendo os hard-fails objetivos (estrutura do AI-SESSION-STATE.md, limite 150 linhas já coberto pela rule-41).

## Síntese do Chairman

**Consenso:** Implementar o Blueprint v9.0, resolvendo os conflitos com o estado atual do repositório: regras renumeradas para **43-48**; createEntityAdapter como camada de normalização sobre RTK Query (sem reescrever data-fetching); Token Sentinel como checklist de higiene (hard-fail só no estrutural); MCP Bridge como validador de config; ai_telemetry com RLS `auth.uid()` e push remoto tentado com fail-open.

**Veredito Final:** Faça — em 3 fases/PRs sequenciais:
1. **Fase A (fundação + telemetria):** council, AI-SESSION-STATE.md, ADR-001, AGENTS.md (regras 43-48 + diretrizes), `.prompts-manifest.json`, validadores rule-43..48, extensões `.pi` (token-sentinel/mcp-bridge/telemetry-auditor), migration ai_telemetry + lib + script + KPI UI.
2. **Fase B (RTK):** createEntityAdapter por feature (contas, clientes, vendas, entradas, alerts, owners, programs, origem_types).
3. **Fase C (React 19):** forms de transação (EntryForm, SaleForm, TransferForm) com useActionState/use/useFormStatus.

**Próximos Passos:** encaminhar para Superpowers — iniciar Fase A na branch `feat/blueprint-v9-governanca`, TDD para lib/regras, pre-pr ao final.

**Extended Thinking Usado:** sim — Contrarian (risco de regressão nos refactors) e Executor (sequenciamento e viabilidade do push remoto).
