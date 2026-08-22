# Sanitização Segura do Projeto — Especificação de Design

> **Data:** 2026-08-03  
> **Status:** implementado (project-audit.mjs, classifyTrackedArtifacts, checkDependencyPolicy)  
> **Categoria:** refactor/chore  
> **Council:** `docs/council/2026-08-03-process-kpis-router-sanitizacao-veredito.md`

## Objetivo

Validar duplicidade, redundância, órfãos e sujeira do repositório inteiro com uma auditoria reproduzível, corrigindo apenas achados comprovados e preservando o comportamento funcional, o histórico de processo e os artefatos necessários ao CI/deploy.

## Definição de sanitização

Sanitização nesta spec significa:

1. inventariar e classificar antes de remover;
2. provar referências e entry points;
3. corrigir a fonte única quando houver duplicidade real;
4. remover artefato local/gerado versionado indevidamente;
5. registrar exceções explícitas;
6. executar a suíte completa depois de cada grupo de mudanças.

Não significa apagar arquivos arquivados, relatórios, logs, migrations ou fixtures só porque não são importados por React.

## Auditoria read-only

Criar `npm run project:audit`, com saída JSON opcional (`--json`) e modo estrito (`--strict`). O comando deve reutilizar os comandos/rules existentes e acrescentar apenas verificações que hoje não possuem cobertura:

| Área | Fonte existente | Resultado esperado |
|---|---|---|
| órfãos em `src/` | `rule-14` | lista de arquivos sem import, respeitando entry points e testes |
| duplicidade de componentes | `rule-15` | pares acima do limiar configurado, com similaridade |
| scripts sem atalho | `rule-16` | scripts top-level e internos classificáveis |
| docs raiz/docs | `rule-18` | nomes duplicados |
| skills | `rule-23` | referências ausentes/symlinks quebrados |
| cobertura de libs/components | `rule-31`/`rule-32` | arquivos sem teste correspondente |
| artefatos gerados versionados | novo scanner | arquivos de relatório/build/teste fora da allowlist |
| referências stale | `verify-docs:strict` | links e referências a fontes inexistentes |

O auditor não deve copiar a implementação de cada rule. Quando a regra atual só imprime texto, a implementação comum deve ser extraída para helper puro ou o auditor deve consumir o exit code/relatório estruturado da rule. O limiar de duplicidade e as exceções devem ter uma única definição.

## Allowlist de arquivos legítimos

- Entry points: `src/main.tsx`, `src/vite-env.d.ts` e pontos definidos pelo build.
- UI shadcn/reexports com a exceção já documentada.
- `src` tests e fixtures reconhecidos pelo Vitest.
- `supabase/migrations`, `docs/archive`, `docs/reports`, `docs/tracking` e `public/kpi-data.json` como artefatos históricos/operacionais.
- `.pi/skills` referenciadas pelo workflow.
- `scripts/lib.mjs` e módulos internos de `scripts/lib/` sem atalho próprio.

Toda exceção deve aparecer no código do auditor, no teste fixture e na documentação do comando; não usar `try/catch` silencioso para esconder uma classe de arquivo.

## Achado esperado no baseline

`playwright-report/index.html` está versionado, embora o CI gere e faça upload do diretório como artefato. A sanitização deve:

1. confirmar que nenhum código/documento depende do arquivo versionado;
2. adicionar `playwright-report/` ao `.gitignore`;
3. remover o arquivo rastreado do Git, sem apagar a configuração de upload do CI;
4. rodar testes E2E novamente para confirmar que o relatório continua sendo gerado localmente.

O auditor deve reportar esse caso antes da aplicação e deve continuar detectando novos arquivos equivalentes.

## Achados que não serão removidos automaticamente

- Duplicatas de conteúdo em `docs/archive` com valor histórico.
- Logs JSONL e relatórios necessários para os KPIs.
- Arquivos fonte não importados que sejam entry point, fixture, migration ou script interno.
- Dependência `react-router` vulnerável: exige investigação de compatibilidade e mudança separada, pois a correção automática indicada pelo npm é breaking.
- Warnings de lint que não alteram comportamento; devem ser reportados, não mascarados.

## Fluxo de aplicação

```text
npm run project:audit -- --json
  → review dos achados classificados
  → correção mínima por categoria
  → teste específico da categoria
  → check:fast
  → project:audit -- --strict
  → pre-pr / E2E / relatório
```

O modo padrão é read-only. Não haverá flag genérica `--fix` que apague arquivos. A remoção do relatório Playwright é uma alteração explícita do plano, revisada por diff e coberta por teste; futuras limpezas exigem uma allowlist nova ou mudança de spec.

## Testes

- Fixtures temporárias para arquivo órfão, entry point legítimo, duplicidade acima/abaixo do limiar, script sem atalho e artefato gerado.
- Teste que o auditor não classifica `docs/archive`, `docs/reports`, tracking ou migrations como sujeira.
- Teste que `--strict` falha quando existe um achado crítico e passa em baseline limpo.
- Teste de que o relatório JSON não contém conteúdo de arquivo sensível, somente caminho relativo e categoria.
- Regressão de todos os rules atuais, `verify-docs:strict`, typecheck, lint, format, unitários, build e E2E.

## Critérios de aceitação

1. Há um comando npm reproduzível que audita as categorias sem escrever no repositório por padrão.
2. O resultado distingue “órfão”, “duplicado”, “gerado”, “histórico”, “allowlisted” e “warning”.
3. Nenhum arquivo é apagado sem achado registrado e referência verificada.
4. O artefato Playwright versionado indevidamente deixa de aparecer no Git sem quebrar CI/E2E.
5. As rules existentes e o auditor não apresentam resultados contraditórios por usarem limiares diferentes.
6. A suíte e a aplicação permanecem funcionais após a limpeza.
7. A vulnerabilidade high de `react-router` fica registrada como pendência explícita ou recebe PR separado com testes de compatibilidade; não é silenciada.
