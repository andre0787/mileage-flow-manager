# Relatório de Implementação

> Template acionado via `/report` ao finalizar uma feature/manutenção.
> Gera relatório HTML completo via `scripts/generate-report.mjs`.

## Instruções

1. Obtenha o diff da branch: `git diff $(git merge-base HEAD origin/main)..HEAD`
2. Execute o script de relatório com os parâmetros adequados

### Parâmetros do script

```bash
node scripts/generate-report.mjs "Descrição" --benefits "Benefício 1
Benefício 2" --impact "Impacto no negócio" --rows "Item|O que foi feito|Benefício|Impacto negócio|~200 tokens" --write
```

| Flag | Obrigatório | Descrição |
|------|-------------|-----------|
| `--benefits` | Sim | Benefícios da mudança (lista, um por linha) |
| `--impact` | Sim | Impacto no negócio (parágrafo curto) |
| `--rows` | Opcional | Tabela detalhada: `item\|correção\|benefício\|impacto\|token` |
| `--evidence` | Opcional | URL de imagem (screenshot) — renderizada inline no relatório |
| `--before` | Opcional | Descrição do estado anterior |
| `--after` | Opcional | Descrição do estado atual |
| `--write` | Sim | Salva em `docs/reports/<data>/` |
| `--prefix` | Opcional | Prefixo se não houver PR (fix/feat/docs/chore) |

> **Auto-geração:** `npm run pre-pr` já gera o relatório automaticamente.
> Para pular: `npm run pre-pr -- --no-report`

### Seções do relatório

O HTML gerado inclui:

1. **🏷️ Nível de Risco** — auto-detectado (Baixo/Médio/Alto) pelos arquivos tocados
2. **📊 Card de Status** — arquivos, adições, remoções, tokens
3. **✅ Checklist de Revisão** — itens de verificação gerados por padrão de arquivo
4. **🎯 Benefícios** — impacto direto da mudança (ex: economia de tokens, UX mais limpo)
5. **🏢 Impacto no Negócio** — valor de negócio (ex: suporte mais rápido, menos bugs em prod)
6. **📸 Evidências** — comparativo antes/depois com screenshot (opcional)
7. **📊 Métricas** — arquivos, adições, remoções
8. **⚡ Consumo de Tokens** — breakdown visual (barra + tabela com add/del/overhead)
9. **📁 Arquivos** — lista de arquivos alterados
10. **📋 Detalhamento por Item** — tabela com item, correção, benefício, impacto, custo token
11. **🔍 Diff** — diff completo com syntax highlighting

### Nomenclatura

```
docs/reports/<data>/<prefixo>-YYYY-MM-DD-<nome>.html
```

- Prefixo padrão: `PR<numero>` (se branch tem PR aberto)
- Prefixo alternativo: `fix`, `feat`, `docs`, `chore`, `auto` (via `--prefix`)
- Nome: kebab-case, sem acentos
- **Obrigatório:** o nome do arquivo DEVE conter o número do PR quando houver

Exemplos:
```
docs/reports/2026-07-12/PR102-2026-07-12-debug-logs-no-feedback.html
docs/reports/2026-07-12/fix-2026-07-12-overflow-tabela.html
docs/reports/2026-07-12/feat-2026-07-12-relatorio-enriquecido.html
```

### Exemplo completo

```bash
node scripts/generate-report.mjs "Corrigir overflow na tabela de vendas" \
  --benefits "Layout não quebra mais em mobile
Remove 120 linhas de CSS obsoleto" \
  --impact "Reduz chamados de suporte por layout quebrado em dispositivos móveis" \
  --rows "Overflow table|Adicionado overflow-x:auto|Tabela scrollável|Menos suporte mobile|~150" \
  --write
```
