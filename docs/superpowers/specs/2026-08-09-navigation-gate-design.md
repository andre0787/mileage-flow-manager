# Navigation Gate — Design (serena vs code-review-graph)

## Contexto

A auditoria de workflow (AUDIT-WORKFLOW-2026-08-09, achado #10) identificou que
o `AGENTS.md` e o `docs/CONVENTIONS.md` mandatam "Navegação Serena-First"
(`serena_get_symbols_overview`, `serena_find_symbol`), mas **o MCP do Serena não
está configurado no pi** (apenas no VS Code `mcp.json`). Além disso:

- O pi **não suporta MCP nativamente** (decisão de design do pi; ver skill
  `.pi/skills/code-review-graph/SKILL.md`).
- O Serena roda via `uvx` (`mcp.json`: `uvx --from git+https://github.com/oraios/serena ...`),
  e **`uvx` está ausente** no ambiente.
- O `code-review-graph` (CRG) v2.3.7 está instalado via `pipx` (CLI direta,
  sem MCP) e há skill versionada em `.pi/skills/code-review-graph/SKILL.md`.

## Decisão

**CRG é o navegador estrutural padrão no pi.** Serena fica como fallback
opcional quando o MCP estiver realmente disponível no ambiente (VS Code).
Um **gate de análise** (`navigation-gate.mjs`) decide dinamicamente qual
ferramenta usar, eliminando o mandato cego a uma ferramenta indisponível.

## Arquivos alvo

| Arquivo | Mudança |
|---------|---------|
| `scripts/navigation-gate.mjs` | **novo** — gate de decisão de navegação |
| `package.json` | atalho npm `nav:gate` (rule-16) |
| `docs/CONVENTIONS.md` | seção "Navegação de Código" aponta para o gate |
| `AGENTS.md` | passo 4 do workflow mínimo aponta para o gate |

## Comportamento do gate

```bash
node scripts/navigation-gate.mjs            # decide e imprime instruções
node scripts/navigation-gate.mjs --json     # saída JSON parseável
node scripts/navigation-gate.mjs --force crg|serena|grep   # override (testes)
```

Lógica de decisão (primeiro match vence):

1. `--force <tool>` → usa o tool forçado (exit 0).
2. `code-review-graph` disponível (`which code-review-graph` + versão) → **crg**.
3. Serena disponível (`SERENA_MCP_URL` definido) → **serena**.
4. Senão → **grep** (fallback: `grep -rn` + `read` com offset/limit).

Saída humana (default):
- Estratégia escolhida (`crg | serena | grep`)
- Razão da escolha (1 linha)
- Comandos recomendados (CRG: `code-review-graph architecture|query|impact`; etc.)

Saída JSON (`--json`):
```json
{ "tool": "crg", "reason": "...", "available": { "crg": true, "serena": false } }
```

Exit codes: `0` = decidido; `1` = erro de uso (`--force` inválido).

## Restrições

- Zero deps (padrão do projeto: scripts ponytail com `node:` built-ins).
- NÃO executa `code-review-graph` além de `--version` para detecção (read-only).
- Teste unitário em `tests/unit/scripts-navigation-gate.test.ts` cobre:
  `--force` de cada tool, detecção por `which` mockado (env), e JSON válido.
- Regra #16 (atalho npm) e #30 (outcome grade) aplicáveis.

## Validação

- `node scripts/navigation-gate.mjs` → exit 0, estratégia `crg` (ambiente real).
- `npm run nav:gate -- --json` → JSON com `"tool": "crg"`.
- `npx vitest run tests/unit/scripts-navigation-gate.test.ts` → verde.
- pre-pr --strict 0 errors (rule-16, rule-30, docs válidos).
