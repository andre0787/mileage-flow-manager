# Auditoria Estrutural 2026-08-03

> Gerado por `npm run project:audit -- --json` — commit `8b69afd`
> Período: baseline pré-sanitização da Frente C (sanitization plan)

## Comando

```bash
npm run project:audit -- --json
npm run project:audit -- --strict   # exit 1 (1 crítico pendente)
npm run verify-docs:strict          # 0 issues
```

## Tabela de Checks

| Check | Status | Domínio |
|-------|--------|---------|
| rule-14-orphan-files | PASS | Arquivos órfãos em src/ |
| rule-15-duplicate-code | PASS | Duplicatas > 75% em componentes |
| rule-16-orphan-scripts | PASS | Scripts sem atalho npm |
| rule-18-no-duplicate-root-docs | PASS | Duplicatas de docs raiz |
| rule-23-skill-orphans | PASS | Skills e symlinks válidos |
| rule-31-lib-test-coverage | PASS | Testes de libs |
| rule-32-component-test-coverage | PASS | Testes de componentes |
| verify-docs | PASS | Referências de docs válidas |

## Findings

Total: **605** (categorias):

| Categoria | Severidade | Contagem | Exemplos |
|-----------|------------|----------|----------|
| `generated` | critical | 1 | `playwright-report/index.html` |
| `historical` | info | 107 | `docs/archive/`, `docs/reports/`, `docs/audits/` |
| `allowlisted` | info | 173 | `docs/tracking/`, `supabase/migrations/`, `.pi/skills/`, `scripts/lib/`, `scripts/rules/`, `docs/superpowers/`, `docs/council/` |
| `source` | info | 210 | `src/`, `docs/`, `scripts/` |
| `other` | info | 116 | `tests/`, `tools/`, configs raiz |

### Achado crítico (único)

- `playwright-report/index.html` — artefato gerado versionado indevidamente.
  Plano: Task 4 remove do Git e adiciona `.gitignore`; upload do CI preservado.

## Decisões de allowlist

1. `docs/archive/`, `docs/reports/`, `docs/audits/` — histórico preservado, nunca removido.
2. `docs/tracking/`, `supabase/migrations/`, `.pi/skills/`, `scripts/lib/`,
   `scripts/rules/`, `docs/superpowers/`, `docs/council/` — operacionais, permitidos.
3. Órfãos respeitam entry points (`src/main.tsx`, `src/index.css`, `src/App.tsx`),
   fixtures e migrações.
4. `npm audit` (segurança) é separado da auditoria estrutural; a vulnerabilidade
   high de react-router é tratada na Task 5 como pendência documentada.

## Declaração

**Não há remoção automática de arquivos nesta auditoria.** Aplicações
destrutivas são commits explícitos, allowlisted e revisados (Task 4 deste plano).