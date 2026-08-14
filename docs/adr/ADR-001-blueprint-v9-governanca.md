# ADR-001 — Blueprint v9.0 (Persistent Memory & Governance)

**Título:** [ADR-001] Blueprint v9.0 — governança persistente (AI-SESSION-STATE, ADRs, regras 43-48, telemetria ai_telemetry).

**Contexto:** Com 1.134 commits, o ecossistema MilesControl precisa de governança durável entre contextos de IA: estado de sessão persistente (perda de progresso entre turnos), registro de decisões arquiteturais, regras imutáveis com validação automática e métricas de eficiência (custo por funcionalidade). O projeto já possui: handoff.md operacional, rules 1-42 auto-descobertas pelo pre-pr (`scripts/rules/rule-*.mjs`), RTK Query com `injectEndpoints` em `src/features/`, React 19.2.8 e Supabase com RLS por `auth.uid()`.

**Decisão:**
- Adotar `docs/AI-SESSION-STATE.md` (≤50 linhas, estrutura fixa) como protocolo de transferência entre agentes — complementar, não substituto, do handoff.md operacional.
- Criar `docs/adr/` com template ultra-enxuto (Título/Contexto/Decisão/Consequências) para decisões de stack.
- Renumerar as 6 novas regras para **43-48** (a rule-42 Coverage Gate já existe e permanece intacta): 43 Migration (schema drift), 44 RTK Auditor (createEntityAdapter), 45 React 19 Compliance, 46 Token Sentinel, 47 MCP Bridge, 48 Telemetry Auditor. Cada regra com validador `scripts/rules/rule-NN-*.mjs` (auto-descoberto pelo pre-pr).
- createEntityAdapter (rule-44) como **camada de normalização de cache** sobre RTK Query — sem reescrever o data-fetching por `injectEndpoints`.
- Telemetria: tabela `ai_telemetry` com RLS `auth.uid()`, lib `src/lib/aiTelemetry.ts` testada, script de registro e visualização "Custo por Funcionalidade" na aba KPI.
- Token Sentinel (rule-46) como checklist de higiene: hard-fail apenas em critérios objetivos (estrutura do AI-SESSION-STATE.md, limite 150 linhas já coberto pela rule-41); "poda ≥20%" como diretriz não-bloqueante (subjetiva).
- MCP Bridge (rule-47) como validador de config (`SERENA_MCP_URL` / `.mcp.json`) + extensão `.pi` — sem servidor MCP externo nesta fase.

**Consequências:**
- Imediatas: 6 novos validadores no pre-pr; todo turno de trabalho deve atualizar `docs/AI-SESSION-STATE.md`; novas decisões de stack exigem ADR; sessões feature exigem council (rule-27) antes do código.
- Padrões de código: adoção progressiva de `createEntityAdapter` (Fase B) e `useActionState`/`use` (Fase C); tipagem estrita sem `any` (falha crítica na rule-45).
- Limitações futuras: aplicação de migrations no Supabase remoto depende de token de acesso (fail-open); telemetria real de tokens depende de metering do runtime (estimativas locais).
