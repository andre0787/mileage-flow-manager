# Council Verdict — Tratamento de Erro, Confirmações e Debug Log

**Data:** 2026-07-10
**Pergunta:** Em quais situações devemos adicionar tratamento de erro e confirmações? O debug log estruturado para sessão do usuário é justificável?

---

## The Contrarian

**Análise:**

"Vocês estão correndo atrás do prejuízo. O hotfix da tela preta foi um sintoma de um problema maior: não existe hierarquia de error handling. ErrorBoundary captura erros React, mas e erros de negócio? Quando uma mutation falha no Supabase, o que acontece? Silêncio. O usuário clica, nada acontece, ele clica de novo, duplica dados.

Quanto às confirmações: sim, Owner/Program/OrigemType precisam de AlertDialog. Mas isso é o mínimo. O verdadeiro perigo não é a exclusão acidental — é a exclusão de dados que têm relacionamentos. OwnerSection deleta dono vinculado a contas. ProgramSection deleta programa vinculado a entradas. Vocês estão assumindo que o Supabase RLS cascata, mas não verificaram.

Sobre debug log: são dois problemas diferentes. Log de debug é para dev. Log de auditoria é para negócio. Vocês precisam dos dois, mas estão misturando."

---

## The First Principles Thinker

**Análise:**

"O que estamos realmente tentando resolver? Duas coisas distintas:

1. **Prevenir erros humanos:** Botão de deletar sem confirmação é um design flaw. Não é um bug — é uma decisão de UX que favorece velocidade sobre segurança. Para operações destrutivas em dados de configuração (donos, programas, tipos), o custo de um passo extra é mínimo. Para operações financeiras (entradas, vendas), já existe confirmação. A inconsistência é o problema.

2. **Detectar erros de sistema:** Atualmente, quando algo falha silenciosamente, vocês não têm como saber. Debug log estruturado resolve isso. Mas a pergunta certa é: 'qual é o custo de NÃO ter isso?' Se um mutation falha e o usuário não percebe, os dados ficam inconsistentes. Se vocês têm log, podem detectar padrões. Se não têm, só descobrem quando alguém reclama.

A resposta não é 'adicione tudo'. É: para cada tipo de erro, qual é a consequência? Erro de exclusão sem confirmação → dados perdidos. Erro de mutation silenciosa → dados inconsistentes. Erro de provider hierarchy → tela preta. Cada um merece um tratamento proporcional."

---

## The Expansionist

**Análise:**

"Vocês estão pensando pequeno. Debug log não é só para debug — é uma oportunidade de analytics.

Imagina: log estruturado capturando padrões de uso. Qual é a página mais acessada? Qual mutation falha mais? Quanto tempo entre login e primeira operação? Isso não é debug — é intelligence.

Para as confirmações, expansão: porque parar em Owner/Program/OrigemType? Account deletion (se existir) também precisa. E exportação de dados? Download de CSV pode ter dados sensíveis — vale confirmar?

E sobre erros: porque só tratar erros de exclusão? Erros de criação também importam. Se o Supabase estiver offline e o usuário criar uma entrada, o que acontece? Sync conflitante? Dados duplicados?

A abordagem mais ambiciosa seria um sistema unificado: toda operação crítica passa por um pipeline que:
1. Valida input
2. Executa com retry
3. Confirma resultado
4. Logga operação
5. Feedback visual

Isso parece overengineering, mas é na verdade o padrão de qualquer sistema financeiro sério."

---

## The Outsider

**Análise:**

"Não sei nada sobre gestão de milhas. Mas sei usabilidade.

Quando eu clico em 'Excluir' e nada acontece sem confirmação, eu fico nervoso. Se eu deletar algo importante e não poder desfazer, eu fico com raiva. A regra de ouro: se a ação é irreversível, peça confirmação. Se é reversível, deixe rápido.

Sobre debug log: como usuário, eu não quero que minha atividade seja loggada sem saber por quê. Mas se o app está quebrando, eu quero que o suporte tenha como ajudar. A transparência importa. Se vocês logarem, digam ao usuário. Se não logarem, tenham outro caminho para diagnóstico.

O que me chama atenção: vocês têm ErrorBoundary mas o Login não tem tratamento adequado. Se eu digitar senha errada, vejo uma mensagem técnica do Supabase. Isso não é amigável. Para usuário final, 'Credenciais inválidas' é suficiente. A mensagem técnica deveria ser loggada, não mostrada."

---

## The Executor

