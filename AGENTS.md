# MilesControl — Instruções para Agentes

> Projeto de gestão de milhas/pontos (milhagem). Leia o **hub abaixo** primeiro,
> depois carregue docs específicos conforme a categoria da tarefa.

> 📜 **Workflow canônico:** [`docs/WORKFLOW-MANIFEST.md`](docs/WORKFLOW-MANIFEST.md)
> Categorias, estados, comandos obrigatórios, alvo de PR e política de bypass.
> **Autoritativo** sobre definições conflitantes.

## ⚡ Mapa de Conhecimento

| Doc                                     | Conteúdo                                                                                             | Tamanho                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `docs/WORKFLOW-QUICKSTART.md`           | **Resumo executivo do workflow** (carregar em sessão feature)                                        | 1.5KB                               |
| `docs/STACK.md`                         | Stack técnica (React, Vite, Supabase, Tailwind)                                                      | 2KB                                 |
| `docs/ARCHITECTURE.md`                  | Estrutura de pastas e arquitetura                                                                    | 4.8KB                               |
| `docs/CONVENTIONS.md`                   | Índice dos slices de convenções (ver `docs/conventions/`)                                            | 1KB                                 |
| `docs/conventions/`                     | Slices por categoria: `common` (todas), `feature`, `bugfix`, `refactor`, `workflow`                  | ~30KB total                         |
| `docs/WORKFLOW.md`                      | Processos, scripts, fluxo completo + subagentes                                                      | 12.5KB                              |
| `docs/UI-GUIDE.md`                      | Design system, grid, cores, componentes                                                              | 3.9KB                               |
| `docs/DEBUG.md`                         | Debug, troubleshooting, logs                                                                         | 2.1KB                               |
| `docs/GIT-WORKFLOW.md`                  | Git, branch, PR, deploy                                                                              | 3.1KB                               |
| `docs/TESTING.md`                       | Estratégia de testes                                                                                 | 3.2KB                               |
| `docs/MAP.md`                           | Mapa completo do projeto + skills de subagentes                                                      | 5.6KB                               |
| `docs/CONTEXT-MANAGEMENT.md`            | Estratégia de lazy loading                                                                           | novo                                |
| `docs/fable-gates.md`                   | Gates INTENT, TWINS e AUTH do Fable Method                                                           | novo                                |
| `.pi/skills/code-review-graph/SKILL.md` | Mapeamento estrutural do código (CLI CRG v2.3.7, pipx): architecture, dead-code, communities, impact | nova — usar em auditorias e reviews |

### Delegação de subagentes

**Delegação econômica (obrigatória em toda delegação):** siga `compact-delegation` — contexto mínimo (task de 1-3 frases, sem histórico), retorno estruturado de campos-chave (nunca eco de arquivos/logs), sem herança de contexto. Para escopo estreito use `bounded-scout` (file|line|finding), para entender diffs use `diff-miner` (impact|risk|files), para falhas de teste use `test-triage` (cause|fix|evidence), para falhas do `pre-pr` use `pre-pr-triage` (rule|file|fix, só `❌` conta). Para resumo de entregas de um período (dia/semana), use `report-consolidation` → `npm run report:consolidate` (1 linha por PR, nunca commits). Subagentes mecânicos → perfil `efficient` via router.

## 🔥 Regras Essenciais (7)

