# Auditoria de exports órfãos

Data: 2026-08-22
Escopo: `src/lib/**/*.ts` (exports nominais) e referências em `src/`.

## Resultado

- A auditoria foi executada por busca estrutural dos símbolos exportados e referências de importação.
- Não foram removidos exports nesta rodada: os candidatos possuem uso em componentes, features, testes ou barrels públicos.
- Os consumidores de Workflow usam `src/lib/workflowStaticData.ts`, que lê `public/mock/workflow-fallback.json`.
- Interfaces exportadas exclusivamente para contratos/testes foram mantidas deliberadamente.

## Observações

- Exports de `src/lib/supabase.ts` permanecem nas exceções arquiteturais documentadas; o acesso ao banco é coberto pelo módulo Supabase.
- A validação deve ser repetida por `npm run pre-pr`, que também cobre órfãos estruturais (Rule-14).
