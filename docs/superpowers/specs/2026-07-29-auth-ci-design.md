# AUTH Gate no CI — Design

## Contexto

Recomendação #3 do audit Fable Method (`docs/archive/fable-method-audit.md` §5):
adicionar passo de confirmação manual no workflow de deploy para produção.

## Abordagem

**Híbrida (C):** push automático mantido para deploys via PR merge +
`workflow_dispatch` com validação de frase para deploys manuais.

## Arquivo alvo

`.github/workflows/deploy.yml`

## Trigger

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      auth_phrase:
        description: '🔐 Frase de autorização para deploy manual'
        required: true
        type: string
```

- `push: [main]` — deploys automáticos de PR mergeados (já passaram por code review)
- `workflow_dispatch` — deploys manuais com confirmação explícita

## Step AUTH Gate

Adicionado no início do job `deploy`, antes da checkout:

```yaml
- name: 🔐 AUTH Gate
  if: github.event_name == 'workflow_dispatch'
  run: |
    if [ "${{ github.event.inputs.auth_phrase }}" != "Autorizo o deploy para produção" ]; then
      echo "❌ AUTH DENIED: frase incorreta"
      exit 1
    fi
    echo "✅ AUTH GRANTED — deploy autorizado"
```

- Condicional `if: github.event_name == 'workflow_dispatch'` garante que não executa em push
- A frase exata é `"Autorizo o deploy para produção"`
- Se a frase não bater, o job falha com exit 1

## Fluxo de uso

### Deploy automático (PR mergeado)

1. PR mergeado em `main`
2. Push trigger → workflow executa
3. Step AUTH Gate é pulado (condicional `workflow_dispatch` não satisfeita)
4. Build → Deploy Vercel → E2E smoke

### Deploy manual (hotfix, redeploy)

1. GitHub → Actions → Deploy → "Run workflow"
2. Digitar `Autorizo o deploy para produção` no campo `auth_phrase`
3. Workflow executa
4. Step AUTH Gate valida a frase
5. Se válida: Build → Deploy Vercel → E2E smoke
6. Se inválida: Job falha com "AUTH DENIED"

## O que não muda

- Job `deploy` (build + Vercel)
- Job `e2e-smoke-prod` (Playwright smoke tests)
- CI (`ci.yml`)
- Demais workflows do projeto

## Validação

- Rule #35 (AUTH gate) documentada em `AGENTS.md` e `docs/fable-gates.md`
- Script de validação: `scripts/rules/rule-35-auth-gate.mjs` (verifica que o step existe no deploy.yml)

## Regra de processo

Atualizar `AGENTS.md` se necessário para referenciar o CI AUTH gate como parte da rule-35.