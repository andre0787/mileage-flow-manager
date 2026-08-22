# Atalhos npm adicionados (Rule-16)

Data: 2026-08-22

A auditoria comparou os arquivos diretamente em `scripts/` com os comandos em `package.json`.

| Arquivo | Atalho | Comando |
|---|---|---|
| `scripts/p12-report-generator.ts` | `p12:report` | `tsx scripts/p12-report-generator.ts` |
| `scripts/p12.5-report-generator.ts` | `p12.5:report` | `tsx scripts/p12.5-report-generator.ts` |
| `scripts/lib.mjs` | `scripts:lib` | `node scripts/lib.mjs` |

Os demais scripts de primeiro nível já possuíam referência em `package.json` ou são módulos auxiliares importados por outros scripts.
