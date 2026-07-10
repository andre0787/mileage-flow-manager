# Veredito — Deploy da Vercel via CLI

## Problema
O workflow de deploy falhou com `amondnet/vercel-action` porque ele tentou recuperar settings do projeto e travou no link do projeto.

## Veredito
**Manter o workflow e trocar só o binário `vercel` por um proxy local 25.1.0 → 54.18.5.**

### Por quê
- O workflow antigo chama `npx vercel@25.1.0`.
- Essa versão é velha demais para o endpoint atual.
- Um pacote local mínimo resolve sem precisar de `workflow` scope no push.

### Escopo
- Só o toolchain de deploy.
- Sem mexer no app nem no workflow.

### Resultado esperado
- Merge em `main` continua acionando deploy automático.
- O step usa a CLI nova por baixo.
