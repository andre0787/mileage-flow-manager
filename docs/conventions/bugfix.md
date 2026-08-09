# 🐛 Convenções de Bugfix — MilesControl

> Slice de [`docs/CONVENTIONS.md`](../CONVENTIONS.md) — índice com todos os slices.
> Carregado na categoria **bugfix** (junto de `conventions/common.md` e `DEBUG.md`).

> Carregado na categoria **bugfix** (junto de DEBUG.md e conventions/common.md).

## 🐞 Registro de Bugs

**Todo bug encontrado durante desenvolvimento DEVE virar GitHub Issue** com label `bug`, mesmo que corrigido na hora.

### Como registrar:
- Use `gh issue create --title "descrição" --label bug`.
- No PR, referencie o número da issue quando a correção fizer parte da mesma entrega.

### Modos de registro:

1. **Manual:** usuário diz "registra bug: ..." e o agente adiciona na tabela
2. **Automático:** o agente registra bugs automaticamente quando:
   - Encontra um bug durante code review ou análise de PR
   - Identifica um bug durante desenvolvimento de feature
   - Testes falham revelando bug legítimo (não flaky)
   - Um bug é corrigido no mesmo PR — registra como corrigido

> O agente sempre pergunta antes de registrar algo que não seja claramente um bug.
> Dúvida = não registra.

### Por quê?
- Cria rastro histórico do que já quebrou
- Ajuda a validar backlog (se um bug aparece várias vezes, merece atenção)
- Evita regressão do mesmo bug em PR futuro

## Debug

Ver `docs/DEBUG.md` para guia completo.

### Convenções

- **Logger:** usar `logInfo()`/`logWarn()`/`logError()`/`logDestructiveOp()` de `@/lib/logger`
- **Ativação:** `VITE_ENABLE_DEBUG_LOG=true` no `.env.local`
- **Persistência:** logs ficam no localStorage (`mc_debug_logs`), últimos 100
- **Breakpoints:** `.vscode/launch.json` configurado — F5 com Vite rodando
- **Testes:** F5 com arquivo de teste aberto
- **Console.log:** só em dev, remover antes do PR (CRLF)
