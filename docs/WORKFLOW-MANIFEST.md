# 📜 Workflow Manifest — MilesControl

> **Fonte única e canônica** para o workflow do projeto.
> Todo outro documento que define workflow DEVE referenciar este manifesto.
> Definições conflitantes em outros docs são **não autoritativas** até serem atualizadas.

---

## 1. Categorias de Trabalho

| Categoria | Quando usar | Docs autorizados | Workflow |
|-----------|-------------|------------------|----------|
| **feature** | Nova funcionalidade ou modificação significativa | `WORKFLOW.md` + `CONVENTIONS.md` | council → build → pre-pr → PR |
| **bugfix** | Correção de bug | `DEBUG.md` + `CONVENTIONS.md` (seção bugs) | triagem → fix → pre-pr → PR |
| **docs** | Documentação (exceto código) | `AGENTS.md` | editar → pre-pr → PR |
| **refactor** | Mudança estrutural sem mudar comportamento | `CONVENTIONS.md` + `ARCHITECTURE.md` | spec → build → pre-pr → PR |
| **chore** | Tarefa de manutenção/infra | `AGENTS.md` | executar → pre-pr → PR |

> Se a categoria não estiver na tabela, pergunte ao usuário.

---

## 2. Estados de Task Card

Cada card em `docs/tasks/` segue este ciclo de estados:

```
pending → planned → implementing → verified → review → done
     ↘ blocked ↗
```

| Estado | Definição |
|--------|-----------|
| **pending** | Card registrado, não iniciado |
| **planned** | Branch criada, plano definido |
| **implementing** | Código sendo escrito |
| **verified** | Testes passando localmente, pre-pr ok |
| **review** | PR aberto, aguardando review/CI |
| **done** | Mergeado na `main` |
| **blocked** | Aguardando dependência externa (dependeDe) |

Um card blocked pode retornar a **pending** ou **planned** quando a dependência for resolvida.

---

## 3. Comandos Obrigatórios

Todo ciclo de trabalho DEVE usar estes comandos na ordem:

| Passo | Comando | Obrigatório | Quando |
|-------|---------|-------------|--------|
| 1 | `npm run session:start` | ✅ Sempre | Início de toda sessão |
| 2 | Carregar docs da categoria | ✅ Sempre | Após definir categoria |
| 3 | `npm run pre-pr` | ✅ Antes de todo PR | Gera relatório + valida |
| 4 | `npm run report "<desc>" --write` | ✅ Antes de todo PR | Relatório HTML detalhado |
| 5 | `npm run session:end "<msg>"` | ✅ Final da sessão | Commit + handoff + push |

### Comandos auxiliares

| Comando | Uso |
|---------|-----|
| `npm run handoff` | Atualiza `docs/handoff.md` manualmente |
| `npm run health:deploy` | Verifica status do último deploy |
| `npm run retro --write` | Gera retrospectiva do período |
| `npm run think "<ideia>"` | Registra ideia em `IDEIAS.md` |
| `npm run think "<bug>" --bug` | Registra bug como issue |

---

## 4. Alvo de PR

**Todo PR DEVE ter `main` como base (target).**

Não existe branch `develop` como alvo. O fluxo é:

```
branch de trabalho → PR → merge → main → deploy automático (Vercel)
```

> ⚠️ **Drift resolvido:** `README.md` anteriormente citava `develop` como alvo.
> A fonte da verdade é este manifesto: **alvo = `main`**.

### Nomenclatura de PR

```
<tipo> <escopo> — <descrição>
```

- `tipo`: `feat`, `fix`, `docs`, `refactor`, `chore`
- `escopo` (opcional): curto, entre parênteses
- Separador: ` — ` (espaço + travessão + espaço)
- `descrição`: português, capitalizada, máx 80 caracteres

Exemplos:
```
docs: workflow-manifest — documento canônico de workflow
feat: exportar vendas para CSV
fix: saldo não atualiza após entrada
chore: atualizar dependências
```

---

## 5. Artefatos por Estado

Cada etapa do workflow gera artefatos obrigatórios:

| Fase | Artefato | Localização |
|------|----------|-------------|
| **Decisão** | Veredito do LLM Council | `docs/council/<data>-<topico>-veredito.md` |
| **Spec** | Especificação técnica | `docs/superpowers/specs/` |
| **Plano** | Plano de execução | `docs/superpowers/plans/` |
| **Implementação** | Código + testes | `src/` + `tests/` |
| **Pré-PR** | Relatório HTML | `docs/reports/<data>/<prefixo>-<data>-<nome>.html` |
| **Pós-merge** | Handoff atualizado | `docs/handoff.md` |

### Estrutura de relatórios

```
docs/reports/<YYYY-MM-DD>/<prefixo>-YYYY-MM-DD-<nome>.html
```

Prefixos válidos: `PR<num>`, `auto`, `fix`, `feat`, `docs`, `chore`.

---

## 6. Política de Bypass

### Bypass permitido (emergencial)

| Bypass | Flag | Quando usar |
|--------|------|-------------|
| Pular pre-pr | `--skip-pre-pr` | Correção crítica em produção (hotfix) |
| Pular verify-docs | `--skip-verify-docs` | Docs quebrados não relacionados à mudança |
| Pular testes | `--skip-tests` | Apenas se CI vai rodar e testes são lentos |
| Commit direto na main | `--no-verify` | **NUNCA** (bloqueado pelo hook) |

### Bypass NUNCA permitido

- Commit direto na `main` (hook bloqueia)
- Pular validação de nome de PR (`rule-22`)
- Merge sem CI verde
- Pular `session:start` (mas pode rodar manualmente)

### Procedimento de bypass

1. O bypass DEVE ser justificado no corpo do PR
2. O relatório de pre-pr (se pulado) DEVE ser gerado após o merge
3. Bypass sem justificativa = blocker no code review

---

## 7. Imutabilidades

Estes itens NUNCA podem ser alterados sem aprovação explícita:

1. **Alvo de PR = `main`**
2. **pre-pr obrigatório antes de todo PR**
3. **git status ZERO antes de merge**
4. **Regras essenciais em `AGENTS.md`** (as 8 regras)
5. **Workflow por categoria** (tabela na seção 1)

---

## 8. Referências

Este manifesto é referenciado por:

| Documento | Natureza da referência |
|-----------|----------------------|
| `AGENTS.md` | Hub principal → aponta para manifesto |
| `WORKFLOW.md` | Detalhamento do council-to-superpowers → aponta para manifesto |
| `README.md` | Visão geral do projeto → aponta para manifesto |
| `docs/MAP.md` | Mapa do projeto → lista manifesto |

---

## Histórico

| Data | Mudança |
|------|---------|
| 2026-07-18 | Criação — consolida WORKFLOW.md, AGENTS.md, README.md |
