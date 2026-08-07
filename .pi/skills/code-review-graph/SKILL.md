---
name: code-review-graph
description: >
  Mapeamento estrutural do código com Tree-sitter (CLI `code-review-graph`,
  v2.3.7, instalado via pipx). Constrói grafo persistente de símbolos/arestas
  e responde queries de arquitetura, código morto, impacto de mudanças e
  comunidades. Use para auditoria de docs, review de PR, análise de impacto e
  mapeamento completo do projeto — sem reler arquivos-fonte inteiros.
---

# Code Review Graph (CRG)

Grafo incremental persistente do código-fonte. Parseia com Tree-sitter,
tracking de mudanças incremental e queries de contexto preciso (economia
~65x de tokens vs. ler o corpus).

> **Nota:** o pi **não suporta MCP** (decisão de design do pi) — usamos o CLI
> direto. Os slash commands `/code-review-graph:*` do repo upstream não se
> aplicam aqui.

## Comandos versionados (atalhos)

| Comando | O que faz |
|---------|-----------|
| `code-review-graph build` | Build completo do grafo (1ª vez) |
| `code-review-graph update` | Update incremental (só arquivos mudados) |
| `code-review-graph status` | Estatísticas do grafo (nós/arestas) |
| `code-review-graph architecture` | Visão da arquitetura (módulos, dependências) |
| `code-review-graph dead-code` | Funções/classes sem callers nem testes |
| `code-review-graph communities` | Lista comunidades do grafo |
| `code-review-graph flows` | Fluxos de execução armazenados |
| `code-review-graph impact` | Blast radius de mudanças (base = HEAD~1) |
| `code-review-graph detect-changes` | Impacto de mudanças (read-only) |
| `code-review-graph query` / `search` | Relacionamentos / busca de entidades |
| `code-review-graph wiki` | Gera wiki markdown por comunidade |
| `code-review-graph visualize` | HTML interativo do grafo |

## Fluxo no MilesControl

1. **Build** (1ª vez ou após mudanças estruturais grandes):
   ```bash
   code-review-graph build
   ```
   ~10s/500 arquivos. Grafo persistido fora do repo (não versionar).

2. **Auditoria/mapeamento**: `architecture` + `dead-code` + `communities`
   respondem "o que existe, o que está órfão, como se agrupa".

3. **Review de PR**: `detect-changes` / `impact` dão o raio de impacto das
   mudanças antes do review — use na fase de pré-PR.

4. **Código morto**: `dead-code` lista nós sem callers/testes — cruze com
   `rule-14` (órfãos em `src/`) e remova com `git rm`.

## Boas práticas

- Rode `update` após merges na `main` (grafo fica fresco).
- Saída é contexto: cite nós/arestas nos relatórios, não despeje o grafo.
- Não commite o grafo (é cache local); a skill e comandos são versionados.
