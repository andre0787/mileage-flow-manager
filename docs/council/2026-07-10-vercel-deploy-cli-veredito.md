# Veredito — Deploy da Vercel via CLI

## Problema
O workflow de deploy falhou com `amondnet/vercel-action` porque ele tentou recuperar settings do projeto e travou no link do projeto.

## Veredito
**Trocar o action por `npx vercel deploy` direto.**

### Por quê
- O deploy manual com a CLI funcionou.
- Menos abstração, menos ponto de falha.
- Mantém o mesmo token, sem depender do action para inferir link/settings.

### Escopo
- Só o workflow de deploy.
- Sem mexer no app.

### Resultado esperado
- Merge em `main` aciona deploy automático de novo.
- Menos chance de erro de link/settings.
