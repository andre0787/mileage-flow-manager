# 🧪 Testes — MilesControl

## Stack de Testes

- **Playwright** — testes E2E
- Config: `playwright.config.ts` (viewport 1280x900, webServer com `npm run dev`)

## Comandos

```bash
# Testes unitários
npm test

# Testes E2E
npx playwright test --reporter=list --workers=1
```

## Arquivos de Teste

| Arquivo | Cobre |
|---------|-------|
| `tests/entradas.spec.ts` | CRUD de entradas (criar → editar → excluir) |
| `tests/responsivo.spec.ts` | 11 páginas × 4 viewports + redimensionamento |
| `tests/auth.spec.ts` | Login, validação, proteção de rotas (12 testes) |
| `tests/configuracoes.spec.ts` | Limpar cache/conta, CRUD donos/programas (8 testes) |
| `tests/vendas.spec.ts` | CRUD vendas, simulador, CSV, filtros (7 testes) |
| `tests/clientes.spec.ts` | CRUD clientes, busca, paginação (9 testes) |
| `tests/transversal.spec.ts` | Atalhos teclado, tema, i18n, navegação (16 testes) |

## Bateria Obrigatória (pré-deploy)

Executar **antes de todo push em `main`**:

1. `npm run build` — build sem erros
2. `npm test` — testes unitários (vitest)
3. `npx playwright test --reporter=list --workers=1` — testes E2E
4. Verificar zero overflow horizontal em todos os viewports
5. Screenshots automáticos em `tests/screenshots/`

**Qualquer falha → blocker. Não deployar sem bateria verde.**

## Convenções de Teste

### Cliques em Dialog/Drawer
Usar `{ force: true }` — elementos podem estar fora do viewport:
```ts
await page.click('text="Salvar"', { force: true })
```

### Seletores ambíguos
Usar `.first()` quando o valor aparece em múltiplos lugares (summary card + tabela + mobile):
```ts
await expect(page.locator('text="R$ 1.000"').first()).toBeVisible()
```

### IDs dos campos de entrada
| Ação | ID |
|------|----|
| Criar — amount | `#amount` |
| Criar — amountPaid | `#amountPaid` |
| Criar — conversion | `#conversion` |
| Editar — amount | `#amount` (mesmo ID) |
| Editar — amountPaid | `#amountPaid` (mesmo ID) |

### Criação de dados de teste via API

```ts
const token = await page.evaluate(() =>
  localStorage.getItem('sb-{project-ref}-auth-token')
)
// Usar token para chamar Supabase REST API
```

Helpers em `tests/helpers.ts` com retry embutido.

### Estratégia

1. Registrar usuário via UI (fluxo de login)
2. Criar dados de teste via fetch direto ao Supabase REST API (com token da sessão)
3. Testar UI