1. **NUNCA direto na main** — branch obrigatória (`feat/`, `fix/`, `docs/`, `chore/`). Hook bloqueia.
2. **pre-pr + relatório HTML obrigatório** antes de todo PR (`npm run pre-pr`).
3. **git status ZERO** antes de PR/merge — sem arquivos uncommitted.
4. **Toda regra imutável TEM script de validação** — sem script, a regra não está completa.
5. **Sem arquivos órfãos** em `src/` (exceto entry points). Valida: `rule-14`.
6. **Sem duplicatas > 75%** em componentes. Valida: `rule-15`.
7. **Todo script em `scripts/` tem atalho npm**. Valida: `rule-16`.
8. **Skills do workflow e subagentes existem em `.pi/skills/`** — sem symlink quebrado ou skill faltando. Skills de subagente (`subagent-driven-development`, `dispatching-parallel-agents`) estão disponíveis para execução paralela e delegada. Valida: `rule-23`.
9. **`npm run session:start` obrigatório no início de toda sessão** — marcador de timestamp validado. Valida: `rule-26`.
10. **Council obrigatório no workflow feature** — veredito em `docs/council/`. Valida: `rule-27`.
11. **Spec técnica obrigatória no workflow refactor** — spec em `docs/superpowers/specs/`. Valida: `rule-28`.
12. **Prompt versioning** — todo prompt/skill modificado tem hash atualizado no manifesto. Valida: `rule-29`.
13. **Outcome grade ≥ 80%** — diff deve passar quality gates (console.log, tests, protegidos). Valida: `rule-30`.
14. **Toda lib em `src/lib/` tem test unitário** — exceções: db.ts, supabase.ts. Valida: `rule-31`.
15. **Todo componente customizado tem teste** — aplica a `src/components/ui/` custom e hooks. Valida: `rule-32`.
16. **🧠 INTENT Gate** — antes de qualquer mudança de comportamento, declare `INTENT: código faz X; teste espera Y; spec diz Z`. Se divergirem, não edite — reporte. Aplicado em `council-to-superpowers` e `writing-plans`. Valida: `rule-33`.
17. **🔁 TWINS Check** — ao corrigir um bug, busque o mesmo padrão no projeto todo e corrija todas as ocorrências. Declare `TWINS: searched <padrão> — found <N> locais`. Aplicado em `systematic-debugging`. Valida: `rule-34`.
18. **🔐 AUTH Gate** — antes de push/merge/deploy irreversível, exija as palavras exatas do usuário. Declare `AUTH: usuário disse "<citação>"`. Sem citação, não aja. Aplicado em `finishing-a-development-branch`. Valida: `rule-35`.
19. **Integração RTK ativa** — a extensão `.pi/extensions/rtk.ts` deve existir (versionada) e o binário `rtk` local deve ser >= 0.23.0; ausência do binário é skip não-falho (fail-open). Valida: `rule-37`.
20. **🔎 Code Review Gate** — todo PR exige revisão de código feita por **subagente especializado** (evidência: evento `code-review:done` com `subagent:true` na branch atual). Sem evidência, o pre-pr falha. Aplicado em `requesting-code-review`. Valida: `rule-38`.
21. **🛠️ Coding Gate** — toda mudança de código (src/, scripts/, tests/, .pi/) exige execução por **subagente especializado** (evidência: evento `coding:done` com `subagent:true` na branch atual). Sem evidência, o pre-pr falha. Aplicado em `subagent-driven-development` / `dispatching-parallel-agents`. Valida: `rule-39`.
22. **📐 Architect Gate** — estrutura Feature-First: módulos em `src/features/[feature]` com barrel `index.ts` e RLS verificado (`CREATE POLICY` com `USING (auth.uid())` em `supabase/migrations/`); vacuous se `src/features/` não existe. Valida: `rule-40`.
23. **🧹 Optimizer Gate** — hard limit de 150 linhas por arquivo em `src/` (diff-scoped contra main); arquivos novos grandes e arquivos que passam do limite falham; legados já grandes são grandfathered (warning). Aplicado no workflow refactor. Valida: `rule-41`.
24. **📊 Coverage Gate** — todo relatório de cobertura gerado (`npm run coverage`, provider v8) precisa ter ≥ 75% de linhas nas áreas de negócio (src/lib, kpi, workflow); relatório ausente é skip (fail-open — o nightly roda coverage + gate). Aplicado no pre-pr e nightly. Valida: `rule-42`.
25. **🗄️ Migration Gate** — migrations Supabase são **imutáveis** (nenhuma migration existente pode ser modificada na branch — diff-scoped contra main) e toda `CREATE TABLE` exige política RLS com `auth.uid()`. Previne schema drift. Valida: `rule-43`.
26. **🗃️ RTK Auditor** — coleções de dados (contas, clientes, vendas, entradas, alerts, owners, programs, origem_types) usam `createEntityAdapter` como normalização de cache com seletores memoizados; sem `any` em slices. Valida: `rule-44`.
27. **⚛️ React 19 Compliance** — priorizar `use()` (promises/context) sobre `useEffect` boilerplate e `useActionState`/`useFormStatus` em forms de transação; `any` é falha crítica; tipos espelhados do schema Supabase. Valida: `rule-45`.
28. **🧠 Token Sentinel** — todo turno de trabalho atualiza `docs/AI-SESSION-STATE.md` (estrutura obrigatória, ≤50 linhas) como último ato; hard-fail: estrutura ausente/inválida e arquivos `src/` >150 linhas na branch (diff-scoped). Valida: `rule-46`.
29. **🔌 MCP Bridge** — interface MCP documentada e versionada: config (`SERENA_MCP_URL` / `.mcp.json`) ou skill/script presente; extensão `mcp-bridge` em `.pi/extensions/`. Valida: `rule-47`.
30. **📡 Telemetry Auditor** — eficiência da IA registrada ao finalizar task (evento `telemetry:record`/`session:end`); lib `src/lib/aiTelemetry.ts` e tabela `ai_telemetry` íntegras (RLS). Valida: `rule-48`.

## 🎯 Sistema de Categorias (LAZY LOADING)

| Tipo         | Carregar                                                                                                                 | Workflow                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **feature**  | `WORKFLOW-QUICKSTART.md` + `conventions/common.md` + `conventions/feature.md` (`WORKFLOW.md` só on-demand — 5.5K tokens) | council → build → pre-pr → PR |
| **bugfix**   | `DEBUG.md` + `conventions/common.md` + `conventions/bugfix.md`                                                           | triagem → fix → pre-pr → PR   |
| **docs**     | (só este AGENTS.md)                                                                                                      | editar → pre-pr → PR          |
| **refactor** | `conventions/common.md` + `conventions/refactor.md` + `ARCHITECTURE.md`                                                  | spec → build → pre-pr → PR    |
| **chore**    | (só este AGENTS.md)                                                                                                      | executar → pre-pr → PR        |

## ⚠️ REGRA DOURADA: NÃO PRÉ-CARREGUE DOCS

Leia APENAS os docs da categoria escolhida. Se a categoria não estiver na tabela,
pergunte ao usuário. **Não leia docs "preventivamente".**

## 📋 Workflow Mínimo (6 passos)

1. `npm run session:start` — carrega handoff.md + pergunta categoria
2. Carregar docs da categoria (tabela acima)
3. Se **feature**: executar council-to-superpowers
4. **Navegação via Gate** — antes de ler arquivos-fonte inteiros, rode `npm run nav:gate` para decidir a ferramenta (code-review-graph padrão no pi; serena apenas se `SERENA_MCP_URL` definido; fallback `grep -rn` + `read` com offset/limit). Só use `read` completo quando a navegação estrutural não bastar.
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
