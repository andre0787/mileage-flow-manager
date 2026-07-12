# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-12
---
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `c571f8a` — feat: antes/depois padrao na secao de evidencias do relatorio (#105)
- **Remote:** origin/main
- **Deploy Vercel:** ✅ Todos os 3 deploys OK

### 📋 PRs Abertos
Nenhum PR aberto.

---

## 📦 PRs mergeados — Sessão 2026-07-12

| PR | Descrição | Status |
|----|-----------|--------|
| **#103** | Relatório HTML enriquecido + auto-geração no pre-pr | ✅ mergeado + deploy |
| **#104** | Evidências visuais + rename automático no relatório | ✅ mergeado + deploy |
| **#105** | Seção antes/depois padrão na seção de evidências | ✅ mergeado + deploy |
| **#107** | Screenshot inline (<img>) no relatório | ✅ mergeado + deploy |

### PRs mergeados (sessões anteriores)

| PR | Descrição |
|----|-----------|
| **#92** | Sprint B + C (Limpeza & Confiabilidade + Polimento & Prevenção) |
| **#93** | Rename auto-report artifact to qualidade |
| **#95** | Badge/banner entradas só atrasadas |
| **#96** | Canal de Feedback (GitHub Issues + Formulário interno + Supabase) |
| **#97** | Pre-commit hook + validação automática de regras |
| **#98** | Botão de atalho Limpar Cache no sidebar |
| **#100** | Tasks VS Code para scripts do workflow |
| **#101** | Logger integrado em todas as mutations do useDatabase |
| **#102** | Logs de debug anexados ao reportar bug |

---

## 🧠 Sessão 2026-07-12 — Relatório enriquecido + evidências

### 📊 Relatório HTML agora tem 11 seções

```
📋 Header + badges (risco, prefixo, PR)
📊 Cards de status (arquivos, adições, remoções, tokens)
✅ Checklist de Revisão (automático por tipo de arquivo)
🎯 Benefícios
🏢 Impacto no Negócio
📸 Evidências — Antes & Depois (sempre presente)
📊 Métricas
⚡ Consumo de Tokens (barra + breakdown tabela)
📁 Arquivos
📋 Detalhamento por Item (tabela pipe-separated)
🔍 Diff
```

### 🔄 Renome automático de nomenclatura
- `--rename PR<num>` no `generate-report.mjs`
- `pre-pr-check.mjs` detecta PR aberto e renomeia `auto-*.html` → `PR<num>-*.html`
- Acentos tratados via NFD normalize: `relatório` → `relatorio`
- Prefixos válidos: `PR<num>`, `Sprint<letra>`, `auto`, `fix`, `feat`, `docs`, `chore`

### 📸 Evidências (sempre presente)
- `--before "texto"` / `--after "texto"` para descrição customizada
- `--evidence URL` para screenshot
- Fallback: métricas do diff (`🧹 X remoções` / `✨ Y adições`)
- Dica educativa quando nenhuma flag fornecida

### 🎯 Auto-geração condicional
- `npm run pre-pr` gera relatório automaticamente **só se não existir** para hoje
- Não sobrescreve relatórios manuais (que tem `--benefits`, `--impact`, `--rows`)
- Flag `--no-report` para pular

### ⚙️ Novos npm scripts
```json
"report:rename": "node scripts/generate-report.mjs --rename",
"report:help": "node scripts/generate-report.mjs --help"
```

### 🧪 Validação (rule-08)
- Valida nomenclatura: `PR<num>-YYYY-MM-DD-<nome>.html`
- Valida seções obrigatórias: Benefícios, Checklist, **Evidências**, Consumo de Tokens, Métricas, Breakdown

### 📋 Próximos passos
- [ ] Revisar feedbacks de usuários (2 pendentes — "teste" e "teste2")
- [ ] Backlog: traduções, analytics, performance, PWA

---

### 📁 Estrutura de scripts (atualizada)

```
scripts/
├── lib.mjs                   ← utilitários compartilhados
├── check-feedback.mjs        ← consulta feedback de usuários
├── pre-pr-check.mjs          ← orquestrador (rules + build + test + docs + rename)
├── rules/
│   ├── rule-02-grid.mjs
│   ├── rule-04-branch.mjs
│   ├── rule-07-ptbr.mjs
│   ├── rule-08-report.mjs    ← valida nomenclatura + seções (inclui Evidências)
│   ├── rule-10-clean.mjs
│   └── rule-13-validations.mjs
├── generate-report.mjs       ← 11 seções + --evidence + --before/--after + --rename
├── session-start.mjs
├── session-end.mjs
├── think.mjs
└── verify-docs.mjs
.githooks/pre-commit           ← bloqueia main
```
