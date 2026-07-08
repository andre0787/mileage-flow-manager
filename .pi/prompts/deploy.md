# /deploy — Deploy checklist

> Bateria obrigatória ANTES de mergear para main.

## Checklist obrigatória

- [ ] `npm run build` — sem erros
- [ ] `npx playwright test --reporter=list --workers=1` — todos passam
- [ ] Zero overflow horizontal em todos os viewports
- [ ] **Relatório HTML gerado em `docs/reports/`** — se faltar, rode `/report` primeiro
- [ ] Branch atual não é main nem develop

## Pós-deploy

- [ ] PR mergeado para main
- [ ] Vercel deploy automático confirmado
