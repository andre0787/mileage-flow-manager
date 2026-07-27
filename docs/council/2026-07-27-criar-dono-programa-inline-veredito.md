# Veredito do Council — Criar Dono + Programa Inline no EntryForm

**Data:** 2026-07-27
**Trigger:** Feature request — permitir criar dono e programa juntos no momento de criar a mileage program (entry)

## Advisors

### Contrarian
- Feature adiciona complexidade (formulários aninhados, drawers empilhados)
- Evento raro para usuários estabelecidos
- **Veredito:** Reformule — criar apenas um (dono ou programa)

### First Principles Thinker
- Princípio de continuidade: usuário não deve sair do fluxo para cadastrar dados básicos
- Padrão já estabelecido no PR #203 — estender é consistente
- **Veredito:** Faça

### Expansionist
- Desbloqueia onboarding completo em um único fluxo
- Mesmo padrão reutilizável em outros formulários
- **Veredito:** Faça — e expanda para outros formulários

### Outsider
- Como usuário: falta o botão "+" óbvio ao lado dos selects — frustrante
- Solução natural: completar o que já foi começado
- **Veredito:** Faça

### Executor
- Esforço: ~120 linhas, 2-3 arquivos
- Risco: 3 níveis de drawer pode ser problemático em mobile
- **Veredito:** Faça — com formulário inline (expand/collapse) para evitar drawers aninhados

## Peer Review
- Consenso: a feature deve ser feita
- Drawers aninhados vs inline foi a principal divergência
- Contrarian ajustou: criar só um não resolve se faltarem ambos

## Síntese do Chairman

**Decisão Final:** Faça
**Implementação:** FormDrawer aninhado (mesmo padrão PR #203) — após discussão com usuário, que optou por consistência com padrões existentes
**Próximos Passos:** Superpowers → Brainstorming → Writing Plans → TDD → Build → Pre-PR → PR
