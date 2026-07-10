# Spec — Deploy da Vercel via CLI

## Objetivo
Simplificar o workflow de produção usando a CLI oficial da Vercel diretamente.

## Mudança
- Remover `amondnet/vercel-action` do deploy.
- Executar `npx vercel deploy --prod --yes --token ... --scope andreluiz0787`.

## Critério de sucesso
- Merge em `main` faz deploy automático.
- Sem erro de project settings.
