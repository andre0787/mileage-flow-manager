# 🐛 Debug — MilesControl

> Guia rápido de debug. Leia antes de investigar bugs.

## 1. Logger Estruturado

O logger em `src/lib/logger.ts` persiste eventos no localStorage.

### Ativação

```env
VITE_ENABLE_DEBUG_LOG=true   # .env.local
```

### Funções

| Função | Quando usar |
|--------|------------|
| `logInfo(ctx, details?)` | Fluxo normal (fetch, transição de estado) |
| `logWarn(ctx, details?)` | Estado inesperado não crítico |
| `logError(ctx, error)` | Erro em mutation/operação |
| `logDestructiveOp(type, ctx, details?)` | Delete, clear, cancel |

### Visualização

1. Abra DevTools (F12) → Console: `JSON.parse(localStorage.getItem('mc_debug_logs'))`
2. Ou crie snippet no DevTools:
   ```js
   console.table(JSON.parse(localStorage.getItem('mc_debug_logs')));
   ```

## 2. Breakpoints (VS Code)

Com o Vite rodando (`npm run dev`):

1. **F5** → selecione **"Debug App"**
2. Chrome abre em modo debug
3. Adicione breakpoints nos arquivos `.ts`/`.tsx`
4. Recarregue a página ou interaja

**Config:** `.vscode/launch.json`

### Debug de Testes

Abra um `.test.ts` ou `.spec.ts` e pressione **F5** → selecione **"Debug Tests (current file)"**.

## 3. React DevTools

- Extensão: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Aba ➡️ Components: inspecione props/state
- Aba ➡️ Profiler: grave interações

## 4. TanStack Query DevTools

Ativo em dev (`VITE_ENABLE_DEBUG_LOG=true`). Aba no canto inferior direito:
- Veja cache, staleTime, queries ativas
- Invalide queries manualmente

## 5. Logs Rápidos (sem logger)

```ts
// No código
console.log({ someVar });  // objeto nomeado
console.trace();           // stack trace

// No teste
page.on("console", msg => console.log(msg.text()));
```

## 6. Playwright Trace

Quando um teste E2E falha no CI:
1. Baixe `playwright-report/` do artifact do GitHub Actions
2. Abra `index.html` no navegador
3. Veja trace, video, screenshot da falha

---

_Consulte `docs/CONVENTIONS.md` → "Debug" para convenções._
