# Pendências — Próxima Sprint

## 1. 🔍 Overflow de página após confirmar entrada
O teste de fluxo morre com `"Target page closed"` após clicar em Confirmar. Suspeita:
- Mutation chamado corretamente, mas `calcAccountUpdate` ou RLS pode causar erro silencioso que derruba o React
- Verificar se `entry.accountId` é válido para entradas futuras (Clube)
- Testar mutation manualmente via console do navegador

## 2. 🏷️ Coluna Origem sem nome na aba Pontos
Tabela na aba Pontos usa `programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"`  
Mas `entry.origemTypeId` referencia `origem_types`, não `programs`.  
**Correção**: usar `origemTypeName(entry.origemTypeId)` ou função similar.

## 3. 🔄 Testar transferência com bônus manualmente
- Criar transferência de 20.000 pts entre contas com 50% bônus
- Verificar: 30.000 na conta destino, 40.000 na origem
- Verificar custo médio atualizado

## 4. 🧹 Limpeza de arquivos temporários
- `tests/fluxo-completo.spec.ts` — testar se roda até o fim após corrigir item 1
- Screenshots de debug em `tests/screenshots/` — limpar se não forem mais necessários
- `tests/fluxo-relatorio.md` — atualizar com resultados da próxima execução

## 5. 🧪 Bateria pré-deploy
- `npm run build` ✅ (passa)
- `npx playwright test tests/entradas.spec.ts tests/origem-tipo.spec.ts` ✅ (passam)
- `npx playwright test tests/responsivo.spec.ts` — verificar timeout
- `npx playwright test tests/carrinho.spec.ts tests/clube.spec.ts` — verificar se passam
