# Implementation Plan — Modo Offline Minimal

**Data:** 2026-07-09
**Spec:** `docs/archive/specs/2026-07-09-modo-offline-design.md`
**Estimativa:** 2-3 dias

## Fases

### Fase 1: Service Worker (Workbox) — 0.5 dia

**Tarefa 1.1:** Instalar Workbox
- `npm install workbox-window workbox-build`
- Configurar `vite.config.ts` com plugin `vite-plugin-pwa`

**Tarefa 1.2:** Configurar caching strategy
- Assets estáticos: CacheFirst
- API responses: StaleWhileRevalidate
- Offline fallback: cached page

**Tarefa 1.3:** Registrar Service Worker
- Adicionar registro no `main.tsx`
- Testar cache de assets

### Fase 2: Hook useOnlineStatus — 0.5 dia

**Tarefa 2.1:** Criar OnlineContext
- `src/contexts/OnlineContext.tsx`
- Estado: `isOnline`
- Eventos: `online`, `offline` do window

**Tarefa 2.2:** Integrar no App
- Adicionar `<OnlineProvider>` no `App.tsx`
- Exportar hook `useOnlineStatus()`

**Tarefa 2.3:** Testes unitários
- Testar hook com estado mockado
- Testar transições online/offline

### Fase 3: UI offline — 1 dia

**Tarefa 3.1:** Criar OfflineBanner
- `src/components/OfflineBanner.tsx`
- Banner discreto quando `!isOnline`
- Animação de entrada/saída

**Tarefa 3.2:** Integrar no layout
- Adicionar banner no header (AppSidebar ou App.tsx)

**Tarefa 3.3:** Desabilitar botões de ação
- EntryTable: desabilitar "Adicionar" e "Editar"
- SaleTable: desabilitar botões de ação
- GlobalSearch: manter funcional (busca local)

**Tarefa 3.4:** Tooltips informativos
- Botões desabilitados mostram "Requer conexão"

### Fase 4: Testes + PR — 0.5 dia

**Tarefa 4.1:** Testes unitários
- `useOnlineStatus` hook
- `OfflineBanner` componente
- Service Worker registration

**Tarefa 4.2:** Build verification
- `npm run build` sem erros
- Verificar SW no browser

**Tarefa 4.3:** PR + Report
- Branch `feat/sprint6-modo-offline`
- Relatório HTML
- Merge

## Ordem de execução

```
1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 4.2 → 4.3
```

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Workbox + Vite conflito | Alto | Usar `vite-plugin-pwa` (wrapper oficial) |
| SW cache antigo | Médio | Versionamento de cache via Workbox |
| React Query stale data | Baixo | `staleTime: 30s` já configurado |
