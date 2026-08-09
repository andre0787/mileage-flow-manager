# 🔧 Convenções de Refactor — MilesControl

> Slice de [`docs/CONVENTIONS.md`](../CONVENTIONS.md) — índice com todos os slices.
> Carregado na categoria **refactor** (junto de `conventions/common.md` e `ARCHITECTURE.md`).

> Carregado na categoria **refactor** (junto de conventions/common.md e ARCHITECTURE.md).

## DRY & Modularidade

- **Nunca construir em monolito.** Componente que acumula layout + estado + fetch + formatação é flag de refatoração. Extrair em submódulos (`ui/`, `hooks/`, `lib/`).
- **Sempre reutilizável, nunca duplicado.** Se um pattern serve 2+ lugares, extrair. Se só existe em 1 lugar, esperar o 2º uso (YAGNI).
- Nunca duplicar cálculo de lucro, margem, saldo, custo médio — cada um em ponto único em `lib/`
- Todo mapper snake_case → camelCase centralizado em `lib/utils.ts` ou no próprio módulo de domínio
- Preferir criar módulo novo a duplicar lógica existente

## Arquivos Órfãos — REGRA #14

**Nenhum arquivo `.ts`/`.tsx` em `src/` pode ficar sem ser importado por ninguém.**

```bash
# Verificação manual
node scripts/rules/rule-14-orphan-files.mjs
```

### Exceções
- `src/main.tsx` — entry point do Vite
- `src/vite-env.d.ts` — tipagens do Vite
- Arquivos `.d.ts` — type declarations

### Por quê?
- Arquivos não importados são código morto disfarçado
- Testes em `src/` (fora de `tests/`) não são executados pelo vitest
- A regra #14 flagou `RecurrenceControls.tsx` como órfão durante a auditoria

## Código Duplicado — REGRA #15

**Componentes em `src/components/` (exceto `ui/`) não podem ter similaridade Dice > 75%.**

```bash
# Verificação manual
node scripts/rules/rule-15-duplicate-code.mjs
```

### Como funciona
- Compara linhas (trimmed, não vazias) de cada par de `.tsx`
- Usa coeficiente Dice: `2 × |intersecção| / (|A| + |B|)`
- Ignora arquivos < 20 linhas e pares com tamanho muito discrepante (< 0.5× ou > 2×)

### Por quê?
- A auditoria encontrou `EntryFormMilhas.tsx` (433 linhas) ≈ `EntryFormPontos.tsx` (452 linhas) com ~90% de similaridade
- Código duplicado dobra custo de manutenção (bug fix em 2 lugares)

## Scripts Órfãos — REGRA #16

**Todo script em `scripts/` DEVE ter um atalho npm correspondente em `package.json`.**

```bash
# Verificação manual
node scripts/rules/rule-16-orphan-scripts.mjs
```

### Exceções
- `scripts/lib.mjs` — módulo utilitário compartilhado, não é script executável

### Por quê?
- Scripts sem atalho npm são invisíveis para devs (`npm run <tab>` não mostra)
- A auditoria encontrou `quality-report.mjs` sem atalho

## Novos .md Válidos — REGRA #17

**Todo novo arquivo `.md` adicionado ao projeto DEVE ser validado automaticamente.**

```bash
# A validação roda automaticamente no pre-pr
node scripts/rules/rule-17-new-docs-valid.mjs
```

### O que o script verifica:
1. **MAP.md:** se o arquivo está em `docs/` (exceto archive/ e reports/), precisa estar listado em `docs/MAP.md`
2. **Órfão:** precisa ser referenciado por pelo menos 1 outro `.md` no projeto
3. **Links:** links internos dentro do arquivo precisam apontar para arquivos que existem

### Ignorados
- `node_modules/`, `docs/reports/`, `docs/archive/`, `.opencode/`, `.pi/`

### Por quê?
- Impede que novos arquivos MD caiam nos mesmos problemas que encontramos (órfãos sem referência, links quebrados, docs invisíveis)
- A validação é automática no pre-pr, sem esforço manual

## Arquivos Duplicados Raiz/Docs — REGRA #18

**Um arquivo `.md` NÃO pode existir simultaneamente na raiz do projeto e em `docs/`.**

```bash
# Verificação manual
node scripts/rules/rule-18-no-duplicate-root-docs.mjs
```

### Por quê?
- Merges conflitantes podem recriar um arquivo na raiz enquanto a versão em `docs/` permanece
- Exemplo real: `HANDOFF.md` na raiz e `docs/handoff.md` com conteúdos diferentes após merge
- Ferramentas do projeto lêem de `docs/handoff.md` mas AGENTS.md referia `HANDOFF.md` → inconsistência

### Como a validação funciona
1. Lista todos os `.md` na raiz (exceto ocultos)
2. Compara com `.md` em `docs/` por nome (case-insensitive)
3. Se encontrar correspondência, falha com lista de duplicatas

### Exceções
- Nenhuma. Se o arquivo precisa estar em `docs/`, não deve estar na raiz.
