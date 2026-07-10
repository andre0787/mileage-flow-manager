# Spec — Playwright workers no CI

## Objetivo
Reduzir o tempo do job E2E no GitHub Actions aumentando o paralelismo com o menor risco possível.

## Escopo
- Ajustar apenas a configuração do Playwright no CI.
- Manter execução local sem mudança forçada.

## Fora de escopo
- Sharding.
- Separar smoke/full suite.
- Paralelismo dentro dos testes.

## Critério de sucesso
- CI executa E2E com 2 workers.
- Pipeline continua verde.
- Tempo total do job cai de forma perceptível.