**Análise:**

"Foco no que dá para fazer segunda-feira:

**Prioridade 1 — Confirmações (2-3h):**
Adicionar AlertDialog em OwnerSection, ProgramSection e OrigemTypeSection. Reutilizar o padrão já existente do DeleteEntryDialog. Copy-paste com ajuste de texto. Feito.

**Prioridade 2 — Toast feedback em mutations (1-2h):**
Nos mutations que falham silenciosamente, adicionar onError com toast de erro. TanStack Query já suporta. Uma linha por mutation.

**Prioridade 3 — Debug log (3-4h):**
Criar `src/lib/logger.ts` com:
- `logOperation(type, details)` — logga operações CRUD
- `logError(context, error)` — logga erros com contexto
- Storage: localStorage em dev,Supabase em prod (tabela `audit_logs`)
- Toggle: `ENABLE_DEBUG_LOG` em variável de ambiente

Isso é mínimo viável. Não precisa de dashboard, não precisa de analytics. Só logs persistentes que sobrevivem ao refresh.

**O que NÃO fazer agora:**
- Sistema unificado de pipeline de operações (overengineering)
- Analytics de uso (YAGNI)
- Log de todas as mutations (só as destrutivas e as que falham)"

---

## Peer Review (anonimizado)

### Response A (Contrarian)
- **Mais forte:** Identificou que Owner/Program deletam dados vinculados sem verificar relacionamentos
- **Cego:** Assumiu que Supabase RLS cascata sem verificar — pode estar errado

### Response B (First Principles)
- **Mais forte:** Separou os dois problemas (erro humano vs erro de sistema) claramente
- **Cego:** Não propôs implementação concreta, só framework conceitual

### Response C (Expansionist)
- **Mais forte:** Debug log como analytics opportunity
- **Cego:** Propôs pipeline unificado — claramente overengineering para a fase atual

### Response D (Outsider)
- **Mais forte:** Login com mensagem técnica do Supabase para usuário final
- **Cego:** Focou em UX mas não considerou custo de implementação

### Response E (Executor)
- **Mais forte:** Plano concreto com estimativas realistas
- **Cego:** Ignorou a oportunidade de analytics (pode ser certoignorar)

---

## Chairman Synthesis

### Where the Council Agrees

1. **OwnerSection, ProgramSection, OrigemTypeSection PRECISAM de AlertDialog** — todos os 5 advisors convergiram. É o mínimo de consistência.

2. **Debug log estruturado é justificável** — pelo menos para erros e operações destrutivas. O custo de não ter é maior que o custo de implementar.

3. **Toast feedback em mutations que falham** —gap óbvio que todos identificaram.

### Where the Council Clashes

1. **Escopo do debug log:** Expansionist quer analytics completo. Executor quer só logs de erro. Contrarian quer separar log de debug de log de auditoria. **Resolução:** Começar com logs de erro + operações destrutivas. Analytics é YAGNI agora.

2. **Pipeline unificado:** Expansionist quer sistema de validação→retry→confirm→log→feedback. Executor diz que é overengineering. **Resolução:** Executor tem razão na fase atual. O pipeline emerge naturalmente quando o volume de erros justificar.

### Blind Spots the Council Caught

1. **Login com mensagem técnica** — Outsider identificou que erro do Supabase aparece para usuário final. Gap de UX.

2. **Relacionamentos Owner/Program → dados vinculados** — Contrarian questionou se deletar Owner cascata para contas vinculadas. Precisa verificar.

### The Recommendation

**Implementar em 3 camadas:**

**Camada 1 (imediato — 2-3h):** AlertDialog em Owner, Program e OrigemType sections. Copiar padrão do DeleteEntryDialog. Verificar se exclusão cascata corretamente.

**Camada 2 (curto prazo — 1-2h):** Toast feedback em mutations que falham. onError com toast.error em todas as mutations do useDatabase.

**Camada 3 (médio prazo — 3-4h):** `src/lib/logger.ts` simples:
- `logError(context, error)` → localStorage + console
- `logDestructiveOp(type, details)` → localStorage
- Flag: `VITE_ENABLE_DEBUG_LOG=true` em .env
- Só ativo em dev por padrão

### The One Thing to Do First

**Adicionar AlertDialog nos 3 componentes que faltam (OwnerSection, ProgramSection, OrigemTypeSection).** É a mudança de maior impacto com menor esforço. O padrão já existe no codebase. Copiar, ajustar texto, testar.
