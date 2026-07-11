# Mobile Responsiveness — Design Spec

## Summary
Improve mobile UX for MilesControl with bottom tab navigation, drawer-based forms, and card-style list items on small screens (<768px). Desktop experience remains unchanged.

## Approach
**Chosen:** Enhanced Mobile UX (Approach B) — balance of impact vs effort.

## Changes

### 1. Bottom Tab Navigation
- **Mobile** (<768px): Sidebar hidden (`hidden md:flex`). Bottom tab bar (`fixed bottom-0 inset-x-0 h-16`) with 5 primary tabs:
  - Resumo (`/`), Entradas (`/entradas`), Vendas (`/vendas`), Clientes (`/clientes`), Ajustes (`/configuracoes`)
- **Header**: `SidebarTrigger` (hamburger) opens Sheet overlay for secondary items (Programas, Sair)
- **Desktop** (>=768px): Everything stays as-is (sidebar collapsible)
- Main content gets `pb-16` on mobile to account for tab bar

### 2. Drawer-based Forms
- **Mobile**: Replace `Dialog` with `Drawer` (bottom sheet via `vaul`, already in deps) for create/edit forms
- **Desktop**: Keep existing `Dialog`
- New wrapper component `FormDrawer` that switches based on `useIsMobile()`
- Components updated: NewEntryDialog, NewSaleDialog, ClientDialog, ProgramDialog

### 3. Card-style List Items
- **Mobile**: Each table row becomes a stacked card with data fields + action buttons
- **Desktop**: `<Table>` unchanged
- Classes pattern: `hidden md:table-cell` for table content, `md:hidden block` for card content
- All interactive targets `min-h-[44px]` / `min-w-[44px]` for touch

### 4. Quick Wins (included from Approach A)
- `overflow-x-auto` on all table wrappers
- Touch target audit (buttons, links, icons)
- Responsive padding/spacing adjustments
- Sticky search/filter bars on list pages

## Files to Modify
- `src/components/AppSidebar.tsx` — add bottom tabs, hide sidebar on mobile
- `src/components/ui/sidebar.tsx` — verify `useIsMobile` integration
- `src/App.tsx` — layout adjustments, `pb-16` on main
- `src/components/FormDrawer.tsx` — NEW: wrapper switching Dialog/Drawer
- `src/components/ui/drawer.tsx` — verify existing shadcn Drawer
- `src/pages/Entradas.tsx` — card list, overflow-x-auto, useFormDrawer
- `src/pages/Vendas.tsx` — card list, overflow-x-auto, useFormDrawer
- `src/pages/Clientes.tsx` — card list, overflow-x-auto, useFormDrawer
- `src/hooks/use-mobile.tsx` — already exists, no changes needed

## Non-Goals
- Pull-to-refresh
- Animated page transitions
- Quick-add bottom sheet
- Service worker / offline support
- Tablet-specific layout (relies on md: breakpoint)

## Edge Cases
- **No user**: Login page already standalone, not affected
- **Bottom tab overflow**: 5 tabs at ~64px each = 320px, fits any phone >= 360px
- **Drawer close gesture**: `vaul` handles native drag-to-dismiss; also has close button
- **Programs page**: Only accessible via Sheet on mobile (secondary nav)
