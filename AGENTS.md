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
4. **CI/CD obrigatório**: CI roda build + testes em todo PR (`.github/workflows/ci.yml`). Deploy automático no merge (`.github/workflows/deploy.yml`). — veja `docs/GIT-WORKFLOW.md`
5. **Ponytail mode**: stdlib/nativo primeiro, sem abstrações especulativas
6. **Interface**: português (pt-BR)
7. **🔴 Relatório HTML obrigatório antes do PR**: toda branch que altera código OU docs DEVE gerar relatório em `docs/reports/<prefixo>-YYYY-MM-DD-<nome>.html` antes do PR. Prefixos: `PR<num>`, `Sprint<letra>`, `auto`, `fix`, `feat`, `docs`, `chore`. Template: `/report`. Execute `node scripts/verify-docs.mjs` para verificar integridade dos docs antes do PR.
8. **📋 HANDOFF.md obrigatório no início da sessão**: leia `HANDOFF.md` antes de qualquer trabalho. Atualize antes de `/new`, quando a sessão atingir ~12+ turns, **ou sempre que criar/merger um PR**. O estado da sessão anterior é restaurado via este arquivo.
9. **🧹 Limpeza obrigatória antes de PR/merge**: verifique `git status` — ZERO arquivos uncommitted. Inclui código, docs, council verdicts, plans, specs, package.json/lock, relatórios. Veja `docs/CONVENTIONS.md` → "Limpeza Pós-Sessão".
10. **🐞 Registro de bugs obrigatório**: todo bug encontrado durante desenvolvimento DEVE ser registrado em `docs/AGENDA.md` → "🐞 Bugs Encontrados". Veja `docs/CONVENTIONS.md` → "Registro de Bugs".

## Começando

Ordem obrigatória no início de cada sessão:

1. **Rodar `npm run session:start`** — extrai resumo comprimido de HANDOFF + AGENDA + regras ativas (~400 tokens)
2. **Ler `HANDOFF.md`** — contexto completo da sessão anterior
3. **Ler `docs/AGENDA.md`** — sprint board
4. **Ler `docs/WORKFLOW.md`** (seção Scripts de Workflow) — processos e atalhos
5. **Ler `docs/ARCHITECTURE.md`** — estrutura do projeto
6. **Ler `docs/CONVENTIONS.md`** — padrões de código

Para contexto histórico de sessões anteriores, veja também `MEMORY.md`.

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
