# 🌿 Git Workflow — MilesControl

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
