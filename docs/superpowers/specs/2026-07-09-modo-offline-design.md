# Design Spec — Modo Offline Minimal

**Data:** 2026-07-09
**Status:** Aprovado (council + usuário)
**Estimativa:** 2-3 dias

## Problema

Sem conexão com a internet, o MilesControl fica inutilizável. O usuário (agente de viagem) pode estar em trânsito, aeroporto ou hotel com Wi-Fi instável.

## Solução

Modo offline minimal com 3 componentes:

### 1. Service Worker (Workbox)
- Cache de assets estáticos (JS, CSS, fonts, imagens)
- Cache de API responses do Supabase (stale-while-revalidate)
- Offline fallback para navegação

### 2. Hook `useOnlineStatus()`
- Detecta estado da conexão via `navigator.onLine` + eventos `online`/`offline`
- Exposto via Context para toda a app

### 3. Banner + Botões desabilitados
- Banner "Sem conexão" quando offline
- Botões de criação/edição desabilitados (mantém leitura)
- Refetch automático quando voltar online

## O que NÃO fazemos

- ❌ IndexedDB para persistência local
- ❌ Fila de mutações (criar/editar offline)
- ❌ Conflict resolution
- ❌ Sync offline → online
- ❌ PWA installable (futuro)

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `vite.config.ts` | Configurar Workbox plugin |
| `src/contexts/OnlineContext.tsx` | Novo — hook + provider |
| `src/App.tsx` | Adicionar OnlineProvider |
| `src/components/OfflineBanner.tsx` | Novo — banner quando offline |
| `src/components/AppSidebar.tsx` | Adicionar OfflineBanner |
| `src/components/GlobalSearch.tsx` | Desabilitar quando offline |
| `src/components/EntryTable.tsx` | Desabilitar botões de ação |
| `src/components/SaleTable.tsx` | Desabilitar botões de ação |
| `public/sw.js` | Service Worker gerenciado pelo Workbox |

## UX

### Online (status quo)
- App funciona normalmente
- Dados sincronizados com Supabase

### Offline
- Banner discreto no topo: "Sem conexão — dados salvos localmente"
- Botões de criar/editar desabilitados com tooltip "Requer conexão"
- Dados em cache ainda visíveis (entradas, vendas, clientes, contas)
- Busca global funciona nos dados em cache

### Volta online
- Banner some automaticamente
- React Query refetch automático
- Botões reabilitam

## Critérios de aceite

- [ ] Service Worker registra e cacheia assets
- [ ] Hook `useOnlineStatus()` funciona
- [ ] Banner aparece quando offline
- [ ] Botões de ação desabilitados offline
- [ ] Dados em cache visíveis offline
- [ ] Refetch automático ao voltar online
- [ ] Testes unitários para hook e componente
- [ ] Build não quebra

## Referência

- Council: `docs/council/2026-07-09-modo-offline-veredito.md`
- Workbox: https://developer.chrome.com/docs/workbox/
