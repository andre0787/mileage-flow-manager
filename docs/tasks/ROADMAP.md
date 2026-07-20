# Roadmap — Workflow para modelos LLM menores

**Origem:** `docs/council/2026-07-17-llm-menor-workflow-veredito.md`
**Execução P0:** `docs/council/2026-07-18-finalizar-p0-roadmap-veredito.md`
**Estratégia:** reformular em ondas (P0 → P1 → P2). Não instalar framework amplo;
entregar cada item como PR pequeno com gate executável.

Cada item abaixo é um **task-card** em `docs/tasks/` seguindo o template
`docs/tasks/_TEMPLATE.md`. O card é a unidade de trabalho que um modelo menor
deve conseguir executar sem precisar deduzir o passo seguinte.

---

## Ondas

### 🟠 P0 — Confiança no próprio workflow
Pré-requisito de tudo o que segue. Sem P0, qualquer protocolo de agente é só sugestão.

| Card | Título | Estado |
|------|--------|--------|
| [P0-01](P0-01-manifesto-workflow.md) | Manifesto único de workflow | done ✅ |
| [P0-02](P0-02-session-start-persiste-categoria.md) | `session:start` persiste categoria/objetivo/branch | done ✅ |
| [P0-03](P0-03-ci-check-strict.md) | CI executa `npm run check` em modo estrito | done ✅ |
| [P0-04](P0-04-remove-continue-on-error.md) | Remover `continue-on-error` de checks críticos | done ✅ |
| [P0-05](P0-05-pre-pr-diff-vazio.md) | `pre-pr`: detectar diff vazio corretamente | done ✅ |
| [P0-06](P0-06-branch-protection-main.md) | Required status checks + proteção de `main` | done ✅ |
| [P0-07](P0-07-resolve-drift-docs.md) | Resolver drift atual (handoff, README, links, AGENDA) | done ✅ |
| [P0-08](P0-08-format-baseline.md) | Estabelecer baseline de formatação | done ✅ |

### 🔵 P1-A — Contrato que um modelo menor consegue seguir

| Card | Título | Estado |
|------|--------|--------|
| [P1-08](P1-08-task-card-schema.md) | `task-card.schema.json` + `npm run task:validate` | pending |
| [P1-09](P1-09-context-pack.md) | `npm run context:pack` | pending |
| [P1-10](P1-10-regra-escopo-diff.md) | Regra de escopo (diff ≠ `arquivosPermitidos`) | pending |
| [P1-11](P1-11-estados-workflow.md) | Estados verificáveis (explore/planned/...) | pending |
| [P1-12](P1-12-skill-small-model-execution.md) | Skill repo-local `small-model-execution` | done ✅ |

### 🔵 P1-B — Testes e guardrails com sinal real

| Card | Título | Estado |
|------|--------|--------|
| [P1-13](P1-13-typecheck-script.md) | `npm run typecheck` no package.json + CI | done ✅ |
| [P1-14](P1-14-check-fast-pr-nightly.md) | Separar `check:fast` / `check:pr` / `check:nightly` | pending |
| [P1-15](P1-15-fixtures-negativas-regras.md) | Testes de regras com fixtures negativas/positivas | done ✅ |
| [P1-16](P1-16-ast-regras-alto-risco.md) | AST onde o risco compensa (saldo, queries, RLS) | pending |
| [P1-17](P1-17-invariantes-financeiras.md) | Invariantes financeiras + reversais | done ✅ |
| [P1-18](P1-18-e2e-estabiliza.md) | E2E: eliminar `waitForTimeout`, separar smoke/integração | done ✅ |

### 🟢 P2 — Feedback de qualidade mensurável

| Card | Título | Estado |
|------|--------|--------|
| [P2-19](P2-19-budgets-bundle-tempo.md) | Budgets de bundle, tempo e flakiness | pending |
| [P2-20](P2-20-quality-consome-ci.md) | `QUALITY.md` consome resultados reais de CI | pending |
| [P2-21](P2-21-metricas-programa.md) | Métricas: verde-na-1ª, retrabalho, skips, bypass | pending |
| [P2-22](P2-22-feedback-usuario-aceite.md) | Feedback de usuário como critério de aceite | pending |

---

## Ordem de execução recomendada

1. **P0 primeiro, em sequência.** P0-07 (drift) e P0-06 (branch protection) podem
   rodar em paralelo com o resto de P0; P0-03/04 dependem do P0-13 (`typecheck`)
   ser definido — trazer P1-13 para o início se necessário.
2. **P1-A em seguida.** P1-08 (schema) é o alicerce de P1-09/10/11.
3. **P1-B paralelo a P1-A.** P1-13 libera P0-03.
4. **P2 só após P1 estabilizar.** Métrica sem gate estável é ruído.

## Critério de sucesso do programa

Um modelo menor deve conseguir, a partir de `npm run session:start` +
`npm run context:pack`, responder corretamente:

1. qual é a tarefa e o que está fora dela;
2. quais arquivos pode alterar;
3. qual regra/invariante se aplica;
4. quais testes precisa rodar;
5. qual evidência prova que terminou;
6. quando deve parar e pedir esclarecimento.
