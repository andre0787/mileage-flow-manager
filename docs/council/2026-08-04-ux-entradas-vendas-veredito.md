# Veredito — Council: UX Entradas & Vendas (filtro dono, scroll, sanitização, ordenação)

> **Data:** 2026-08-04
> **Sessão:** feature — UX melhorias em Entradas/Vendas
> **Topico:** 4 itens — (1) filtro por dono, (2) scroll por mouse no PC, (3) sanitização tipos de origem, (4) ordenação por colunas

---

## Solicitação

1. **Filtro por dono** na aba de entradas e vendas, como no dashboard principal
2. **Scroll por mouse no PC** — hoje só rola pela barra
3. **Sanitização dos tipos de origem** no cadastro de entrada de pontos (itens "sujeira")
4. **Ordenação por qualquer coluna** em entradas e vendas (principalmente data)

## Evidências coletadas (Fable — evidência antes de opinião)

| Item | Evidência |
|------|-----------|
| 2 — scroll | Playwright (headless, viewport 1280×900): `body{overflow-x:hidden}` → `bodyOverflowY:"auto"`; **wheel(0,800) → scrollY=0** (não rola); `window.scrollTo(0,600)` → 162 ✅. Causa raiz: `overflow-x:hidden` no body cria scroll container fantasma que captura o wheel |
| 1 — filtro | `Entradas.tsx` tem `owners` no `useData()` mas só busca textual; `Vendas.tsx` filtra por status + busca (ownerName na busca). Nem Entradas nem Vendas têm Select de dono dedicado. Dashboard e Relatorios já têm o padrão (`selectedOwner` + `ownerId` via `accountId`) |
| 3 — sanitização | Conta e2e nova só tem "Transferência (milhas)". Dados reais do usuário não inspecionáveis por API publishable (RLS). E2e criam "Compra Direta", "Clube Fidelidade", "Transferência". Histórico: bug #77/#78 (race condition tipos origem), migration deduplicate_transferencia já existiu |
| 4 — ordenação | `DataTable.tsx` (ui) não tem sorting; `EntryTable.tsx`/`SaleTable.tsx` (tabelas reais de Entradas/Vendas) renderizam `<TableHead>` estáticos — sem ordenação |

---

## Advisors

### Advisor: The Contrarian
**Análise:** O item 2 parece trivial (trocar `overflow-x: hidden` por `clip` no body) mas é exatamente onde mora o risco: `clip` tem suporte a partir de Chrome 90/Safari 16/Firefox 81 — para a base de usuários atual (Chrome/Edge atualizados) ok, mas o `overscroll-behavior:none` + `clip` pode mudar comportamento de PWA em iOS. O item 3 é o mais perigoso: sanitizar dados em produção SEM ver os dados reais é receita para deletar algo legítimo — um filtro de UI (defensivo) é seguro, um DELETE em banco não é. Item 1: duplicar o padrão do Dashboard em 2 páginas = 2 cópias de Select — viola regra #15 (duplicatas >75%) se mal feito; melhor extrair componente. Item 4: fazer sorting genérico no DataTable sem tipos estáveis pode quebrar o mobile (cards).
**Veredito:** Faça, com 3 ressalvas: (a) não tocar em dados de produção (só filtro defensivo de UI); (b) extrair componente compartilhado de filtro dono; (c) testar sorting no mobile também.

### Advisor: First Principles Thinker
**Análise:** Por que o wheel não funciona? Princípio: o scroll do mouse atua no scroll container mais próximo do cursor, e o `body` com `overflow-y:auto` computado vira esse container — mas o Chrome não propaga wheel para o container do body quando `overflow-x:hidden` está presente (scroll chain quebrada), deixando o wheel "morto". A correção de princípios: remover o estado de scroll container do body (usar `clip` — que não cria scroll container) e garantir que o html seja o scroller da viewport. Para o filtro por dono: o princípio é "o dono é uma dimensão primária de navegação do app" — filtrar por dono é filtrar por `accountId` (relação dono↔conta), não por nome direto nas entradas. Para ordenação: valor por clicar no header e ordenar client-side (dados já estão todos em memória via React Query).
**Veredito:** Faça. Ordem de valor: scroll (ergonomia imediata) > ordenação > filtro dono > sanitização (menor risco/maior cuidado).

### Advisor: The Expansionist
**Análise:** O filtro por dono nas entradas/vendas destrava todo um fluxo de uso real (relatório mensal por dono direto na lista). A ordenação por data "resolve" o problema do usuário que quer ver as mais recentes primeiro. O scroll fix melhora a experiência em desktop — e o mesmo CSS `clip` beneficia o PWA. A sanitização, se bem feita como higiene contínua (filtrar inválidos no select + opcionalmente um script de scan read-only), vira um guarda-chuva para futuros tipos sujos. Sugiro ainda: filtro combinável (status + dono em Vendas; busca + dono em Entradas) e ordenação padrão por data DESC (mais recente primeiro) para ambos.
**Veredito:** Faça. Incluir ordenação default por data desc e combo status+dono em Vendas.

