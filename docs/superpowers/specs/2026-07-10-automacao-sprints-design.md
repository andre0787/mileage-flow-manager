# Spec: Plano de Automação & Organização em Sprints

**Data:** 2026-07-10
**Contexto:** Varredura de 48 arquivos .md revelou 29 órfãos, 9 gaps de automação, 5 promessas quebradas
**Council Veredito:** docs/council/2026-07-10-plano-automacao-sprints-veredito.md

## Abordagens Consideradas

### A) Big Bang — tudo de uma vez
Resolver todos os 9 gaps + 29 órfãos em uma sprint só.
- ✅ Resolve tudo rápido
- ❌ Alto risco de CI quebrar e ninguém saber manter
- ❌ Interrompe features por dias
- ❌ Difícil de revisar em PR único
- **Decisão: REJEITADA** — council indicou que tentar tudo de uma vez aumenta chance de CI frágil

### B) Por sprints, priorizando automação primeiro (ESCOLHIDA)
3 sprints focados: Fundação → Limpeza → Prevenção
- ✅ Menor risco — cada sprint é autossuficiente
- ✅ Valor entregue desde a Sprint A (CI/CD rodando)
- ✅ Fácil de revisar (PRs menores e focados)
- ✅ Segue recomendação do council

### C) Só CI/CD, resto ignora
Resolver só os 3 gaps mais críticos (CI, deploy, test:e2e) e arquivar tudo em lote.
- ✅ Menor esforço (~2 horas)
- ❌ Deixa promessas quebradas nos docs (AGENTS.md, WORKFLOW.md)
- ❌ Docs continuam inconsistentes
- ❌ Cross-harness config nunca é resolvido
- **Decisão: REJEITADA** — deixa dívida técnica de docs que vai custar mais caro depois

## Design da Solução

### Sprint A — Fundação de Automação (Prioridade: 🔴 Crítica)

**Objetivo:** CI/CD rodando, deploy automático, scripts básicos.

| Item | Arquivos | Esforço | Complexidade |
|------|----------|---------|-------------|
| A1. CI workflow | `.github/workflows/ci.yml` | 30min | Baixa |
| A2. Deploy workflow | `.github/workflows/deploy.yml` | 15min | Baixa |
| A3. test:e2e script | `package.json` | 30s | Trivial |
| A4. Matar develop | `docs/GIT-WORKFLOW.md` | 5min | Trivial |

### Sprint B — Limpeza & Confiabilidade (Prioridade: 🟡 Alta)

**Objetivo:** Arquivar ruído, configurar cross-harness, verificação automatizada.

| Item | Arquivos | Esforço | Complexidade |
|------|----------|---------|-------------|
| B1. Arquivar specs antigas | Mover docs/superpowers/specs/ → docs/archive/ | 10min | Trivial |
| B2. Arquivar plans antigos | Mover docs/superpowers/plans/ → docs/archive/ | 5min | Trivial |
| B3. Arquivar council sem link | Mover docs/council/ antigos → docs/archive/ | 5min | Trivial |
| B4. Limpar artifacts obsoletos | SPRINT5-QUICKSTART, mobile-ios-notes, etc. | 5min | Trivial |
| B5. Cross-harness config | `.opencode/settings.json`, `.claude/settings.local.json` | 10min | Baixa |
| B6. Script de verificação | `scripts/verify-docs.mjs` — varredura automatizada | 1h | Média |
| B7. Atualizar docs núcleo | AGENTS.md, WORKFLOW.md, CONVENTIONS.md, MAP.md | 30min | Baixa |

### Sprint C — Polimento & Prevenção (Prioridade: 🟢 Média)

**Objetivo:** Prevenção ativa, dashboard de qualidade, docs vivos.

| Item | Arquivos | Esforço | Complexidade |
|------|----------|---------|-------------|
| C1. Script de varredura no CI | `.github/workflows/scan.yml` | 30min | Média |
| C2. Dashboard de qualidade | Script que gera `QUALITY.md` com status | 1h | Média |
| C3. Relatório HTML automático no CI | Workflow gera artifact | 30min | Média |
| C4. HANDOFF.md automatizado | Template + script | 30min | Média |

## Riscos & Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| CI quebra por timeout/network | Média | `continue-on-error: true` em stages não-críticos |
| Playwright não roda em GitHub Actions | Baixa | Usar `action/setup` com `playwright install --with-deps` |
| Arquivar quebra referências em docs | Média | Atualizar MAP.md e AGENTS.md antes de mover arquivos |
| Cross-harness config errada | Baixa | Testar após cada criação |
| Script de verificação muito lento | Baixa | Rodar apenas diff contra main, não full scan |

## Decisões Técnicas

1. **CI usa `pull_request` + `push`** para rodar em branches antes do PR e novamente no merge
2. **Deploy usa `vercel-deploy` action oficial** com `VERCEL_TOKEN` como secret
3. **Script de verificação em Node.js puro** (sem dependências) — `scripts/verify-docs.mjs`
4. **Arquivamento usa `git mv`** para preservar histórico
5. **README.md ganha seção "Repo Map"** apontando para MAP.md

## Métricas de Sucesso

- [ ] CI roda em todo PR (build + 107 testes) em < 5 min
- [ ] Deploy automático no merge para main
- [ ] Zero arquivos órfãos no scan (todos linkados ou arquivados)
- [ ] `npm run test:e2e` funciona localmente
- [ ] `.opencode/settings.json` e `.claude/settings.local.json` existem
- [ ] AGENTS.md reflete realidade (sem promessas quebradas)
