# 🔎 Auditoria de Docs — 2026-08-07

> Registro de acompanhamento da auditoria completa solicitada pelo usuário.
> **Ordem de execução obrigatória — todos os itens devem ser concluídos.**

## 📋 Checklist (6 itens)

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 1 | Avaliar TODOS os arquivos `.md` + tasks pendentes (docs/tasks/, IDEIAS.md, ROADMAP, Issues) | ✅ | 163 `.md`; 26/26 cards done; IDEIAS vazio; 0 issues |
| 2 | Limpeza de docs — remover arquivos não mais úteis ao projeto | ✅ | 6 docs arquivados; AGENDA.md removido; audit doc referenciado no MAP.md |
| 3 | Avaliar arquivos órfãos a serem removidos | ✅ | rule-14 verde; verify-docs 0 órfãos; project:audit 0 críticos; CRG dead-code = falsos positivos |
| 4 | Verificar skills (`.pi/skills/`) precisando de atualização | ✅ | 20 skills; rule-23 verde; **code-review-graph instalada** (nova); nenhuma obsoleta |
| 5 | Verificar pendências mapeadas não resolvidas | ✅ | entry-create-account implementado; KPI pipeline real; 3 PENDINGs ambientais |
| 6 | Trazer mapeamento completo ao usuário | ✅ | Relatório final + tabelas abaixo |

## 🔍 Inventário (item 1)

- **163 `.md`** no repo (152 verificados pelo verify-docs; resto = fixtures de teste e artifacts gitignored)
- **docs/tasks/:** 26 task-cards (P0-01 → P3-25) — **todos `done ✅`** (ROADMAP.md)
- **docs/:** 25 arquivos ativos (hub AGENTS.md referencia 12; MAP.md cobre o resto)
- **docs/council/:** 16 vereditos (2 órfãos → arquivados)
- **docs/superpowers/:** 17 specs + 12 plans (3 órfãos → arquivados)
- **docs/archive/:** 39 arquivos históricos (intencional — "cemitério" de ciclos encerrados)
- **IDEIAS.md:** vazio | **GitHub Issues:** 0 abertas | **RADAR:** limpo

## 🧹 Candidatos a limpeza (item 2) — executado

Arquivados em `docs/archive/` (ciclos encerrados, nunca mencionados):

| Arquivo | Motivo |
|---------|--------|
| `docs/archive/council/2026-07-18-p0-03-check-strict-veredito.md` (era `docs/council/`) | Veredito antigo, P0-03 done, 0 refs |
| `docs/archive/council/2026-08-01-kpi-dados-reais-veredito.md` (era `docs/council/`) | Implementado (evidências no tracking), 0 refs |
| `docs/archive/plans/2026-07-27-criar-dono-programa-inline.md` + `docs/archive/specs/2026-07-27-criar-dono-programa-inline-design.md` | Implementado (P2-21), 0 refs |
| `docs/archive/plans/feedback-plan.md` + `docs/archive/specs/2026-07-27-testing-production-design.md` | Implementado (P2-22; TESTING-PRODUCTION.md ativo), 0 refs |
| `docs/archive/fable-method-audit.md` (era `docs/`) | Auditoria one-shot do PR #219 (28/07) |

**Removido:** `AGENDA.md` (redirecionador vazio — conteúdo já em `docs/archive/AGENDA-2026.md`).

**Adicionado:** `docs/audits/2026-08-07-docs-audit.md` referenciado no MAP.md (resolve verify-docs).

## 🗑️ Órfãos (item 3)

- **rule-14 (src/):** ✅ nenhum arquivo órfão em `src/`
- **verify-docs --strict:** ✅ 0 órfãos após referenciar o audit doc
- **project:audit:** 9 checks, 1 falha (verify-docs pré-fix), **0 críticos**
- **CRG dead-code:** 136 símbolos sem callers — **falsos positivos** (handlers JSX via props, exports cross-module, helpers de skills upstream). Sem ação.
- **`.pi-subagents/artifacts` e `.superpowers/sdd`:** gitignored — fora do repo, não são órfãos.

## 🧠 Skills (item 4)

- **20 skills** em `.pi/skills/`; **rule-23 verde** (nenhuma referência quebrada)
- **Nova:** `code-review-graph` (CLI v2.3.7 via pipx; grafo: 323 arquivos, 1794 nós, 20358 arestas; 17 comunidades) — registrada no manifesto de prompts (rule-29, 11 arquivos)
- Nenhuma skill do workflow obsoleta ou com symlink quebrado

## ⏳ Pendências mapeadas (item 5)

| Pendência | Status |
|-----------|--------|
| ROADMAP P0→P3 (26 cards) | ✅ todas done |
| Veredito `entry-create-account` (FAÇA, 24/07) | ✅ implementado — `EntryForm.tsx` (onCreateAccount) |
| Veredito KPI dados reais (01/08) | ✅ implementado — `rule:fail`, `quality.jsonl`, eventos pre-pr no tracking |
| GitHub Issues | ✅ 0 abertas |
| **BASETEN_API_KEY** | ⏳ PENDING — ambiente do usuário (perfil `baseten` do router) |
| **Remote session APIs (pi PiClient/CBOR)** | ⏳ PENDING — experimental, sem caso de uso |
| **Fullscreen TUI** | ⏳ PENDING — ativa no próximo startup do pi |

## 📊 Mapeamento completo (item 6)

Arquitetura via CRG (17 comunidades): `unit-git` (539 nós), `scripts-parse` (186), `tests-post` (153), `components-handle` (142), `rules-file` (77), `lib-router` (53), `use-database-use` (53), `components-key`, `pages-handle`, `lib-calc`, `scripts-event`, `contexts-provider`, `migrations-updated`, `integration-simulate`, `pages-after`, `src-app`, `types-description`.

Estrutura de docs viva: AGENTS.md (hub) → MAP.md (mapa) → 12 docs carregáveis por categoria + ROADMAP/tasks + council/superpowers (ciclos) + archive (histórico).
