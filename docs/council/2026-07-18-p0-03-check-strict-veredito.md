# Veredito — P0-03 `npm run check` estrito

**Data:** 2026-07-18  
**Contexto:** retomada do roadmap após validar o seletor E2E do carrinho e concluir o P1-13.

## Advisor: Contrarian

**Análise:** Implementar o card literalmente agora criaria um gate que já nasce vermelho: `npm run format:check` falha em 44 arquivos, enquanto o lint passa apenas com 9 warnings. Além disso, o CI ainda executa E2E remoto na mesma job. Um `check` monolítico esconderia a causa da falha e aumentaria a tentação de usar bypass.

**Veredito:** Reformule — não implemente o card completo antes de tornar o baseline determinístico.

## Advisor: First Principles Thinker

**Análise:** O objetivo real é transformar contratos verificáveis em um único comando confiável. Para isso, cada etapa precisa existir, ser reproduzível e estar verde no estado atual. Typecheck já está disponível pelo P1-13; format check e regras ainda precisam de baseline/atalhos claros. O comando não deve ser apenas uma sequência que mistura integração remota com checks locais.

**Veredito:** Reformule — primeiro separar checks determinísticos dos E2E e corrigir o contrato de formatação.

## Advisor: Expansionist

**Análise:** Um `check` bem composto pode virar a porta única para agentes menores e CI, reduzindo decisões e bypasses. Porém, fazê-lo agora sem `check:fast`/`check:pr` deixa a expansão futura mais cara e torna o tempo de feedback imprevisível. A oportunidade maior é estabelecer uma composição local rápida e uma camada de PR separada.

**Veredito:** Reformule — preparar a composição por camadas, sem tornar o E2E remoto parte do check estrito local.

## Advisor: Outsider

**Análise:** Um mantenedor novo esperaria que `npm run check` passasse em um clone limpo. Hoje isso não ocorre porque o format check falha sem alterações locais, apesar do restante parecer saudável. Também não é óbvio qual comando executa todas as regras. Implementar o atalho antes de resolver essas duas surpresas produz uma interface enganosa.

**Veredito:** Não faça ainda — colete e corrija o baseline primeiro.

## Advisor: Executor

**Análise:** O menor passo seguro não altera código de produção: documentar o bloqueio, preparar uma tarefa de baseline de formatação e só então adicionar a composição. O P1-13 já fornece `npm run typecheck`; o CI atual pode migrar para uma composição depois que format/lint/regras tiverem comportamento explícito. A validação atual do carrinho está verde (`1 passed`).

**Veredito:** Reformule — não abrir implementação de P0-03 nesta sessão; destravar primeiro o baseline e a separação de checks.

## Peer Review

- O ponto comum é que o card P0-03 depende de um baseline verde, não apenas de adicionar uma linha no `package.json`.
- O risco principal é transformar falhas preexistentes de formatação e warnings em um gate opaco.
- A implementação deve preservar a distinção entre checks locais determinísticos e E2E remoto.

## Síntese do Chairman

**Consenso:** P0-03 é a próxima unidade conceitualmente correta após P1-13, mas não está pronto para implementação literal: `npm run format:check` falha em 44 arquivos e o CI ainda mistura checks locais com E2E remoto.

**Veredito Final:** Reformule.

**Próximos Passos:**
1. Criar/selecionar uma tarefa pequena para estabelecer baseline de formatação e explicitar o agregador de regras.
2. Depois adicionar `npm run check` apenas com etapas determinísticas verdes.
3. Separar `check:pr`/`check:nightly` conforme P1-14 antes de exigir E2E remoto no CI.
4. Não alterar arquivos de produção nesta sessão.
