# MilesControl — Instruções para Agentes

> Projeto de gestão de milhas/pontos (milhagem). Leia o **hub abaixo** primeiro,
> depois carregue docs específicos conforme a categoria da tarefa.

> 📜 **Workflow canônico:** [`docs/WORKFLOW-MANIFEST.md`](docs/WORKFLOW-MANIFEST.md)
> Categorias, estados, comandos obrigatórios, alvo de PR e política de bypass.
> **Autoritativo** sobre definições conflitantes.

## ⚡ Mapa de Conhecimento

| Doc | Conteúdo | Tamanho |
|-----|----------|---------|
| `docs/STACK.md` | Stack técnica (React, Vite, Supabase, Tailwind) | 2KB |
| `docs/ARCHITECTURE.md` | Estrutura de pastas e arquitetura | 4.8KB |
| `docs/CONVENTIONS.md` | Regras detalhadas, padrões de código, DRY, UI | 20KB |
| `docs/WORKFLOW.md` | Processos, scripts, fluxo completo + subagentes | 12.5KB |
| `docs/UI-GUIDE.md` | Design system, grid, cores, componentes | 3.9KB |
| `docs/DEBUG.md` | Debug, troubleshooting, logs | 2.1KB |
| `docs/GIT-WORKFLOW.md` | Git, branch, PR, deploy | 3.1KB |
| `docs/TESTING.md` | Estratégia de testes | 3.2KB |
| `docs/MAP.md` | Mapa completo do projeto + skills de subagentes | 5.6KB |
| `docs/CONTEXT-MANAGEMENT.md` | Estratégia de lazy loading | novo |
| `docs/fable-gates.md` | Gates INTENT, TWINS e AUTH do Fable Method | novo |
| `.pi/skills/code-review-graph/SKILL.md` | Mapeamento estrutural do código (CLI CRG v2.3.7, pipx): architecture, dead-code, communities, impact | nova — usar em auditorias e reviews |

### Roteamento de subagentes

Antes de cada `subagent_gate`, resolva a tarefa com `npm run llm:route`. Use exatamente `model`, `fallbackModels` e `retrySafety` retornados; não escolha modelo inline nem omita `model` em uma tarefa roteada. Registre conclusão somente com metadados sanitizados. Consulte [`docs/LLM-ROUTER.md`](docs/LLM-ROUTER.md) para o contrato operacional.

## 🔥 Regras Essenciais (7)

1. **NUNCA direto na main** — branch obrigatória (`feat/`, `fix/`, `docs/`, `chore/`). Hook bloqueia.
2. **pre-pr + relatório HTML obrigatório** antes de todo PR (`npm run pre-pr`).
3. **git status ZERO** antes de PR/merge — sem arquivos uncommitted.
4. **Toda regra imutável TEM script de validação** — sem script, a regra não está completa.
5. **Sem arquivos órfãos** em `src/` (exceto entry points). Valida: `rule-14`.
6. **Sem duplicatas > 75%** em componentes. Valida: `rule-15`.
7. **Todo script em `scripts/` tem atalho npm**. Valida: `rule-16`.
8. **Skills do workflow e subagentes existem em `.pi/skills/`** — sem symlink quebrado ou skill faltando. Skills de subagente (`subagent-driven-development`, `dispatching-parallel-agents`) estão disponíveis para execução paralela e delegada. Valida: `rule-23`.
26. **`npm run session:start` obrigatório no início de toda sessão** — marcador de timestamp validado. Valida: `rule-26`.
27. **Council obrigatório no workflow feature** — veredito em `docs/council/`. Valida: `rule-27`.
28. **Spec técnica obrigatória no workflow refactor** — spec em `docs/superpowers/specs/`. Valida: `rule-28`.
29. **Prompt versioning** — todo prompt/skill modificado tem hash atualizado no manifesto. Valida: `rule-29`.
30. **Outcome grade ≥ 80%** — diff deve passar quality gates (console.log, tests, protegidos). Valida: `rule-30`.
31. **Toda lib em `src/lib/` tem test unitário** — exceções: db.ts, supabase.ts. Valida: `rule-31`.
32. **Todo componente customizado tem teste** — aplica a `src/components/ui/` custom e hooks. Valida: `rule-32`.
33. **🧠 INTENT Gate** — antes de qualquer mudança de comportamento, declare `INTENT: código faz X; teste espera Y; spec diz Z`. Se divergirem, não edite — reporte. Aplicado em `council-to-superpowers` e `writing-plans`. Valida: `rule-33`.
34. **🔁 TWINS Check** — ao corrigir um bug, busque o mesmo padrão no projeto todo e corrija todas as ocorrências. Declare `TWINS: searched <padrão> — found <N> locais`. Aplicado em `systematic-debugging`. Valida: `rule-34`.
35. **🔐 AUTH Gate** — antes de push/merge/deploy irreversível, exija as palavras exatas do usuário. Declare `AUTH: usuário disse "<citação>"`. Sem citação, não aja. Aplicado em `finishing-a-development-branch`. Valida: `rule-35`.

## 🎯 Sistema de Categorias (LAZY LOADING)

| Tipo | Carregar | Workflow |
|------|----------|----------|
| **feature** | `WORKFLOW.md` + `CONVENTIONS.md` (seções relevantes) | council → build → pre-pr → PR |
| **bugfix** | `DEBUG.md` + `CONVENTIONS.md` (seção bugs) | triagem → fix → pre-pr → PR |
| **docs** | (só este AGENTS.md) | editar → pre-pr → PR |
| **refactor** | `CONVENTIONS.md` + `ARCHITECTURE.md` | spec → build → pre-pr → PR |
| **chore** | (só este AGENTS.md) | executar → pre-pr → PR |

## ⚠️ REGRA DOURADA: NÃO PRÉ-CARREGUE DOCS

Leia APENAS os docs da categoria escolhida. Se a categoria não estiver na tabela,
pergunte ao usuário. **Não leia docs "preventivamente".**

## 📋 Workflow Mínimo (6 passos)

1. `npm run session:start` — carrega handoff.md + pergunta categoria
2. Carregar docs da categoria (tabela acima)
3. Se **feature**: executar council-to-superpowers
4. **Navegação Serena-First** — antes de ler arquivos-fonte, use `serena_get_symbols_overview` ou `serena_find_symbol`. Só use `read` quando a navegação simbólica não bastar.
5. Build / editar código
6. `npm run pre-pr` (relatório automático + validações)
7. Criar PR → `npm run post-pr` (renomeia relatório)

## 🐞 Registro de Bugs

Bug encontrado durante desenvolvimento? Registre em **GitHub Issues** com label `bug`.
Use: `gh issue create --title "descrição" --label bug`

## 📋 handoff.md

O snapshot do projeto no topo do handoff.md é gerado automaticamente pelo
`npm run handoff:snapshot`. Não edite manualmente.

## ⚡ AUTO-INICIALIZAÇÃO

Ao iniciar uma nova sessão:
1. Execute `npm run session:start` (GATILHO AUTOMÁTICO)
2. Leia `docs/handoff.md` (já contém snapshot + estado)
3. Informe a categoria da tarefa
4. Carregue os docs da categoria