### Advisor: The Outsider
**Análise:** "Por que o scroll não funciona e ninguém notou antes?" — porque em PWA/mobile o touch funciona (scroll via dedo não usa wheel). Só usuários desktop sofrem. A pergunta óbvia: o dashboard também não rola pelo wheel? Se sim, o bug é global e o usuário só notou agora. Para a sanitização: "o que é sujeira?" — nome vazio? "n/a"? duplicado? Sem a lista real, um filtro por padrões obvios (vazio/whitespace/n-a/teste/e2e) + dedupe por nome é razoável; o resto precisa de consulta ao usuário com os nomes reais.
**Veredito:** Faça, mas confirmar com o usuário a lista de "sujeira" real antes de descartar nomes específicos (o filtro defensivo cobre o genérico).

### Advisor: The Executor
**Análise:** Esforço estimado: item 2 = 1 linha CSS + 1 teste e2e (5min). Item 1 = componente `OwnerFilter` (Select) + uso em Entradas/Vendas + teste (20-30min). Item 4 = estender EntryTable/SaleTable com estado sort (key+dir), botão no header com seta, default data desc, + testes unit/e2e (40min). Item 3 = filtro defensivo `isCleanOrigemTypeName` em lib + aplicar no EntryForm/OrigemTypeSection + teste unit (20min). Total ~1.5-2h. TDD aplicável em todos (unit para lib/sorting e e2e para scroll). Sem dependências externas.
**Veredito:** Faça.

## Peer Review (anônimo)

- **R1:** Reforça a ressalva do Contrarian sobre o item 3: filtro defensivo de UI (exibir/esconder), NUNCA DELETE em produção sem autorização explícita. Onde o filtro roda: no select do formulário e na OrigemTypeSection (gerência).
- **R2:** Questiona premissa do Executor sobre o DataTable: EntryTable/SaleTable são componentes próprios (não usam DataTable) — o sorting deve ser implementado nelas (ou extrair hook `useSort` para não duplicar). Relatorios usa DataTable — podemos adicionar sorting lá também se trivial, mas escopo é Entradas/Vendas.
- **R3:** Aceita a ordem de valor do First Principles. Concorda que o filtro dono deve filtrar por accountId dos donos (não por string no nome).
- **R4:** Ajusta: o teste de scroll deve rodar em página longa real (Entradas com dados) para não dar falso positivo de "nada para rolar".

## Síntese do Chairman

**Consenso:** Faça os 4 itens, com prioridade: **2 (scroll) → 4 (ordenação) → 1 (filtro dono) → 3 (sanitização defensiva)**.

**Detalhamento técnico acordado:**
1. **Scroll (fix CSS):** `body { overflow-x: clip; }` + `html { overflow-x: hidden; }` (garantir scroller = viewport). Validar com teste Playwright (wheel → scrollY > 0) em página longa. Mantém `overscroll-behavior`.
2. **Ordenação:** hook `useSort<T>` em `src/lib/` (testado) + aplicar em `EntryTable` e `SaleTable` (headers clicáveis, indicador ↑/↓, default **data desc**). Sem mutação de arrays (regra imutabilidade — sempre cópia antes de sort). Testes unit para o hook + e2e para Entradas (ordenação por data).
3. **Filtro dono:** componente `OwnerFilter` (Select "Todos os Donos" + lista) em `src/components/ui/` — reutilizado em Entradas e Vendas (DRY, regra #15). Filtra via `accountId ∈ contas(dono)`. Vendas: combinável com status. Testes e2e.
4. **Sanitização (defensiva, sem DELETE):** helper `isCleanOrigemTypeName(name)` em `src/lib/origemTypes.ts` (nomes vazios/whitespace/"n/a"/"teste"/"e2e" → sujo; dedupe case-insensitive por nome no select) + aplicar no `EntryForm` (select) e `OrigemTypeSection`. Testes unit. **Ao final, apresentar ao usuário os nomes reais para decidir exclusão física em banco (fora do escopo deste PR).**

**Riscos aceitos:** suporte CSS `clip` (Chrome 90+/Safari 16+/FF 81+ — base atual ok); ordenação de arrays sempre via cópia.
**Extended Thinking Usado:** não (decisão de baixo risco, evidências diretas).
**Veredito Final:** ✅ **Faça**
**Próximos Passos:** Superpowers — brainstorzing/spec → branch `feat/ux-entradas-vendas` → TDD → pre-pr → PR.