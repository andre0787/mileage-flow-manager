# MilesControl — Instruções para Agentes

> Projeto de gestão de milhas/pontos (milhagem). Leia o **sumário executivo** abaixo e depois consulte os docs específicos em `docs/`.

## Sumário Executivo

| O quê | Onde |
|-------|------|
| Stack & comandos | `docs/STACK.md` |
| Arquitetura & pastas | `docs/ARCHITECTURE.md` |
| Convenções de código | `docs/CONVENTIONS.md` |
| Design system & UI | `docs/UI-GUIDE.md` |
| Workflow obrigatório | `docs/WORKFLOW.md` |
| Sprint & tarefas | `docs/AGENDA.md` |
| Git & deploy | `docs/GIT-WORKFLOW.md` |
| Testes | `docs/TESTING.md` |
| Mapa completo | `docs/MAP.md` |
| Debug | `docs/DEBUG.md` |

## Regras Imutáveis

1. **Workflow obrigatório**: toda feature passa pelo `council-to-superpowers` — veja `docs/WORKFLOW.md`
2. **Grid máximo 2 colunas**: `grid-cols-1 sm:grid-cols-2` — veja `docs/UI-GUIDE.md`
3. **DRY**: regra de negócio em ponto único em `src/lib/` — veja `docs/CONVENTIONS.md`
4. **🔥 Branch obrigatória — NUNCA direto na main**: toda alteração de código DEVE ser feita em branch (`feat/`, `fix/`, `docs/`, `chore/`). `main` só recebe via PR mergeado. Nem commit, nem push, nem revert direto. A proteção é automatizada pelo pre-commit hook (`.githooks/pre-commit`). — veja `docs/GIT-WORKFLOW.md`
5. **CI/CD obrigatório**: CI roda build + testes em todo PR (`.github/workflows/ci.yml`). Deploy automático no merge (`.github/workflows/deploy.yml`). — veja `docs/GIT-WORKFLOW.md`
6. **Ponytail mode**: stdlib/nativo primeiro, sem abstrações especulativas
7. **Interface**: português (pt-BR)
8. **🔴 Relatório HTML obrigatório antes do PR — NUNCA PULAR**: toda branch que altera código OU docs (qualquer tamanho, 1 linha que seja) DEVE gerar relatório em `docs/reports/<data>/<prefixo>-YYYY-MM-DD-<nome>.html` antes do PR. Prefixos: `PR<num>`, `Sprint<letra>`, `auto`, `fix`, `feat`, `docs`, `chore`. Template: `/report`. O relatório DEVE incluir seções: **🏷️ Nível de Risco**, **✅ Checklist de Revisão**, **🎯 Benefícios**, **🏢 Impacto no Negócio**, **📸 Evidências**, **⚡ Consumo de Tokens**, **📋 Detalhamento por Item**. Use `--benefits`, `--impact`, `--evidence`, `--before`, `--after` e `--rows` no script. O relatório é **gerado automaticamente** pelo `npm run pre-pr` (que FALHA se não conseguir gerar). A nomenclatura DEVE conter o número do PR: `PR<num>-YYYY-MM-DD-<nome>.html`. Se o `pre-pr` não gerar, gere manualmente com `npm run report "descrição" --benefits "..." --impact "..." --write`. Execute `node scripts/verify-docs.mjs` para verificar integridade dos docs antes do PR. **Imediatamente após criar o PR**, execute `npm run post-pr` para renomear o relatório com o prefixo `PR<num>` correto — ele commita e pusha a renomeação automaticamente. A validação roda via `scripts/rules/rule-17-report-prefix.mjs`.
9. **📋 docs/handoff.md obrigatório no início da sessão**: leia `docs/handoff.md` antes de qualquer trabalho. Atualize antes de `/new`, quando a sessão atingir ~12+ turns, **ou sempre que criar/merger um PR**. O estado da sessão anterior é restaurado via este arquivo.
10. **🧹 Limpeza obrigatória antes de PR/merge**: verifique `git status` — ZERO arquivos uncommitted. Inclui código, docs, council verdicts, plans, specs, package.json/lock, relatórios. Veja `docs/CONVENTIONS.md` → "Limpeza Pós-Sessão".
11. **🐞 Registro de bugs obrigatório**: todo bug encontrado durante desenvolvimento DEVE ser registrado em `docs/AGENDA.md` → "🐞 Bugs Encontrados". Veja `docs/CONVENTIONS.md` → "Registro de Bugs".
12. **💭 Ideias externas**: use `npm run think "ideia"` para capturar pensamentos fora do projeto. Se for urgente, `--immediate`. Se for bug, `--bug`.
13. **🔬 Toda regra imutável DEVE ter validação automática**: ao definir uma nova regra imutável neste arquivo, crie **imediatamente** um script de verificação que impeça sua violação (ex: git hook, script npm, CI check). Sem o script, a regra não está completa. — veja `docs/CONVENTIONS.md` → "Validação Automática de Regras"
14. **📁 Sem arquivos órfãos em `src/`**: todo arquivo `.ts`/`.tsx` em `src/` DEVE ser importado por pelo menos 1 outro arquivo. Exceções: entry points (`main.tsx`, `vite-env.d.ts`). A validação roda no `pre-pr` via `scripts/rules/rule-14-orphan-files.mjs`. — veja `docs/CONVENTIONS.md` → "Arquivos Órfãos"
15. **🔄 Sem duplicatas de código > 75%**: componentes `.tsx` em `src/components/` (exceto `ui/`) não podem ter similaridade Dice > 75%. A validação roda no `pre-pr` via `scripts/rules/rule-15-duplicate-code.mjs`. — veja `docs/CONVENTIONS.md` → "Código Duplicado"
16. **📜 Scripts têm atalho npm**: todo `.mjs`/`.js` em `scripts/` (exceto `lib.mjs`) DEVE ter um script npm correspondente em `package.json`. A validação roda no `pre-pr` via `scripts/rules/rule-16-orphan-scripts.mjs`. — veja `docs/CONVENTIONS.md` → "Scripts Órfãos"
17. **📋 Prefixo PR<num> obrigatório em relatórios**: se há PR aberto para a branch, todo relatório em `docs/reports/<data>/` DEVE ter prefixo `PR<num>`. A validação roda no `pre-pr` via `scripts/rules/rule-17-report-prefix.mjs`. Para corrigir: `npm run post-pr`. — veja `docs/CONVENTIONS.md` → "Relatórios HTML"
18. **📁 Sem arquivos duplicados entre raiz e docs/**: um arquivo `.md` NÃO pode existir simultaneamente na raiz do projeto e dentro de `docs/` (mesmo nome, case-insensitive). Isso previne confusão de merge. A validação roda no `pre-pr` via `scripts/rules/rule-18-no-duplicate-root-docs.mjs`. — veja `docs/CONVENTIONS.md` → "Arquivos Duplicados"
19. **📦 Consistência de estoque**: toda chamada `invalidateQueries` DEVE usar `refetchType: 'all'` para garantir que o estoque reflete corretamente em todos os lugares. Toda mutation que altera saldo de conta DEVE usar `calcAccountUpdate`. A validação roda no `pre-pr` via `scripts/rules/rule-19-stock-validation.mjs`. — veja `docs/CONVENTIONS.md` → "Estoque"
20. **🔄 Atualização otimista de cache para tipos de origem**: ao criar um novo tipo de origem, a mutation DEVE fazer `setQueryData` otimista para que o dropdown apareça instantaneamente. A validação roda no `pre-pr` via `scripts/rules/rule-19-stock-validation.mjs`. — veja `docs/CONVENTIONS.md` → "Tipos de Origem"

## Começando — ⚡ AUTO-INICIALIZAÇÃO

**Regra:** ao iniciar uma nova sessão, o agente DEVE executar `npm run session:start`
**antes de qualquer outra ação** (antes de ler arquivos, antes de responder ao usuário,
antes de qualquer tool call). Este é o gatilho automático do workflow.

### Por que isso funciona

O `AGENTS.md` é carregado como instrução de projeto por todos os harnesses suportados
(pi, OpenCode, Claude Code). Ao ler "execute X automaticamente no início", o LLM
interpreta como uma ordem direta e executa.

### Fluxo de decisão (2 gatilhos)

```
npm run session:start
  │
  ├─ docs/handoff.md tem "In Progress"?
  │   ├─ SIM  → continua de onde parou
  │   └─ NÃO  →
  │
  ├─ docs/IDEIAS.md tem pendentes?
  │   ├─ SIM  → pergunta ao usuário qual consumir
  │   └─ NÃO  →
  │
  └─ pergunta "o que vamos fazer hoje?"
```

### Ordem exata

```
1. npm run session:start           ← execução automática (GATILHO)
2. Verifica docs/handoff.md + IDEIAS.md    ← decisão do que fazer
3. read docs/AGENDA.md             ← sprint board (se for trabalhar em sprint)
4. read docs/WORKFLOW.md           ← processos + scripts (se for feature)
5. read docs/ARCHITECTURE.md       ← estrutura (se for código)
6. read docs/CONVENTIONS.md        ← padrões (se for código)
```

> Após `session:start`, o agente tem o resumo em ~300 tokens com branch, commit,
> backlog, bugs, **ideias pendentes**, e uma dica do que fazer.
> Ele pergunta ao usuário antes de iniciar qualquer trabalho.

Para contexto histórico de sessões anteriores, veja também `docs/handoff.md` e `docs/memory.md`.

## Compatibilidade Cross-Harness

Este projeto é usado com pi (harness principal), Claude Code e OpenCode.
Todas as skills em `.pi/skills/` seguem o Agent Skills standard e funcionam
nos três. Para usar a skill `handoff` em outros harnesses:

- **Claude Code**: adicionar em `.claude/settings.local.json`:
  ```json
  { "skills": ["../.pi/skills/handoff"] }
  ```
- **OpenCode**: adicionar em `.opencode/settings.json`:
  ```json
  { "skills": ["../.pi/skills/handoff"] }
  ```

> ✅ Criados na Sprint B.
