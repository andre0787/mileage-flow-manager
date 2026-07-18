# 🌿 Git Workflow — MilesControl

## 🔥 Regra de Ouro

**NUNCA commitar/pushar direto na `main`.** Toda alteração de código DEVE
ser feita em uma branch feature/fix/docs/chore. `main` só recebe alterações
via PR mergeado. Isso inclui reverts.

### Proteção Automática

A proteção remota desejada está versionada em `.github/branch-protection-main.json`.

Checks required em `main`:
- `build-and-test` (`.github/workflows/ci.yml`): `npm run check` + Playwright E2E.

Política:
- PR obrigatório para `main`.
- 1 review obrigatório.
- branch atualizada com `main` antes do merge (`strict: true`).
- force-push e deleção de `main` desabilitados.
- admin também segue a regra (`enforce_admins: true`).

Aplicação/verificação via GitHub API:

```bash
# aplicar quando o recurso estiver disponível no GitHub (repo público ou GitHub Pro/Team)
gh api \
  --method PUT \
  repos/andre0787/mileage-flow-manager/branches/main/protection \
  --input .github/branch-protection-main.json

# verificar
gh api repos/andre0787/mileage-flow-manager/branches/main/protection
```

> Estado verificado em 2026-07-18: o GitHub retornou `403` para branch protection/rulesets porque o repo está privado em plano sem o recurso. O gate local/CI está pronto; a proteção remota depende de habilitar o recurso no GitHub.

Um **pre-commit hook** (`.githooks/pre-commit`) bloqueia commits na `main`:

```bash
# Ativar (automático via npm run session:start):
git config core.hooksPath .githooks
npm run hooks:install  # alternativa manual
```

Se tentar commitar na main:
```
🚫 BLOQUEADO: commit direto na main/master
Crie uma branch primeiro!
```

### Fluxo Correto

```
1. git checkout -b feat/minha-feature
2. Desenvolver
3. npm run pre-pr (validação)
4. npm run report "desc" --write (relatório)
5. git push origin <branch>
6. Criar PR
7. CI roda automaticamente
8. Merge → deploy
```

**Exceções:** NENHUMA. Nem correção rápida, nem revert, nem hotfix.

## Nomenclatura de Branches

Usar prefixos padronizados em inglês, **kebab-case**:

| Prefixo | Uso | Exemplo |
|---------|-----|--------|
| `feat/` | Nova funcionalidade | `feat/csv-import` |
| `fix/` | Correção de bug | `fix/login-redirect` |
| `hotfix/` | Correção urgente em produção | `hotfix/critical-security` |
| `chore/` | Tarefa de manutenção | `chore/project-docs` |
| `refactor/` | Refatoração sem mudar comportamento | `refactor/query-optimization` |
| `docs/` | Documentação | `docs/api-endpoints` |
| `test/` | Testes | `test/edge-cases` |
| `style/` | Formatação, estilos | `style/tailwind-cleanup` |
| `perf/` | Performance | `perf/lazy-loading` |

Regras:
- **Inglês**: `feat/csv-import`, não `feat/importar-csv`
- **kebab-case**: `feat/csv-import`, não `feat/csvImport`
- **Curto e descritivo**: `feat/csv-import`, não `feat/add-csv-import-feature-with-validation`

## Fluxo

```
main ─────────────────── produção (Vercel)
  ↑
feat/*, fix/*, chore/*, refactor/*, ...
```

- Toda branch → PR para `main`
- `main` → deploy automático via CI (`.github/workflows/deploy.yml`)
- `hotfix/*` → PR direto para `main` (CI obrigatório)

## Regra de Sprint

**Cada item da sprint gera uma branch nova.** Nunca acumular múltiplos
itens na mesma branch. Sequência:

1. Criar branch a partir de `main`
2. Implementar o item
3. PR → `main` → merge
4. Só então criar a próxima branch para o próximo item

Isso garante que cada PR seja pequeno, focado, e reversível independentemente.

## Commits

Mensagens em português, conventional commit:

```
feat: adiciona import CSV
fix: corrige overflow no header de vendas
chore: atualiza dependências
docs: atualiza WORKFLOW.md
refactor: extrai DeleteEntryDialog
test: adiciona teste de cancelamento de venda
```

## Deploy

- **URL**: https://mileage-flow-manager.vercel.app
- **Framework**: Vite
- **Automático**: deploy via CI no merge para `main` (`.github/workflows/deploy.yml`)
- **CI obrigatório**: build + unit + E2E em todo PR (`.github/workflows/ci.yml`)
- **Manual**: `vercel --prod` (fallback)
