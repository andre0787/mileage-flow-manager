# Spec — Deploy da Vercel via CLI

## Objetivo
Simplificar o workflow de produção usando a CLI oficial da Vercel diretamente.

## Mudança
- Adicionar um pacote local `vercel` versão `25.1.0` em `tools/vercel-proxy`.
- O binário repassa a execução para `npx vercel@54.18.5`.

## Critério de sucesso
- Merge em `main` faz deploy automático.
- O workflow antigo continua intacto.
- O deploy usa a CLI nova por baixo.
