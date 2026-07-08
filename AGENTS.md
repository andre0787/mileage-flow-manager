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
| Git & deploy | `docs/GIT-WORKFLOW.md` |
| Testes | `docs/TESTING.md` |
| Mapa completo | `docs/MAP.md` |

## Regras Imutáveis

1. **Workflow obrigatório**: toda feature passa pelo `council-to-superpowers` — veja `docs/WORKFLOW.md`
2. **Grid máximo 2 colunas**: `grid-cols-1 sm:grid-cols-2` — veja `docs/UI-GUIDE.md`
3. **DRY**: regra de negócio em ponto único em `src/lib/` — veja `docs/CONVENTIONS.md`
4. **Bateria pré-deploy**: build + testes E2E — veja `docs/TESTING.md`
5. **Ponytail mode**: stdlib/nativo primeiro, sem abstrações especulativas
6. **Interface**: português (pt-BR)

## Começando

Sempre leia `docs/WORKFLOW.md` + `docs/ARCHITECTURE.md` + `docs/CONVENTIONS.md` antes de codificar.

Para contexto de sessões anteriores, veja `MEMORY.md`.
