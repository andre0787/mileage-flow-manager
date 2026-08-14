# Veredito — Cor Customizada por Dono (campo persistido com fallback para o hash)

**Tema:** Permitir que o usuário defina uma cor personalizada para cada dono no cadastro, persistida no Supabase, mantendo o hash como fallback quando nenhuma cor foi escolhida.
**Data:** 2026-08-14
**Sessão:** feature — Cor customizada por dono
**Base:** lib `ownerColors` (PR #397) já derivada por hash do nome.

## Advisors

### Advisor: The Contrarian
**Análise:** Persistir cor por dono exige migration (`ALTER TABLE owners ADD COLUMN color`), atualização de tipos gerados (supabase-types.ts), mapper, mutations e form — superfície média. Riscos: (1) cor inválida/vazia gravada no banco pode quebrar a UI — validar no form (input color nativo garante hex válido) e tratar vazio como null; (2) regressão visual se a coluna não for lida no SELECT — mapOwner precisa incluir `color`; (3) usuários existentes sem a coluna não podem ser afetados — fallback para hash cobre 100% dos dados legados.
**Veredito:** Faça — com validação no form, color opcional (null) e fallback hash intacto.

### Advisor: First Principles Thinker
**Análise:** O objetivo é controle explícito do usuário sobre a cor, mantendo a conveniência do default automático. O hash resolve o caso "não me importo"; o campo persistido resolve "quero diferenciar Fulano do vizinho". A função `ownerColor` deve virar `ownerColor(name, customColor?)` — customColor tem precedência; o hash continua como base. O seletor de cor no form deve mostrar o default derivado do nome (pré-selecionado) para o usuário entender o que está customizando.
**Veredito:** Faça — precedência custom > hash, seletor pré-carregado com a cor atual (custom ou derivada).

### Advisor: The Expansionist
**Análise:** Ganhos colaterais: (1) a mesma coluna `color` pode depois alimentar relatórios/KPI; (2) o padrão "campo opcional com fallback derivado" é reutilizável; (3) consistência com `origem_types.color` (que já é texto com default). Não inflar: sem paleta de seleção fancy — input `type="color"` nativo basta.
**Veredito:** Faça — escopo mínimo (coluna + form + aplicação nas 3 superfícies).

### Advisor: The Outsider
**Análise:** Pergunta óbvia: e quem não quer customizar? Resposta: não escolhe nada — o campo fica null e o hash assume (zero mudança de comportamento para usuários existentes). E a cor customizada aparece onde? Nas mesmas 3 superfícies do PR #397 (Contas, Entradas, Vendas) — a lib já é consumida lá, só precisa receber o color do dono.
**Veredito:** Faça — backward compatible por design.

### Advisor: The Executor
**Análise:** Viabilidade: migration trivial; `mapOwner` + `addOwner`/`updateOwner` ganham `color` opcional; `ownerColor(name, custom)` com fallback; OwnerSection ganha `<input type="color">` no dialog; os 3 consumidores passam `owner.color` quando o dono for resolvido (AccountCard já recebe `ownerName` — precisa receber `ownerColor`; EntryTable/SaleTable resolvem o dono ou usam `s.ownerName`). Testes: unit da lib (precedência custom), API tests (color no insert/update). 1 PR.
**Veredito:** Faça — 1 PR, TDD para a lib e testes de API.

### Peer Review (anônimo)
- **Reforço:** Consenso em color opcional (null) com fallback hash; input color nativo; backward compatible. Consenso em atualizar supabase-types.ts manualmente (o projeto não roda supabase gen types no CI).
- **Ajuste:** Contrarian pediu atenção ao AccountCard: hoje recebe `ownerName` (string) — receber `ownerColor?` como prop opcional evita resolver dono dentro do card e mantém o teste existente.

## Síntese do Chairman

**Consenso:** Implementar cor customizada por dono:
1. **Migration** `ALTER TABLE public.owners ADD COLUMN color text` (opcional, default null).
2. **Tipos**: `Owner.color?: string | null`; supabase-types.ts atualizado manualmente; `mapOwner` inclui color; `addOwner`/`updateOwner` persistem color.
3. **`ownerColor(name, customColor?)`**: customColor (hex válido) tem precedência; senão hash. Helpers Soft/Border espelham a mesma precedência.
4. **OwnerSection**: `<input type="color">` no dialog (novo/edição), pré-carregado com a cor atual (custom ou derivada do nome); reset para hash opcional.
5. **Aplicação**: AccountCard recebe `ownerColor?` prop; EntryTable/SaleTable usam owner.color quando disponível.
6. Cor como reforço (nome sempre visível) — regra mantida do PR #397.

**Veredito Final:** Faça — 1 PR, TDD para a lib + testes de API/componente, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/owner-custom-color`, migration + push remoto (com AUTH se necessário), lib TDD, form com color picker, aplicar nas 3 superfícies, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (validação e backward compat) e Executor (superfície de teste e API).
